#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

const CONFIG_FILE = 'rss-config.json';
const POSTS_FILE = 'current_posts.json';
const LLM_KEYS_FILE = 'llm-keys.json';

class LLMAdapter {
    constructor(config) {
        this.config = config;
        this.providers = Object.entries(config.providers)
            .filter(([name, provider]) => provider.enabled && provider.apiKey)
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([name, provider]) => ({ name, ...provider }));
    }

    async generate(prompt, retryCount = 0) {
        if (!this.config.useLLM || this.providers.length === 0) {
            return null;
        }

        for (let i = retryCount; i < this.providers.length; i++) {
            const provider = this.providers[i];
            console.log(`    Trying LLM provider: ${provider.name}`);
            
            try {
                let result;
                const timeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 15000)
                );
                
                const apiCall = (async () => {
                    switch (provider.name) {
                        case 'gemini':
                            return await this.callGeminiAPI(prompt, provider);
                        case 'openrouter':
                            return await this.callOpenRouterAPI(prompt, provider);
                        case 'grok':
                            return await this.callGrokAPI(prompt, provider);
                        case 'mistral':
                            return await this.callMistralAPI(prompt, provider);
                    }
                })();
                
                result = await Promise.race([apiCall, timeout]);
                
                if (result) {
                    const parsed = this.parseResponse(result);
                    if (parsed) {
                        console.log(`      ✓ Success with ${provider.name}`);
                        return parsed;
                    }
                }
            } catch (error) {
                console.error(`      ✗ ${provider.name} failed: ${error.message.substring(0, 50)}`);
                if (i < this.providers.length - 1) {
                    console.log(`      → Trying next provider...`);
                }
            }
        }
        
        return null;
    }

    parseResponse(response) {
        try {
            let cleaned = response.trim();
            
            // Extract JSON from markdown code blocks if present
            const codeBlockMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                cleaned = codeBlockMatch[1].trim();
            }
            
            // Find JSON bounds
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            }
            
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('    Failed to parse LLM response:', error.message);
            return null;
        }
    }

    async callGeminiAPI(prompt, provider) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`;
        
        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt + '\n\nIMPORTANT: Respond with valid JSON only, no additional text.'
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 3000
                }
            })
        });

        const data = JSON.parse(response);
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }
        throw new Error('Invalid Gemini response');
    }

    async callOpenRouterAPI(prompt, provider) {
        const response = await this.makeRequest('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`,
                'HTTP-Referer': 'https://axiologic.news',
                'X-Title': 'Axiologic News'
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a news content analyzer. Always respond with valid JSON only.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8
            })
        });

        const data = JSON.parse(response);
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        }
        throw new Error('Invalid OpenRouter response');
    }

    async callGrokAPI(prompt, provider) {
        const response = await this.makeRequest('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a news content analyzer. Always respond with valid JSON only.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8
            })
        });

        const data = JSON.parse(response);
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        }
        throw new Error('Invalid Grok response');
    }

    async callMistralAPI(prompt, provider) {
        const response = await this.makeRequest('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: provider.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a news content analyzer. Always respond with valid JSON only.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8
            })
        });

        const data = JSON.parse(response);
        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        }
        throw new Error('Invalid Mistral response');
    }

    makeRequest(url, options) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const req = protocol.request(url, {
                method: options.method,
                headers: options.headers
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });
            
            req.on('error', reject);
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }
}

function fetchURL(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeout);
        
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            clearTimeout(timeoutId);
            
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchURL(res.headers.location, timeout).then(resolve).catch(reject);
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => {
            clearTimeout(timeoutId);
            reject(err);
        });
    });
}

function extractArticleContent(html) {
    // Remove scripts and styles
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Extract article content (simplified extraction)
    let content = '';
    
    // Try to find article body
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
        content = articleMatch[1];
    } else {
        // Fallback to main content
        const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (mainMatch) {
            content = mainMatch[1];
        } else {
            // Try to find content divs
            const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]{500,}?)<\/div>/i);
            if (contentMatch) {
                content = contentMatch[1];
            }
        }
    }
    
    // Clean HTML tags and get text
    content = content.replace(/<[^>]+>/g, ' ');
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit to first 2000 characters
    return content.substring(0, 2000);
}

function extractComments(html) {
    const comments = [];
    
    // Try different comment patterns
    const commentPatterns = [
        /<div[^>]*class="[^"]*comment-text[^"]*"[^>]*>(.*?)<\/div>/gi,
        /<div[^>]*class="[^"]*comment-body[^"]*"[^>]*>(.*?)<\/div>/gi,
        /<p[^>]*class="[^"]*comment[^"]*"[^>]*>(.*?)<\/p>/gi,
        /<div[^>]*id="comment-\d+"[^>]*>(.*?)<\/div>/gi
    ];
    
    for (const pattern of commentPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
            const comment = match[1].replace(/<[^>]+>/g, '').trim();
            if (comment.length > 20 && comment.length < 500) {
                comments.push(comment);
                if (comments.length >= 5) break;
            }
        }
        if (comments.length >= 5) break;
    }
    
    return comments;
}

async function fetchArticleAndComments(url, config) {
    if (!config.fetchFullContent) {
        return { content: '', comments: [] };
    }
    
    try {
        console.log(`      Fetching article content from ${url.substring(0, 50)}...`);
        const html = await fetchURL(url);
        
        const content = extractArticleContent(html);
        const comments = config.fetchComments ? extractComments(html) : [];
        
        if (content) {
            console.log(`        ✓ Fetched ${content.length} chars of content`);
        }
        if (comments.length > 0) {
            console.log(`        ✓ Found ${comments.length} comments`);
        }
        
        return { content, comments };
    } catch (error) {
        console.log(`        ✗ Failed to fetch article: ${error.message}`);
        return { content: '', comments: [] };
    }
}

function fetchRSS(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;
        
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader/1.0)'
            }
        }, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', reject);
    });
}

function parseRSSItem(item) {
    const getTextContent = (tag) => {
        const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
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
    
    const title = getTextContent('title');
    const description = getTextContent('description') || getTextContent('summary');
    const link = getTextContent('link');
    const pubDate = getTextContent('pubDate') || getTextContent('published');
    
    return {
        title,
        description,
        link,
        pubDate: pubDate ? new Date(pubDate) : new Date()
    };
}

function parseRSS(xml) {
    const items = [];
    const itemMatches = xml.matchAll(/<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi);
    
    for (const match of itemMatches) {
        const item = parseRSSItem(match[0]);
        if (item.title) {
            items.push(item);
        }
    }
    
    return items.sort((a, b) => b.pubDate - a.pubDate);
}

function generatePostId(title, link) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(title + link).digest('hex');
}

async function generateWithLLM(item, feed, llmAdapter, articleData) {
    const contentPreview = articleData.content || item.description || item.title;
    const maxReactions = feed.maxReactions || 5;
    const reactionGuidance = feed.reactionGuidance || '';
    
    let commentsSection = '';
    if (articleData.comments && articleData.comments.length > 0) {
        commentsSection = `\nReader Comments (use these to inform reactions):
${articleData.comments.map((c, i) => `Comment ${i+1}: ${c}`).join('\n')}`;
    }
    
    const prompt = `Analyze this news article and provide a comprehensive response in JSON format:

Original Title: ${item.title}
Source: ${feed.name}
Article Content: ${contentPreview.substring(0, 1500)}
${commentsSection}

IMPORTANT INSTRUCTIONS:
1. Create a NEW CATCHY TITLE: Maximum 10 words, make it engaging, provocative, or intriguing while staying factual
2. Write an ESSENCE: Clear, informative summary in exactly 50 words capturing key points. MUST be complete sentences.
3. Generate exactly ${maxReactions} UNIQUE REACTIONS (each exactly 50 words). Each reaction MUST be complete sentences, not truncated:
   
Reaction Guidance for ${feed.name}: ${reactionGuidance}

${commentsSection ? 'Consider the reader comments when crafting reactions. Reference specific sentiments or arguments from the comments where relevant.' : ''}

Return ONLY valid JSON:
{
  "title": "catchy title here (max 10 words)",
  "essence": "comprehensive summary here",
  "reactions": ["reaction 1", "reaction 2", "reaction 3", "reaction 4", "reaction 5"]
}`;

    try {
        const result = await llmAdapter.generate(prompt);
        if (result && result.essence && result.reactions && result.reactions.length >= maxReactions) {
            return {
                title: result.title || item.title.substring(0, 80),
                essence: result.essence, // No truncation, let LLM control length
                reactions: result.reactions.slice(0, maxReactions) // No truncation per reaction
            };
        }
    } catch (error) {
        console.error(`    LLM generation failed: ${error.message}`);
    }
    
    return null;
}

function createPost(item, feed, backgroundColor, llmContent = null) {
    let title = item.title;
    let essence = item.description ? item.description.substring(0, 500) : '';
    let reactions = [
        `This story from ${feed.name} highlights important developments`,
        `The implications of this news could be significant`,
        `Worth reading for a deeper understanding of current events`
    ];
    
    if (llmContent) {
        title = llmContent.title || title;
        essence = llmContent.essence;
        reactions = llmContent.reactions;
    }
    
    return {
        id: generatePostId(item.title, item.link), // Use original title for ID
        title: title,
        essence: essence,
        reactions: reactions, // No truncation, trust LLM or fallback content
        source: item.link,
        backgroundColor: backgroundColor,
        promoBanner: {
            text: feed.name,
            url: item.link
        },
        generatedAt: new Date().toISOString(),
        feedName: feed.name,
        llmGenerated: !!llmContent
    };
}

async function loadExistingPosts() {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function savePost(posts) {
    await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
}

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading config file ${CONFIG_FILE}:`, error.message);
        process.exit(1);
    }
}

async function loadLLMConfig() {
    try {
        const data = await fs.readFile(LLM_KEYS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('LLM configuration not found, proceeding without LLM enhancement');
        return { useLLM: false, providers: {} };
    }
}

function getRandomColor() {
    const colors = ['purple', 'blue', 'green', 'red', 'orange', 'teal', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
}

async function main() {
    const args = process.argv.slice(2);
    const topN = args.length > 0 ? parseInt(args[0]) : null;
    
    console.log('Loading configuration...');
    const config = await loadConfig();
    const llmConfig = await loadLLMConfig();
    
    const llmAdapter = new LLMAdapter(llmConfig);
    const hasLLM = llmConfig.useLLM && llmAdapter.providers.length > 0;
    
    if (hasLLM) {
        console.log(`LLM enhancement enabled with ${llmAdapter.providers.length} provider(s)`);
    } else {
        console.log('LLM enhancement disabled or no valid providers configured');
    }
    
    const postsPerFeed = topN || config.topPostsPerFeed || 5;
    const backgroundColor = config.defaultBackgroundColor || 'purple';
    
    console.log(`Fetching top ${postsPerFeed} posts from each feed...`);
    if (config.fetchFullContent) {
        console.log('Full article content fetching is enabled');
    }
    if (config.fetchComments) {
        console.log('Comment extraction is enabled');
    }
    
    const existingPosts = await loadExistingPosts();
    const existingIds = new Set(existingPosts.map(p => p.id));
    
    let newPosts = [];
    let totalProcessed = 0;
    let totalNew = 0;
    let llmEnhanced = 0;
    
    for (const feed of config.feeds) {
        if (!feed.enabled) {
            console.log(`Skipping disabled feed: ${feed.name}`);
            continue;
        }
        
        console.log(`\nProcessing ${feed.name}...`);
        
        try {
            const rssData = await fetchRSS(feed.url);
            const items = parseRSS(rssData);
            
            if (items.length === 0) {
                console.log(`  No items found in ${feed.name}`);
                continue;
            }
            
            const topItems = items.slice(0, postsPerFeed);
            let feedNewCount = 0;
            
            for (const item of topItems) {
                const postId = generatePostId(item.title, item.link);
                
                if (!existingIds.has(postId)) {
                    let llmContent = null;
                    
                    if (hasLLM) {
                        console.log(`  Processing: ${item.title.substring(0, 50)}...`);
                        
                        // Fetch full article content and comments
                        const articleData = await fetchArticleAndComments(item.link, config);
                        
                        console.log(`    Generating LLM content...`);
                        llmContent = await generateWithLLM(item, feed, llmAdapter, articleData);
                        
                        if (llmContent) {
                            llmEnhanced++;
                            console.log(`      ✓ Generated: "${llmContent.title}"`);
                        } else {
                            console.log(`      ✗ Using fallback content`);
                        }
                    }
                    
                    const post = createPost(
                        item, 
                        feed, 
                        feed.backgroundColor || getRandomColor(),
                        llmContent
                    );
                    
                    newPosts.push(post);
                    existingIds.add(post.id);
                    feedNewCount++;
                }
                totalProcessed++;
            }
            
            console.log(`  Processed ${topItems.length} items, ${feedNewCount} new`);
            totalNew += feedNewCount;
            
        } catch (error) {
            console.error(`  Error processing ${feed.name}: ${error.message}`);
        }
    }
    
    if (newPosts.length > 0) {
        const allPosts = [...newPosts, ...existingPosts];
        await savePost(allPosts);
        console.log(`\n✓ Generated ${totalNew} new posts from ${totalProcessed} total items`);
        if (hasLLM) {
            console.log(`✓ Enhanced ${llmEnhanced} posts with LLM-generated content`);
        }
        console.log(`✓ Total posts in ${POSTS_FILE}: ${allPosts.length}`);
    } else {
        console.log('\n✓ No new posts to generate (all posts already exist)');
    }
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});