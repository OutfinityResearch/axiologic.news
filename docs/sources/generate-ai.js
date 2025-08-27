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
            historyDays: 5
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

    // Define provider-specific environment variables
    const providerEnvVars = {
        mistral: ['MISTRAL_API_KEY'],
        gemini: ['GEMINI_API_KEY'],
        claude: ['CLAUDE_API_KEY', 'ANTHROPIC_API_KEY'],
        anthropic: ['CLAUDE_API_KEY', 'ANTHROPIC_API_KEY'],
        openai: ['OPENAI_API_KEY'],
        groq: ['GROQ_API_KEY']
    };

    // 1. Check provider-specific environment variables first
    if (providerEnvVars[provider]) {
        for (const key of providerEnvVars[provider]) {
            if (process.env[key]) {
                return process.env[key];
            }
        }
    }

    // 2. Check generic AI_API_KEY environment variable
    if (process.env.AI_API_KEY) {
        return process.env.AI_API_KEY;
    }

    // 3. Check global config for placeholder or literal key
    if (GLOBAL_CONFIG.apiKeys && GLOBAL_CONFIG.apiKeys[provider]) {
        const configValue = GLOBAL_CONFIG.apiKeys[provider];
        if (configValue.startsWith('$')) {
            const envVarName = configValue.substring(1);
            return process.env[envVarName] || '';
        }
        // It's a literal key from the config
        return configValue;
    }

    return ''; // No key found
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
            maxTokens = GLOBAL_CONFIG.contentSettings?.maxTokensPerRequest || 800;
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
            /<article[^>]*>([\n\s\S]*?)<\/article>/gi,
            /<main[^>]*>([\n\s\S]*?)<\/main>/gi,
            /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\n\s\S]*?)<\/div>/gi,
            /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\n\s\S]*?)<\/div>/gi
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
            /<div[^>]*class="[^"]*comment[^"]*"[^>]*>([\n\s\S]*?)<\/div>/gi,
            /<section[^>]*class="[^"]*comments[^"]*"[^>]*>([\n\s\S]*?)<\/section>/gi
        ];

        for (const selector of commentSelectors) {
            const matches = html.matchAll(selector);
            for (const match of matches) {
                const comment = this.cleanText(match[0]);
                if (comment.length > 20) {
                    content.comments.push(comment.substring(0, 1000));
                }
            }
        }

        // Extract metadata
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) content.metadata.title = this.cleanText(titleMatch[1]);

        const authorMatch = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i);
        if (authorMatch) content.metadata.author = authorMatch[1];

        return content;
    }

    cleanText(html) {
        if (!html) return '';
        
        // Remove CSS class patterns common in Reddit and other feeds
        html = html.replace(/\[&[^\]]+\]/g, '');
        html = html.replace(/class="[^"]*"/g, '');
        html = html.replace(/style="[^"]*"/g, '');
        
        // Remove script and style content
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Convert breaks and paragraphs to spaces
        html = html.replace(/<br\s*\/?>/gi, ' ');
        html = html.replace(/<\/p>/gi, ' ');
        html = html.replace(/<\/div>/gi, ' ');
        
        // Remove all HTML tags
        html = html.replace(/<[^>]+>/g, ' ');
        
        // Comprehensive HTML entity decoding
        html = html
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&#([0-9]+);/g, (match, num) => String.fromCharCode(num))
            .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            .replace(/&hellip;/g, '...')
            .replace(/&bull;/g, '•');
        
        // Clean whitespace
        html = html
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 20000); // Allow up to 20k chars for full content
        
        return html;
    }
}

// RSS fetcher and parser with timeout and redirect handling
async function fetchRSS(url, timeout = 15000) {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Axiologic RSS Reader/2.0)',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                },
                timeout: timeout
            };

            const req = protocol.get(url, options, (res) => {
                // Handle redirects
                if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
                    const redirectUrl = res.headers.location;
                    if (redirectUrl) {
                        console.log(`    Following redirect to: ${redirectUrl}`);
                        return fetchRSS(redirectUrl, timeout).then(resolve).catch(reject);
                    }
                }
                
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (data.length === 0) {
                        reject(new Error('Empty RSS feed'));
                    } else {
                        resolve(data);
                    }
                });
            });
            
            req.on('timeout', () => {
                req.abort();
                reject(new Error(`RSS fetch timeout after ${timeout}ms`));
            });
            
            req.on('error', (err) => {
                reject(new Error(`Network error: ${err.message}`));
            });
        } catch (err) {
            reject(new Error(`Invalid URL or fetch error: ${err.message}`));
        }
    });
}

function parseRSSItem(item) {
    const cleanHtmlText = (text) => {
        if (!text) return '';
        
        // Remove CDATA sections
        text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
        
        // Remove CSS class attributes (common in Reddit feeds)
        text = text.replace(/\[&[^\]]+\]/g, '');
        text = text.replace(/class="[^"]*"/g, '');
        text = text.replace(/style="[^"]*"/g, '');
        
        // Remove script and style tags with their content
        text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Convert common HTML tags to spaces for readability
        text = text.replace(/<br\s*\/?>/gi, ' ');
        text = text.replace(/<\/p>/gi, ' ');
        text = text.replace(/<\/div>/gi, ' ');
        text = text.replace(/<\/li>/gi, ' ');
        
        // Remove all remaining HTML tags
        text = text.replace(/<[^>]+>/g, ' ');
        
        // Decode HTML entities (comprehensive list)
        text = text
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&#([0-9]+);/g, (match, num) => String.fromCharCode(num))
            .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            .replace(/&hellip;/g, '...')
            .replace(/&bull;/g, '•')
            .replace(/&copy;/g, '©')
            .replace(/&reg;/g, '®')
            .replace(/&trade;/g, '™');
        
        // Clean up whitespace
        text = text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
        
        return text;
    };
    
    const getTextContent = (tag) => {
        // Try multiple tag patterns for better compatibility
        const patterns = [
            new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
            new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
        ];
        
        for (const pattern of patterns) {
            const match = item.match(pattern);
            if (match && match[1]) {
                return cleanHtmlText(match[1]);
            }
        }
        
        // For link tags, also try href attribute (Atom feeds)
        if (tag === 'link') {
            const hrefMatch = item.match(/<link[^>]*href="([^"]+)"/i);
            if (hrefMatch && hrefMatch[1]) {
                return hrefMatch[1].trim();
            }
        }
        
        return '';
    };

    return {
        title: getTextContent('title'),
        description: getTextContent('description') || getTextContent('summary') || getTextContent('content'),
        link: getTextContent('link') || getTextContent('guid'),
        pubDate: getTextContent('pubDate') || getTextContent('published') || getTextContent('updated'),
        category: getTextContent('category'),
        author: getTextContent('author') || getTextContent('dc:creator') || getTextContent('creator')
    };
}

function parseRSS(xml) {
    const items = [];
    
    // Support both RSS and Atom feeds
    const itemMatches = xml.matchAll(/<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi);

    for (const match of itemMatches) {
        try {
            const item = parseRSSItem(match[0]);
            if (item.title && item.link) {
                // Parse date more robustly
                if (item.pubDate) {
                    const parsedDate = new Date(item.pubDate);
                    item.pubDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
                } else {
                    item.pubDate = new Date();
                }
                items.push(item);
            }
        } catch (err) {
            console.log(`    Warning: Failed to parse RSS item: ${err.message}`);
        }
    }

    return items.sort((a, b) => b.pubDate - a.pubDate);
}

function generatePostId(title, link) {
    // Use just the link URL for ID generation to ensure uniqueness
    // This prevents duplicate posts even if title changes
    return crypto.createHash('md5').update(link).digest('hex');
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
            
            // Double-check ID doesn't exist
            if (existingIds.has(postId)) {
                console.log(`    Skipping duplicate: ${item.title.substring(0, 30)}...`);
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
            publishedAt: (item.pubDate && item.pubDate.toISOString) ? item.pubDate.toISOString() : undefined,
            feedName: feed.name,
            author: item.author || feed.name,
            category: item.category || 'General'
        };

        // Generate essence using AI or fallback
        const essence = await this.generateEssence(item, fullContent);
        post.essence = this.buildFallbackEssence(essence, item, feed);
        
        // Generate perspectives/reactions using AI or fallback
        const reactions = await this.generatePerspectives(item, feed, fullContent);
        post.reactions = this.buildFallbackReactions(reactions, item, feed);
        
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

    // Build a robust essence, cleaning Reddit/aggregator boilerplate and ensuring readability
    buildFallbackEssence(aiEssence, item, feed) {
        const MIN_WORDS = 25;
        const raw = (aiEssence && aiEssence.trim().length > 0) ? aiEssence : (item.description || '');
        let text = String(raw || '').replace(/\s+/g, ' ').trim();
        // Remove common boilerplate from Reddit/aggregators
        const blacklist = [
            /linktree/ig,
            /members online/ig,
            /share\b/ig,
            /read more\b/ig,
            /go to\b/ig,
            /reddit'?s?\s+no\.?\s*1\s+seo\s+community/ig,
            /help ?hey/ig,
            /stay up to date/ig,
            /we'?ll work it out together/ig
        ];
        blacklist.forEach((re) => { text = text.replace(re, ''); });
        // Deduplicate repeated tokens
        text = text.replace(/\b(\w+)(\s+\1){2,}\b/gi, '$1');
        // Trim to a reasonable length
        const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
        const trimmed = sentences.slice(0, 3).join(' ');
        const fallback = trimmed && trimmed.length > 40 ? trimmed : `${item.title}. Source: ${feed.name}.`;
        // Ensure minimum words
        const wc = (fallback.match(/\b\w+\b/g) || []).length;
        if (wc >= MIN_WORDS) return fallback;
        // If still too short, append a compact context line
        const extra = ` This update highlights key points about "${item.title}" from ${feed.name}, focusing on practical implications and why it matters now.`;
        return (fallback + extra);
    }

    // Ensure reactions exist and each has 15+ words; otherwise build informative defaults
    buildFallbackReactions(reactions, item, feed) {
        const MIN_WORDS = 15;
        const ensure = (txt) => {
            const words = (String(txt || '').match(/\b\w+\b/g) || []).length;
            if (words >= MIN_WORDS) return txt;
            // Build a richer default line
            return `Context: ${item.title} — From ${feed.name}, here are practical implications, expected impact, and considerations for readers evaluating credibility, relevance, and next steps today.`;
        };
        if (!Array.isArray(reactions) || reactions.length === 0) {
            return [
                ensure(`What happened: ${item.title}. Why it matters for marketing teams and decision‑makers, with concrete takeaways and immediate next steps.`),
                ensure(`Impact: How this could affect performance, budgets, channels, workflows, or strategy; risks and trade‑offs leaders should weigh now.`),
                ensure(`Actionable: Practical experiments, measurement ideas, and checkpoints to validate results and avoid hype; guidance to get started responsibly.`)
            ];
        }
        return reactions.map(ensure);
    }

    async generateEssence(item, fullContent) {
        if (!this.config.essencePrompt) {
            // Use description or extract from content without truncation
            if (fullContent && fullContent.text && fullContent.text.trim()) {
                return fullContent.text;
            }
            if (item.description && item.description.trim()) {
                // Description is already cleaned by parseRSSItem
                return item.description;
            }
            return 'No content available';
        }

        const content = fullContent?.text || item.description || '';
        const prompt = `${this.config.essencePrompt}

Title: ${item.title}
Content: ${content.substring(0, 20000)}

Write a concise, compelling essence/summary (approximately 400-600 words) in plain text only — no markdown, no asterisks, no quotes. Keep it readable and informative. Focus on the key points and implications.`;

        try {
            const response = await this.ai.analyze(prompt, 800); // Allow more tokens for fuller content
            if (!response || response === null) {
                console.log(`      AI not available - using full cleaned description`);
                // Use full cleaned description when AI is not available
                const fallbackText = fullContent?.text || item.description || '';
                return fallbackText || 'No content available';
            }
            // Clean and validate the response
            let cleaned = response.trim()
                .replace(/\*\*/g, '') // Remove markdown bold
                .replace(/\*/g, '') // Remove markdown italic
                .replace(/^#+\s*/gm, '') // Remove markdown headers
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
                .trim();
            
            if (cleaned && cleaned.length > 20) {
                return cleaned; // Do not truncate; UI handles layout
            }
            return null;
        } catch (error) {
            console.log(`      Failed to generate essence: ${error.message}`);
            return null;
        }
    }

    async generatePerspectives(item, feed, fullContent) {
        if (!this.config.perspectivesPrompt) {
            // Default perspectives when no AI prompt configured
            return [
                `Latest update from ${feed.name}`,
                `Read more at the source for full details`,
                `Stay informed with curated technology news`
            ];
        }

        const content = fullContent?.text || item.description || '';
        const comments = fullContent?.comments?.join('\n') || '';
        
        const prompt = `${this.config.perspectivesPrompt}

Title: ${item.title}
Source: ${feed.name}
Content: ${content.substring(0, 20000)}
${comments ? `
Reader Comments:\n${comments.substring(0, 5000)}` : ''}

Generate 3 unique perspectives/reactions. Use plain text only - no markdown, no asterisks, no quotes, no formatting. One clear sentence per perspective:`;

        try {
            const response = await this.ai.analyze(prompt, 500);
            
            if (!response || response === null) {
                console.log(`      AI not available - using default perspectives`);
                // Fallback perspectives when AI is not available
                return [
                    `Article from ${feed.name}: ${item.title.substring(0, 100)}`,
                    `Published on ${item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'recently'}`,
                    `Visit the source for complete information`
                ];
            }
            
            // Parse response into 3 perspectives
            const lines = response.split('\n')
                .map(l => l.trim())
                .filter(l => l && l.length > 10); // Filter out empty lines
            
            const perspectives = [];
            
            // Extract up to 3 meaningful perspectives
            for (let i = 0; i < Math.min(3, lines.length); i++) {
                let cleaned = lines[i]
                    .replace(/^[\d\-\*•]+\.?\s*/, '') // Remove numbered lists and bullet points
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
                                ; // No truncation for perspectives
                            
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

// Post manager using posts.json as the source of truth
class PostManager {
    constructor(postsPath, historyDays = 5) {
        this.postsPath = postsPath;
        this.historyDays = historyDays;
        this.posts = [];
        this.postIds = new Set();
    }

    async load() {
        try {
            const data = await fs.readFile(this.postsPath, 'utf8');
            this.posts = JSON.parse(data);
            // Clean up old posts on load
            const before = this.posts.length;
            this.posts = this.cleanupOldPosts(this.posts);
            const removed = before - this.posts.length;
            if (removed > 0) {
                console.log(`  Removed ${removed} old post(s) (> ${this.historyDays} day(s)) during initial cleanup`);
            }
            // Build ID set for fast lookups
            this.postIds = new Set(this.posts.map(p => p.id));
        } catch {
            this.posts = [];
            this.postIds = new Set();
        }
    }

    async save(newPosts) {
        // Merge new posts with existing ones
        const allPosts = [...newPosts, ...this.posts];
        
        // Remove duplicates by ID (keep newest version)
        const uniqueMap = new Map();
        for (const post of allPosts) {
            if (!uniqueMap.has(post.id) || this.isNewer(post, uniqueMap.get(post.id))) {
                uniqueMap.set(post.id, post);
            }
        }
        
        // Convert back to array and clean old posts
        const beforeCleanupLen = uniqueMap.size;
        this.posts = this.cleanupOldPosts(Array.from(uniqueMap.values()));
        const removedOld = beforeCleanupLen - this.posts.length;
        if (removedOld > 0) {
            console.log(`  Removed ${removedOld} old post(s) (> ${this.historyDays} day(s))`);
        }
        
        // Sort by date (newest first)
        this.posts.sort((a, b) => {
            const dateA = new Date(a.publishedAt || a.generatedAt || 0).getTime();
            const dateB = new Date(b.publishedAt || b.generatedAt || 0).getTime();
            return dateB - dateA;
        });
        
        // Save to file
        await fs.writeFile(this.postsPath, JSON.stringify(this.posts, null, 2));
        
        // Update ID set
        this.postIds = new Set(this.posts.map(p => p.id));
    }

    cleanupOldPosts(posts) {
        const cutoff = Date.now() - (this.historyDays * 24 * 60 * 60 * 1000);
        return posts.filter(post => {
            const date = new Date(post.publishedAt || post.generatedAt || 0).getTime();
            return !isNaN(date) && date >= cutoff;
        });
    }

    isNewer(postA, postB) {
        const dateA = new Date(postA.publishedAt || postA.generatedAt || 0).getTime();
        const dateB = new Date(postB.publishedAt || postB.generatedAt || 0).getTime();
        return dateA > dateB;
    }

    hasPost(id) {
        return this.postIds.has(id);
    }

    getExistingIds() {
        return this.postIds;
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
    config.historyDays = config.historyDays || 5;
    
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

    // Prepare invalid RSS URL store
    const INVALID_URLS_PATH = path.join(__dirname, 'invalidUrls.json');
    let invalidStore = [];
    try {
        const raw = await fs.readFile(INVALID_URLS_PATH, 'utf8');
        invalidStore = JSON.parse(raw);
        if (!Array.isArray(invalidStore)) invalidStore = [];
    } catch { invalidStore = []; }

    const recordInvalid = async ({ url, name, category, message }) => {
        try {
            const now = new Date().toISOString();
            const idx = invalidStore.findIndex(e => e && e.url === url);
            if (idx >= 0) {
                const prev = invalidStore[idx];
                invalidStore[idx] = {
                    ...prev,
                    name: name || prev.name,
                    category: category || prev.category,
                    lastError: message || prev.lastError,
                    lastSeenAt: now,
                    count: (prev.count || 0) + 1
                };
            } else {
                invalidStore.push({ url, name: name || '', category: category || '', lastError: message || 'Unknown error', firstSeenAt: now, lastSeenAt: now, count: 1 });
            }
            await fs.writeFile(INVALID_URLS_PATH, JSON.stringify(invalidStore, null, 2));
        } catch (_) { /* ignore */ }
    };

    for (const folder of folders) {
        const configPath = path.join(folder, 'config.json');
        const postsPath = path.join(folder, 'posts.json');
        // No .history.json anymore — rely only on posts.json
        
        console.log(`\n=== ${path.basename(folder).toUpperCase()} ===`);
        
        try {
            // Load configuration
            const config = await loadEnhancedConfig(configPath);
            config.category = path.basename(folder); // Add category from folder name
            
            // Initialize post manager
            const historyDays = config.historyDays || GLOBAL_CONFIG.contentSettings?.historyDays || 30;
            const postManager = new PostManager(postsPath, historyDays);
            await postManager.load();
            
            console.log(`  Loaded ${postManager.posts.length} existing posts`);
            const existingIds = postManager.getExistingIds();
            
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
                    // Fetch RSS with timeout
                    const fetchTimeout = GLOBAL_CONFIG.contentSettings?.contentFetchTimeout || 15000;
                    console.log(`  Fetching RSS from: ${feed.url}`);
                    
                    const rssData = await fetchRSS(feed.url, fetchTimeout);
                    
                    if (!rssData || rssData.trim().length === 0) {
                        console.log('  Empty RSS response');
                        // Not recorded as a hard error per policy
                        continue;
                    }
                    
                    const items = parseRSS(rssData);
                    
                    if (items.length === 0) {
                        console.log('  No valid items found in RSS');
                        console.log(`  RSS data sample: ${rssData.substring(0, 200)}...`);
                        // Not recorded as a hard error per policy
                        continue;
                    }
                    
                    console.log(`  Found ${items.length} RSS items`);

                    // Filter out items older than historyDays to avoid generating then removing them
                    const cutoffMs = Date.now() - (historyDays * 24 * 60 * 60 * 1000);
                    const freshItems = items.filter(it => {
                        try {
                            const t = new Date(it.pubDate || it.published || it.updated || 0).getTime();
                            return !isNaN(t) && t >= cutoffMs;
                        } catch (_) { return false; }
                    });
                    if (freshItems.length === 0) {
                        console.log(`  0 within last ${historyDays} day(s) — skipping feed`);
                        // Not a true error; do not record
                        continue;
                    }
                    
                    // Filter out items that already exist in posts.json
                    const unprocessedItems = [];
                    let skippedCount = 0;
                    
                    for (const item of freshItems) {
                        const id = generatePostId(item.title, item.link);
                        if (!existingIds.has(id)) {
                            unprocessedItems.push(item);
                        } else {
                            skippedCount++;
                        }
                    }

                    console.log(`  ${skippedCount} already in posts.json, ${unprocessedItems.length} new items to process (within ${historyDays} day(s))`);
                    
                    if (unprocessedItems.length === 0) {
                        console.log(`  All items already processed`);
                        continue;
                    }
                    
                    // Process stories with AI
                    const feedPosts = await processor.processStories(
                        unprocessedItems, 
                        feed, 
                        existingIds
                    );
                    
                    // Collect new posts
                    for (const post of feedPosts) {
                        newPosts.push(post);
                    }
                    
                    console.log(`  Generated ${feedPosts.length} new posts`);
                    totalProcessed += items.length;
                    
                } catch (error) {
                    console.error(`  Error: ${error.message}`);
                    await recordInvalid({ url: feed.url, name: feed.name, category: config.category, message: error.message });
                }
            }
            
            // Save results
            if (newPosts.length > 0) {
                await postManager.save(newPosts);
                console.log(`\n✓ Saved ${newPosts.length} new posts to ${path.basename(folder)}/posts.json`);
                console.log(`  Total posts after cleanup: ${postManager.posts.length}`);
                totalNew += newPosts.length;
            } else {
                // Even if no new posts, save to cleanup old ones
                await postManager.save([]);
                console.log(`\n✓ No new posts for ${path.basename(folder)}`);
                console.log(`  Posts after cleanup: ${postManager.posts.length}`);
            }
            
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

module.exports = { AIService, ContentFetcher, StoryProcessor, PostManager };
