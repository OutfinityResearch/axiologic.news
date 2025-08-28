const https = require('https');
const http = require('http');
const { URL } = require('url');

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
        html = html.replace(/[\[&][^\\\]]+[\]]/g, '');
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

module.exports = { ContentFetcher };
