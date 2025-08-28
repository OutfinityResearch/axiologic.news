const fs = require('fs').promises;
const crypto = require('crypto');
const { GLOBAL_CONFIG } = require('./config.js');
const { getPromoBanner } = require('./utils.js');

function generatePostId(title, link) {
    // Use just the link URL for ID generation to ensure uniqueness
    // This prevents duplicate posts even if title changes
    return crypto.createHash('md5').update(link).digest('hex');
}

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
        // Processing filtered items...
        
        for (let i = 0; i < itemsToProcess.length; i++) {
            const item = itemsToProcess[i];
            const postId = generatePostId(item.title, item.link);
            
            // Double-check ID doesn't exist
            if (existingIds.has(postId)) {
                // Skipping duplicate
                continue;
            }

            const formatTime = (ms) => {
                if (ms < 1000) return `${ms}ms`;
                return `${(ms / 1000).toFixed(1)}s`;
            };
            
            process.stdout.write(`    [${i+1}/${itemsToProcess.length}] `);
            const itemStart = Date.now();
            
            // Fetch full content if possible (with timeout)
            let fullContent = null;
            try {
                const fetchStart = Date.now();
                process.stdout.write('fetch... ');
                fullContent = await Promise.race([
                    this.fetcher.fetchFullContent(item.link),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Content fetch timeout')), contentTimeout)
                    )
                ]);
                process.stdout.write(`${formatTime(Date.now() - fetchStart)} `);
            } catch (e) {
                process.stdout.write(`skip `);
            }
            
            // Generate the post with AI-enhanced content
            const genStart = Date.now();
            process.stdout.write('AI... ');
            const post = await this.createEnhancedPost(item, feed, fullContent);
            
            if (post) {
                newPosts.push(post);
                existingIds.add(postId);
                console.log(`✓ ${formatTime(Date.now() - genStart)} (total: ${formatTime(Date.now() - itemStart)})`);
            } else {
                console.log(`✗ failed (${formatTime(Date.now() - itemStart)})`);
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

        const prompt = `${this.config.selectionPrompt}\nFeed: ${feed.name}\nAvailable stories:\n${titlesAndDescriptions}\nSelect the ${this.config.topPostsPerFeed || 5} most interesting and relevant stories.\nReturn only the numbers (comma-separated) of the selected stories.`;

        const response = await this.ai.analyze(prompt, 100);
        
        if (!response || response === null) {
            // AI not available - using top items
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

    qualityCheckReactions(reactions) {
        if (!reactions || reactions.length < 3) {
            return false;
        }

        // Check for identical reactions
        const uniqueReactions = new Set(reactions);
        if (uniqueReactions.size < reactions.length) {
            return false;
        }

        // Check for minimum length
        for (const reaction of reactions) {
            const wordCount = (reaction.match(/\b\w+\b/g) || []).length;
            if (wordCount < 10) { // A bit more realistic than 50 for a single reaction
                return false;
            }
        }

        return true;
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
        const prompt = `${this.config.essencePrompt}\nTitle: ${item.title}\nContent: ${content.substring(0, 20000)}\nWrite a concise, compelling essence/summary (approximately 400-600 words) in plain text only — no markdown, no asterisks, no quotes. Keep it readable and informative. Focus on the key points and implications.`;

        try {
            const response = await this.ai.analyze(prompt, 800); // Allow more tokens for fuller content
            if (!response || response === null) {
                // Using original description
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
            // Failed to generate essence
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
        
        const prompt = `${this.config.perspectivesPrompt}\nTitle: ${item.title}\nSource: ${feed.name}\nContent: ${content.substring(0, 20000)}\n${comments ? `\nReader Comments:\n${comments.substring(0, 5000)}` : ''}\nGenerate 3 unique perspectives/reactions. Use plain text only - no markdown, no asterisks, no quotes, no formatting. One clear sentence per perspective:`;

        try {
            const response = await this.ai.analyze(prompt, 500);
            
            if (!response || response === null) {
                // Using default perspectives
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
            // Failed to generate perspectives
            return null;
        }
    }
}

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
                console.log(`  Cleaned up: Removed ${removed} posts older than ${this.historyDays} days`);
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
            console.log(`  Cleanup: Removed ${removedOld} posts older than ${this.historyDays} days`);
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

module.exports = {
    PostManager,
    StoryProcessor,
    generatePostId
};
