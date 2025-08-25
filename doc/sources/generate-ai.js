#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

// Simple fetch polyfill for Node.js with timeout
function nodeFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const timeout = options.timeout || 30000; // 30 second default timeout
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: timeout
        };
        
        const req = protocol.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: () => {
                        try {
                            return Promise.resolve(JSON.parse(data));
                        } catch (e) {
                            console.log('Failed to parse JSON:', data.substring(0, 200));
                            return Promise.reject(e);
                        }
                    },
                    text: () => Promise.resolve(data)
                });
            });
        });
        
        req.on('timeout', () => {
            req.abort();
            reject(new Error(`Request timeout after ${timeout}ms`));
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// Use native fetch if available, otherwise use polyfill
const fetch = global.fetch || nodeFetch;

// Load global configuration
let GLOBAL_CONFIG = {};
try {
    const globalConfigPath = path.join(__dirname, 'global-config.json');
    const configData = require('fs').readFileSync(globalConfigPath, 'utf8');
    GLOBAL_CONFIG = JSON.parse(configData);
} catch (error) {
    console.log('Warning: Could not load global-config.json, using environment variables');
    GLOBAL_CONFIG = {
        apiKeys: {},
        defaultProvider: 'openai',
        defaultModels: {},
        promotionalBanner: {
            enabled: false,
            defaultText: 'Powered by Axiologic.news',
            defaultUrl: 'https://axiologic.news'
        },
        contentSettings: {
            maxPostsPerFeed: 10,
            maxTokensPerRequest: 500,
            contentFetchTimeout: 10000,
            requestTimeout: 30000,
            historyDays: 30
        }
    };
}

// Configuration for AI providers
const AI_CONFIG = {
    provider: process.env.AI_PROVIDER || GLOBAL_CONFIG.defaultProvider || 'openai',
    ollamaHost: process.env.OLLAMA_HOST || GLOBAL_CONFIG.ollamaHost || 'http://localhost:11434'
};

// Get the appropriate API key based on provider
function getApiKey() {
    const provider = AI_CONFIG.provider.toLowerCase();
    
    // First check environment variables
    let envKey = '';
    if (provider === 'mistral') {
        envKey = process.env.MISTRAL_API_KEY || process.env.AI_API_KEY || '';
    } else if (provider === 'gemini') {
        envKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
    } else if (provider === 'claude' || provider === 'anthropic') {
        envKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY || '';
    } else if (provider === 'openai') {
        envKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '';
    } else {
        envKey = process.env.AI_API_KEY || '';
    }
    
    // If no env key, use from global config
    if (!envKey && GLOBAL_CONFIG.apiKeys) {
        return GLOBAL_CONFIG.apiKeys[provider] || '';
    }
    
    return envKey;
}

// Get the appropriate model based on provider
function getModel() {
    const provider = AI_CONFIG.provider.toLowerCase();
    const customModel = process.env.AI_MODEL;
    
    if (customModel) return customModel;
    
    // Check global config for default model
    if (GLOBAL_CONFIG.defaultModels && GLOBAL_CONFIG.defaultModels[provider]) {
        return GLOBAL_CONFIG.defaultModels[provider];
    }
    
    // Fallback to hardcoded defaults
    switch(provider) {
        case 'mistral':
            return 'mistral-large-latest';
        case 'gemini':
            return 'gemini-pro';
        case 'claude':
        case 'anthropic':
            return 'claude-3-haiku-20240307';
        case 'openai':
            return 'gpt-4o-mini';
        case 'ollama':
            return 'llama2';
        default:
            return 'gpt-4o-mini';
    }
}

// Get promotional banner for a category
function getPromoBanner(category) {
    if (!GLOBAL_CONFIG.promotionalBanner || !GLOBAL_CONFIG.promotionalBanner.enabled) {
        return null;
    }
    
    const banner = GLOBAL_CONFIG.promotionalBanner;
    const custom = banner.customBanners && banner.customBanners[category];
    
    if (custom) {
        return {
            text: custom.text || banner.defaultText,
            url: custom.url || banner.defaultUrl
        };
    }
    
    return {
        text: banner.defaultText,
        url: banner.defaultUrl
    };
}

// AI Service wrapper
class AIService {
    async analyze(prompt, maxTokens = null) {
        // Use global config or default
        if (!maxTokens) {
            maxTokens = GLOBAL_CONFIG.contentSettings?.maxTokensPerRequest || 500;
        }
        const provider = AI_CONFIG.provider.toLowerCase();
        
        switch(provider) {
            case 'ollama':
                return this.ollamaRequest(prompt, maxTokens);
            case 'openai':
                return this.openaiRequest(prompt, maxTokens);
            case 'anthropic':
            case 'claude':
                return this.anthropicRequest(prompt, maxTokens);
            case 'mistral':
                return this.mistralRequest(prompt, maxTokens);
            case 'gemini':
                return this.geminiRequest(prompt, maxTokens);
            default:
                console.log(`Unknown provider ${provider}`);
                return null;
        }
    }

    async ollamaRequest(prompt, maxTokens) {
        try {
            const response = await fetch(`${AI_CONFIG.ollamaHost}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: getModel(),
                    prompt: prompt,
                    stream: false,
                    options: { num_predict: maxTokens }
                })
            });
            const data = await response.json();
            return data.response || null;
        } catch (error) {
            console.log(`Ollama not available: ${error.message}`);
            return null;
        }
    }

    async openaiRequest(prompt, maxTokens) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.log('No OpenAI API key found');
            return null;
        }
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: getModel(),
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature: 0.7
                })
            });
            const data = await response.json();
            if (data.error) {
                console.log(`OpenAI API error: ${data.error.message}`);
                return null;
            }
            const content = data.choices?.[0]?.message?.content;
            return content || null;
        } catch (error) {
            console.log(`OpenAI error: ${error.message}`);
            return null;
        }
    }

    async anthropicRequest(prompt, maxTokens) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.log('No Claude/Anthropic API key found');
            return null;
        }
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: getModel(),
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens
                })
            });
            const data = await response.json();
            if (data.error) {
                console.log(`Claude API error: ${data.error.message}`);
                return null;
            }
            const content = data.content?.[0]?.text;
            return content || null;
        } catch (error) {
            console.log(`Claude error: ${error.message}`);
            return null;
        }
    }

    async mistralRequest(prompt, maxTokens) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.log('No Mistral API key found');
            return null;
        }
        try {
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: getModel(),
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature: 0.7
                })
            });
            const data = await response.json();
            if (data.error) {
                console.log(`Mistral API error: ${data.error?.message || JSON.stringify(data.error)}`);
                return null;
            }
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                console.log(`Mistral returned empty response. Data structure: ${JSON.stringify(data).substring(0, 200)}`);
                return null;
            }
            return content;
        } catch (error) {
            console.log(`Mistral error: ${error.message}`);
            return null;
        }
    }

    async geminiRequest(prompt, maxTokens) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.log('No Gemini API key found');
            return null;
        }
        try {
            const model = getModel();
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: maxTokens,
                        temperature: 0.7
                    }
                })
            });
            const data = await response.json();
            if (data.error) {
                console.log(`Gemini API error: ${data.error.message}`);
                return null;
            }
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return content || null;
        } catch (error) {
            console.log(`Gemini error: ${error.message}`);
            return null;
        }
    }

    fallbackAnalysis(prompt) {
        // No fallback - return null if AI not available
        console.log('      AI not available - skipping');
        return null;
    }

    // Removed extractKeywords - no longer needed without fallback
}

// Content fetcher to get full article content
class ContentFetcher {
    async fetchFullContent(url) {
        try {
            const html = await this.fetchHTML(url);
            return this.extractContent(html);
        } catch (error) {
            console.log(`  Could not fetch full content: ${error.message}`);
            return null;
        }
    }

    async fetchHTML(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            protocol.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return this.fetchHTML(res.headers.location).then(resolve).catch(reject);
                }
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }

    extractContent(html) {
        // Extract main content from HTML
        const content = {
            text: '',
            comments: [],
            metadata: {}
        };

        // Remove scripts and styles
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

        // Extract article content (common selectors)
        const articleSelectors = [
            /<article[^>]*>([\s\S]*?)<\/article>/gi,
            /<main[^>]*>([\s\S]*?)<\/main>/gi,
            /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
        ];

        for (const selector of articleSelectors) {
            const match = html.match(selector);
            if (match && match[0]) {
                content.text = this.cleanText(match[0]);
                break;
            }
        }

        // Extract comments if present
        const commentSelectors = [
            /<div[^>]*class="[^"]*comment[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            /<section[^>]*class="[^"]*comments[^"]*"[^>]*>([\s\S]*?)<\/section>/gi
        ];

        for (const selector of commentSelectors) {
            const matches = html.matchAll(selector);
            for (const match of matches) {
                const comment = this.cleanText(match[0]);
                if (comment.length > 20) {
                    content.comments.push(comment.substring(0, 200));
                }
            }
        }

        // Extract metadata
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch) content.metadata.title = this.cleanText(titleMatch[1]);

        const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i);
        if (authorMatch) content.metadata.author = authorMatch[1];

        return content;
    }

    cleanText(html) {
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim()
            .substring(0, 2000); // Limit to 2000 chars
    }
}

// RSS fetcher and parser
async function fetchRSS(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader/2.0)'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseRSSItem(item) {
    const getTextContent = (tag) => {
        const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        if (match && match[1]) {
            return match[1]
                .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
                .replace(/<[^>]+>/g, '')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
        }
        return '';
    };

    return {
        title: getTextContent('title'),
        description: getTextContent('description') || getTextContent('summary'),
        link: getTextContent('link'),
        pubDate: getTextContent('pubDate') || getTextContent('published'),
        category: getTextContent('category'),
        author: getTextContent('author') || getTextContent('dc:creator')
    };
}

function parseRSS(xml) {
    const items = [];
    const itemMatches = xml.matchAll(/<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi);

    for (const match of itemMatches) {
        const item = parseRSSItem(match[0]);
        if (item.title) {
            item.pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
            items.push(item);
        }
    }

    return items.sort((a, b) => b.pubDate - a.pubDate);
}

function generatePostId(title, link) {
    return crypto.createHash('md5').update(title + link).digest('hex');
}

// Main story processor
class StoryProcessor {
    constructor(config, aiService, contentFetcher) {
        this.config = config;
        this.ai = aiService;
        this.fetcher = contentFetcher;
    }

    async processStories(items, feed, existingIds) {
        const newPosts = [];
        const maxPosts = GLOBAL_CONFIG.contentSettings?.maxPostsPerFeed || 10;
        const contentTimeout = GLOBAL_CONFIG.contentSettings?.contentFetchTimeout || 10000;
        
        // First, filter stories using AI
        const filteredItems = await this.filterWithAI(items, feed);
        
        // Limit items to process
        const itemsToProcess = filteredItems.slice(0, maxPosts);
        console.log(`  Processing ${itemsToProcess.length} filtered items...`);
        
        for (let i = 0; i < itemsToProcess.length; i++) {
            const item = itemsToProcess[i];
            const postId = generatePostId(item.title, item.link);
            
            if (existingIds.has(postId)) {
                continue;
            }

            console.log(`    [${i+1}/${itemsToProcess.length}] ${item.title.substring(0, 50)}...`);
            
            // Fetch full content if possible (with timeout)
            let fullContent = null;
            try {
                fullContent = await Promise.race([
                    this.fetcher.fetchFullContent(item.link),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Content fetch timeout')), contentTimeout)
                    )
                ]);
            } catch (e) {
                // Continue without full content
            }
            
            // Generate the post with AI-enhanced content
            const post = await this.createEnhancedPost(item, feed, fullContent);
            
            if (post) {
                newPosts.push(post);
                existingIds.add(postId);
            }
        }
        
        return newPosts;
    }

    async filterWithAI(items, feed) {
        if (!this.config.selectionPrompt) {
            // No AI filtering, return top items
            return items.slice(0, this.config.topPostsPerFeed || 5);
        }

        const titlesAndDescriptions = items.slice(0, 20).map((item, idx) => 
            `${idx + 1}. ${item.title}\n   ${(item.description || '').substring(0, 100)}`
        ).join('\n\n');

        const prompt = `${this.config.selectionPrompt}

Feed: ${feed.name}
Available stories:
${titlesAndDescriptions}

Select the ${this.config.topPostsPerFeed || 5} most interesting and relevant stories.
Return only the numbers (comma-separated) of the selected stories.`;

        const response = await this.ai.analyze(prompt, 100);
        
        if (!response || response === null) {
            console.log(`      AI not available for filtering - taking top items`);
            return items.slice(0, this.config.topPostsPerFeed || 5);
        }
        
        // Parse AI response to get selected indices
        const selectedIndices = this.parseSelection(response, items.length);
        
        if (selectedIndices.length === 0) {
            // If parsing fails, take top items
            return items.slice(0, this.config.topPostsPerFeed || 5);
        }
        
        return selectedIndices.map(idx => items[idx]).filter(Boolean);
    }

    parseSelection(response, maxIndex) {
        const numbers = response.match(/\d+/g) || [];
        return numbers
            .map(n => parseInt(n) - 1) // Convert to 0-based index
            .filter(n => n >= 0 && n < maxIndex)
            .slice(0, this.config.topPostsPerFeed || 5);
    }

    async createEnhancedPost(item, feed, fullContent) {
        const post = {
            id: generatePostId(item.title, item.link),
            title: item.title,
            source: item.link,
            generatedAt: new Date().toISOString(),
            feedName: feed.name,
            author: item.author || feed.name,
            category: item.category || 'General'
        };

        // Generate essence using AI
        const essence = await this.generateEssence(item, fullContent);
        if (!essence) {
            console.log(`      Skipping post due to AI unavailability`);
            return null; // Skip this post if AI is not available
        }
        post.essence = essence;
        
        // Generate perspectives/reactions using AI
        const reactions = await this.generatePerspectives(item, feed, fullContent);
        if (!reactions) {
            console.log(`      Skipping post due to AI unavailability`);
            return null; // Skip this post if AI is not available
        }
        post.reactions = reactions;
        
        // Add promo banner from global config or use feed default
        const globalBanner = getPromoBanner(this.config.category || 'default');
        if (globalBanner) {
            post.promoBanner = globalBanner;
        } else {
            post.promoBanner = {
                text: feed.name,
                url: item.link
            };
        }

        return post;
    }

    async generateEssence(item, fullContent) {
        if (!this.config.essencePrompt) {
            // Use description or extract from content
            if (fullContent && fullContent.text) {
                return fullContent.text.substring(0, 500);
            }
            return item.description ? item.description.substring(0, 500) : '';
        }

        const content = fullContent?.text || item.description || '';
        const prompt = `${this.config.essencePrompt}

Title: ${item.title}
Content: ${content.substring(0, 1000)}

Write a compelling essence/summary in plain text only - no markdown, no asterisks, no formatting (max 500 chars):`;

        try {
            const response = await this.ai.analyze(prompt, 150);
            if (!response || response === null) {
                console.log(`      AI not available - skipping essence generation`);
                return null;
            }
            // Clean and validate the response
            let cleaned = response.trim()
                .replace(/\*\*/g, '') // Remove markdown bold
                .replace(/\*/g, '') // Remove markdown italic
                .replace(/^#+\s*/gm, '') // Remove markdown headers
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
                .trim();
            
            if (cleaned && cleaned.length > 20) {
                return cleaned.substring(0, 500);
            }
            return null;
        } catch (error) {
            console.log(`      Failed to generate essence: ${error.message}`);
            return null;
        }
    }

    async generatePerspectives(item, feed, fullContent) {
        if (!this.config.perspectivesPrompt) {
            return [
                `Key insights from ${feed.name}`,
                `Why this matters to our readers`,
                `Implications and future outlook`
            ];
        }

        const content = fullContent?.text || item.description || '';
        const comments = fullContent?.comments?.join('\n') || '';
        
        const prompt = `${this.config.perspectivesPrompt}

Title: ${item.title}
Source: ${feed.name}
Content: ${content.substring(0, 800)}
${comments ? `\nReader Comments:\n${comments.substring(0, 400)}` : ''}

Generate 3 unique perspectives/reactions. Use plain text only - no markdown, no asterisks, no quotes, no formatting. One clear sentence per perspective:`;

        try {
            const response = await this.ai.analyze(prompt, 300);
            
            if (!response || response === null) {
                console.log(`      AI not available - skipping perspectives generation`);
                return null;
            }
            
            // Parse response into 3 perspectives
            const lines = response.split('\n')
                .map(l => l.trim())
                .filter(l => l && l.length > 10); // Filter out empty lines
            
            const perspectives = [];
            
            // Extract up to 3 meaningful perspectives
            for (let i = 0; i < Math.min(3, lines.length); i++) {
                let cleaned = lines[i]
                    .replace(/^[\d\-\*\•]+\.?\s*/, '') // Remove numbered lists and bullet points
                    .replace(/\*\*/g, '') // Remove all markdown bold formatting
                    .replace(/\*/g, '') // Remove all markdown italic formatting
                    .replace(/^["']/g, '') // Remove leading quotes
                    .replace(/["']$/g, '') // Remove trailing quotes
                    .replace(/^###?\s*/g, '') // Remove markdown headers
                    .trim();
                
                if (cleaned && cleaned.length > 15 && !cleaned.startsWith('Perspective')) {
                    perspectives.push(cleaned);
                }
            }
            
            // If we have less than 3 good perspectives, try a simpler approach
            if (perspectives.length < 3) {
                const simplePrompts = [
                    `What makes "${item.title}" important for investors?`,
                    `Key takeaway from "${item.title}" for founders:`,
                    `Market impact of "${item.title}":`
                ];
                
                for (let i = perspectives.length; i < 3; i++) {
                    try {
                        const response = await this.ai.analyze(simplePrompts[i], 100);
                        if (response && response !== null) {
                            // Clean the response
                            let cleaned = response.trim()
                                .replace(/\*\*/g, '')
                                .replace(/\*/g, '')
                                .replace(/^["']/g, '')
                                .replace(/["']$/g, '')
                                .substring(0, 200);
                            
                            perspectives.push(cleaned);
                        } else {
                            // AI not available - return null
                            return null;
                        }
                    } catch {
                        // AI failed - return null
                        return null;
                    }
                }
            }
            
            // Return simple array of strings
            return perspectives.slice(0, 3);
        } catch (error) {
            console.log(`      Failed to generate perspectives: ${error.message}`);
            return null;
        }
    }
}

// History manager to track processed stories
class HistoryManager {
    constructor(historyPath) {
        this.historyPath = historyPath;
        this.history = new Map();
    }

    async load() {
        try {
            const data = await fs.readFile(this.historyPath, 'utf8');
            const entries = JSON.parse(data);
            this.history = new Map(entries);
        } catch {
            this.history = new Map();
        }
    }

    async save() {
        const entries = Array.from(this.history.entries());
        await fs.writeFile(this.historyPath, JSON.stringify(entries, null, 2));
    }

    hasProcessed(id, withinDays = 30) {
        const timestamp = this.history.get(id);
        if (!timestamp) return false;
        
        const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        return daysSince < withinDays;
    }

    markProcessed(id) {
        this.history.set(id, Date.now());
    }

    cleanup(olderThanDays = 30) {
        const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        for (const [id, timestamp] of this.history.entries()) {
            if (timestamp < cutoff) {
                this.history.delete(id);
            }
        }
    }
}

// Configuration loader with enhanced format
async function loadEnhancedConfig(configPath) {
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    
    // Set defaults for new fields
    config.selectionPrompt = config.selectionPrompt || '';
    config.perspectivesPrompt = config.perspectivesPrompt || '';
    config.essencePrompt = config.essencePrompt || '';
    config.topPostsPerFeed = config.topPostsPerFeed || 5;
    config.historyDays = config.historyDays || 30;
    
    return config;
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const sourcesDir = path.join(__dirname);
    
    // Initialize services
    const aiService = new AIService();
    const contentFetcher = new ContentFetcher();
    
    // Determine folders to process
    const folders = [];
    if (args.length === 0 || args[0] === 'all') {
        const entries = await fs.readdir(sourcesDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const configPath = path.join(sourcesDir, entry.name, 'config.json');
                try {
                    await fs.access(configPath);
                    folders.push(path.join(sourcesDir, entry.name));
                } catch {}
            }
        }
    } else {
        folders.push(path.join(sourcesDir, args[0]));
    }

    console.log(`Processing ${folders.length} source folder(s)...`);
    console.log(`AI Provider: ${AI_CONFIG.provider}`);
    console.log(`Model: ${getModel()}`);
    
    const apiKey = getApiKey();
    if (apiKey) {
        console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.length > 10 ? ' (found)' : ''}`);
    } else {
        console.log(`API Key: Not found - will use fallback mode`);
    }
    console.log('');

    let totalNew = 0;
    let totalProcessed = 0;

    for (const folder of folders) {
        const configPath = path.join(folder, 'config.json');
        const postsPath = path.join(folder, 'posts.json');
        const historyPath = path.join(folder, '.history.json');
        
        console.log(`\n=== ${path.basename(folder).toUpperCase()} ===`);
        
        try {
            // Load configuration and history
            const config = await loadEnhancedConfig(configPath);
            config.category = path.basename(folder); // Add category from folder name
            
            const history = new HistoryManager(historyPath);
            await history.load();
            
            // Load existing posts
            let existingPosts = [];
            try {
                const data = await fs.readFile(postsPath, 'utf8');
                existingPosts = JSON.parse(data);
            } catch {}
            
            const existingIds = new Set(existingPosts.map(p => p.id));
            
            // Create processor
            const processor = new StoryProcessor(config, aiService, contentFetcher);
            
            // Process each feed
            const newPosts = [];
            for (const feed of config.feeds) {
                if (!feed.enabled) {
                    console.log(`Skipping disabled feed: ${feed.name}`);
                    continue;
                }
                
                console.log(`\nProcessing ${feed.name}...`);
                
                try {
                    // Fetch RSS
                    const rssData = await fetchRSS(feed.url);
                    const items = parseRSS(rssData);
                    
                    if (items.length === 0) {
                        console.log(`  No items found`);
                        continue;
                    }
                    
                    console.log(`  Found ${items.length} items`);
                    
                    // Filter out recently processed items
                    const unprocessedItems = items.filter(item => {
                        const id = generatePostId(item.title, item.link);
                        return !history.hasProcessed(id, config.historyDays);
                    });
                    
                    console.log(`  ${unprocessedItems.length} not recently processed`);
                    
                    // Process stories with AI
                    const feedPosts = await processor.processStories(
                        unprocessedItems, 
                        feed, 
                        existingIds
                    );
                    
                    // Mark as processed
                    for (const post of feedPosts) {
                        history.markProcessed(post.id);
                        newPosts.push(post);
                    }
                    
                    console.log(`  Generated ${feedPosts.length} new posts`);
                    totalProcessed += items.length;
                    
                } catch (error) {
                    console.error(`  Error: ${error.message}`);
                }
            }
            
            // Save results
            if (newPosts.length > 0) {
                const allPosts = [...newPosts, ...existingPosts];
                await fs.writeFile(postsPath, JSON.stringify(allPosts, null, 2));
                console.log(`\n✓ Saved ${newPosts.length} new posts to ${path.basename(folder)}/posts.json`);
                totalNew += newPosts.length;
            } else {
                console.log(`\n✓ No new posts for ${path.basename(folder)}`);
            }
            
            // Cleanup old history and save
            history.cleanup(config.historyDays * 2);
            await history.save();
            
        } catch (error) {
            console.error(`Error processing ${path.basename(folder)}: ${error.message}`);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`SUMMARY: Generated ${totalNew} new posts from ${totalProcessed} items`);
    console.log(`Folders processed: ${folders.length}`);
}

// Run if executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { AIService, ContentFetcher, StoryProcessor, HistoryManager };