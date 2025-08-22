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
                    setTimeout(() => reject(new Error('Request timeout')), 10000)
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
                    temperature: 0.7,
                    maxOutputTokens: 2048
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
                temperature: 0.7
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
                temperature: 0.7
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
                temperature: 0.7
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

async function generateWithLLM(item, feedName, llmAdapter) {
    const contentPreview = item.description ? item.description.substring(0, 500) : item.title;
    const prompt = `Analyze this news article and provide a comprehensive response in JSON format:

Title: ${item.title}
Source: ${feedName}
Content: ${contentPreview}

Generate the following:
1. "essence": A clear, informative summary in maximum 250 words that captures the key points and context
2. "reactions": An array of exactly 5 unique reactions, each maximum 100 words, from these diverse perspectives:
   - Professional analyst perspective (objective, fact-based)
   - Optimistic supporter perspective (positive interpretation)
   - Skeptical critic perspective (questioning, cautious)
   - Conspiracy theorist perspective (alternative interpretation)
   - Common citizen perspective (practical concerns)

Return ONLY valid JSON with this exact structure:
{
  "essence": "summary text here",
  "reactions": ["reaction 1", "reaction 2", "reaction 3", "reaction 4", "reaction 5"]
}`;

    try {
        const result = await llmAdapter.generate(prompt);
        if (result && result.essence && result.reactions && result.reactions.length >= 5) {
            return {
                essence: result.essence.substring(0, 500),
                reactions: result.reactions.slice(0, 5).map(r => r.substring(0, 250))
            };
        }
    } catch (error) {
        console.error(`    LLM generation failed: ${error.message}`);
    }
    
    return null;
}

function createPost(item, feedName, backgroundColor, llmContent = null) {
    let essence = item.description ? item.description.substring(0, 500) : '';
    let reactions = [
        `This story from ${feedName} highlights important developments`,
        `The implications of this news could be significant`,
        `Worth reading for a deeper understanding of current events`
    ];
    
    if (llmContent) {
        essence = llmContent.essence;
        reactions = llmContent.reactions;
    }
    
    return {
        id: generatePostId(item.title, item.link),
        title: item.title,
        essence: essence,
        reactions: reactions.map(r => r.substring(0, 250)),
        source: item.link,
        backgroundColor: backgroundColor,
        promoBanner: {
            text: feedName,
            url: item.link
        },
        generatedAt: new Date().toISOString(),
        feedName: feedName,
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
                        console.log(`  Generating LLM content for: ${item.title.substring(0, 50)}...`);
                        llmContent = await generateWithLLM(item, feed.name, llmAdapter);
                        if (llmContent) {
                            llmEnhanced++;
                            console.log(`    ✓ LLM content generated successfully`);
                        } else {
                            console.log(`    ✗ Using fallback content`);
                        }
                    }
                    
                    const post = createPost(
                        item, 
                        feed.name, 
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