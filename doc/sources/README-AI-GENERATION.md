# AI-Enhanced News Generation System

## Overview
The new `generate-ai.js` script provides intelligent RSS feed processing with AI-powered content filtering, summarization, and perspective generation.

## Features

### 1. AI-Powered Story Selection
- Analyzes all RSS items using custom selection prompts
- Filters for the most relevant and impactful stories
- Avoids duplicate content using history tracking
- Customizable selection criteria per category

### 2. Content Enhancement
- Fetches full article content when possible
- Extracts comments and discussions
- Generates compelling summaries using AI
- Creates unique perspectives from multiple viewpoints

### 3. Smart History Management
- Tracks processed stories to avoid duplicates
- Configurable history retention period
- Prevents re-processing of recent stories

## Configuration Format

Each source folder should have a `config.json` with these fields:

```json
{
    "feeds": [
        {
            "name": "Feed Name",
            "url": "https://example.com/rss",
            "enabled": true
        }
    ],
    "topPostsPerFeed": 5,
    "historyDays": 30,
    "selectionPrompt": "AI prompt for selecting interesting stories",
    "essencePrompt": "AI prompt for generating story summaries",
    "perspectivesPrompt": "AI prompt for generating unique perspectives"
}
```

### Prompt Guidelines

#### Selection Prompt
- Define what makes a story interesting for this category
- Specify priority criteria
- Include any topics to emphasize or avoid

#### Essence Prompt
- Guide how to summarize the story
- Specify key information to include
- Set the tone and style

#### Perspectives Prompt
- Define different viewpoints to generate
- Specify the expertise level
- Guide the analysis depth

## Global Configuration

The script uses `global-config.json` for API keys and settings. This avoids needing environment variables:

```json
{
  "apiKeys": {
    "mistral": "your-key-here",
    "openai": "your-key-here",
    "gemini": "your-key-here"
  },
  "defaultProvider": "mistral",
  "promotionalBanner": {
    "enabled": true,
    "defaultText": "Your Brand",
    "defaultUrl": "https://yourdomain.com"
  }
}
```

## Usage

### Basic Usage
```bash
# Process all source folders (uses global-config.json)
node generate-ai.js

# Process specific folder
node generate-ai.js tech

# Override provider via environment (optional)
AI_PROVIDER=openai node generate-ai.js
```

### Environment Variables
- `AI_PROVIDER`: Choose AI provider (openai, anthropic, claude, mistral, gemini, ollama)
- `AI_API_KEY`: Generic API key (used if specific key not set)
- `AI_MODEL`: Specific model to use
- `OLLAMA_HOST`: Ollama server URL (default: http://localhost:11434)
- `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY`: For Claude/Anthropic
- `MISTRAL_API_KEY`: For Mistral AI
- `GEMINI_API_KEY`: For Google Gemini

### Supported AI Providers

#### 1. Ollama (Local, Free)
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama2
ollama pull mistral
ollama pull codellama

# Run the generator
AI_PROVIDER=ollama node generate-ai.js
AI_PROVIDER=ollama AI_MODEL=mistral node generate-ai.js
```

#### 2. OpenAI
```bash
# GPT-4o Mini (fast, cheap)
AI_PROVIDER=openai AI_API_KEY=sk-... AI_MODEL=gpt-4o-mini node generate-ai.js

# GPT-4 (best quality)
AI_PROVIDER=openai AI_API_KEY=sk-... AI_MODEL=gpt-4 node generate-ai.js
```

#### 3. Claude (Anthropic)
```bash
# Claude 3 Haiku (fast, cheap)
AI_PROVIDER=claude CLAUDE_API_KEY=sk-ant-... AI_MODEL=claude-3-haiku-20240307 node generate-ai.js

# Claude 3 Sonnet (balanced)
AI_PROVIDER=claude CLAUDE_API_KEY=sk-ant-... AI_MODEL=claude-3-sonnet-20240229 node generate-ai.js

# Claude 3 Opus (best quality)
AI_PROVIDER=claude CLAUDE_API_KEY=sk-ant-... AI_MODEL=claude-3-opus-20240229 node generate-ai.js
```

#### 4. Mistral AI
```bash
# Mistral Tiny (fast, cheap)
AI_PROVIDER=mistral MISTRAL_API_KEY=... AI_MODEL=mistral-tiny node generate-ai.js

# Mistral Small
AI_PROVIDER=mistral MISTRAL_API_KEY=... AI_MODEL=mistral-small node generate-ai.js

# Mistral Medium (best quality)
AI_PROVIDER=mistral MISTRAL_API_KEY=... AI_MODEL=mistral-medium node generate-ai.js
```

#### 5. Google Gemini
```bash
# Gemini Pro (free tier available)
AI_PROVIDER=gemini GEMINI_API_KEY=... AI_MODEL=gemini-pro node generate-ai.js

# Gemini Pro Vision (if analyzing images)
AI_PROVIDER=gemini GEMINI_API_KEY=... AI_MODEL=gemini-pro-vision node generate-ai.js
```

#### 4. Fallback Mode
If no AI is configured, the system uses keyword-based filtering and basic extraction.

## Output Format

Generated posts include:
```json
{
    "id": "unique-hash",
    "title": "Article Title",
    "essence": "AI-generated summary",
    "reactions": [
        "Expert perspective 1",
        "Expert perspective 2",
        "Expert perspective 3"
    ],
    "source": "https://original-article-url",
    "feedName": "Source Name",
    "author": "Article Author",
    "category": "Article Category",
    "generatedAt": "2024-01-01T00:00:00Z"
}
```

## Category-Specific Configurations

### AI & Technology
- Focuses on breakthroughs and real-world applications
- Technical accuracy with accessible language
- Three perspectives: Technical, Business, Societal

### Startups
- Emphasizes funding, growth, and disruption
- Actionable insights for founders and investors
- Three perspectives: Investor, Founder, Market

### Science
- Prioritizes peer-reviewed research
- Maintains scientific rigor
- Three perspectives: Research, Applications, Impact

### World News
- Global significance and lasting impact
- Cultural sensitivity and balance
- Three perspectives: Regional, International, Human

## Comparison with Original Script

| Feature | Original (generate.js) | AI-Enhanced (generate-ai.js) |
|---------|----------------------|------------------------------|
| Story Selection | Top N by date | AI-filtered for relevance |
| Summaries | RSS description | AI-generated essence |
| Perspectives | Generic templates | Custom AI perspectives |
| Content Analysis | RSS only | Full article + comments |
| Duplicate Prevention | Post ID only | History tracking |
| Customization | Basic config | Detailed prompts per category |

## Migration Guide

1. Keep original script for quick updates without AI
2. Use AI script for curated, high-quality content
3. Both scripts share the same posts.json format
4. Can alternate between scripts as needed

## Troubleshooting

### No AI Available
- System falls back to keyword filtering
- Check environment variables
- Verify API keys and connectivity

### Rate Limits
- Implement delays between requests
- Use local Ollama for unlimited processing
- Cache AI responses when possible

### Content Extraction Issues
- Some sites block scrapers
- Falls back to RSS description
- Consider using proxy services

## Best Practices

1. **Start with Ollama** for free, unlimited processing
2. **Refine prompts** based on output quality
3. **Monitor costs** when using commercial APIs
4. **Run regularly** (e.g., every 6 hours) for fresh content
5. **Review generated content** periodically to improve prompts

## Future Enhancements

- Multi-language support
- Sentiment analysis
- Trend detection across sources
- Automatic prompt optimization
- Content quality scoring