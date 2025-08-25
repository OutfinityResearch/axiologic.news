#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

async function fetchRSS(url) {
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
        const match = item.match(new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i'));
        if (match && match[1]) {
            return match[1]
                .replace(/<!\[CDATA\[(.*?)​]]/gs, '$1')
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

function createPost(item, feed, backgroundColor) {
    let title = item.title;
    let essence = item.description ? item.description.substring(0, 500) : '';
    let reactions = [
        `This story from ${feed.name} highlights important developments`,
        `The implications of this news could be significant`,
        `Worth reading for a deeper understanding of current events`
    ];

    return {
        id: generatePostId(item.title, item.link), // Use original title for ID
        title: title,
        essence: essence,
        reactions: reactions,
        source: item.link,
        backgroundColor: backgroundColor,
        promoBanner: {
            text: feed.name,
            url: item.link
        },
        generatedAt: new Date().toISOString(),
        feedName: feed.name
    };
}

async function loadExistingPosts(postsFilePath) {
    try {
        const data = await fs.readFile(postsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function savePost(posts, postsFilePath) {
    await fs.writeFile(postsFilePath, JSON.stringify(posts, null, 2));
}

async function loadConfig(configFilePath) {
    try {
        const data = await fs.readFile(configFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading config file ${configFilePath}:`, error.message);
        process.exit(1);
    }
}

function getRandomColor() {
    const colors = ['purple', 'blue', 'green', 'red', 'orange', 'teal', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: node generate.js <folder>');
        process.exit(1);
    }
    const folder = args[0];
    const configFilePath = path.join(folder, 'config.json');
    const postsFilePath = path.join(folder, 'posts.json');

    console.log(`Loading configuration from ${configFilePath}...`);
    const config = await loadConfig(configFilePath);

    const postsPerFeed = config.topPostsPerFeed || 5;

    console.log(`Fetching top ${postsPerFeed} posts from each feed...`);

    const existingPosts = await loadExistingPosts(postsFilePath);
    const existingIds = new Set(existingPosts.map(p => p.id));

    let newPosts = [];
    let totalProcessed = 0;
    let totalNew = 0;

    for (const feed of config.feeds) {
        if (!feed.enabled) {
            console.log(`Skipping disabled feed: ${feed.name}`);
            continue;
        }

        console.log(`
Processing ${feed.name}...`);

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
                    const post = createPost(
                        item,
                        feed,
                        feed.backgroundColor || getRandomColor()
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
        await savePost(allPosts, postsFilePath);
        console.log(`
✓ Generated ${totalNew} new posts from ${totalProcessed} total items`);
        console.log(`✓ Total posts in ${postsFilePath}: ${allPosts.length}`);
    } else {
        console.log('\n✓ No new posts to generate (all posts already exist)');
    }
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});