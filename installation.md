# Installation and Setup

This document provides instructions on how to set up and use the Axiologic.news project, including the automated news generation via GitHub Actions.

## Using the Project

The main purpose of this project is to provide a curated news feed by summarizing articles from various sources. The generated content is available in the `docs/sources` directory, with each subdirectory representing a different category.

The project can be viewed online at [https://axiologic.news](https://axiologic.news).

## Automated News Generation

The project includes a GitHub Actions workflow to automatically update the news sources every hour. This ensures that the content is always fresh.

### How it Works

The workflow is defined in the file `.github/workflows/update-news.yml`. It performs the following steps:

1.  **Scheduled Trigger:** The workflow is scheduled to run every hour.
2.  **Checkout:** It checks out the latest version of the repository.
3.  **Setup Node.js:** It sets up a Node.js environment.
4.  **Generate News:** It runs the `docs/sources/generate-ai.js` script, which fetches and processes news articles.
5.  **Commit and Push:** It commits the updated `posts.json` and `invalidUrls.json` files to the repository.

### Setting up the GitHub Action

To enable the automated news generation in your own fork of this repository, you need to configure secrets for the AI providers you want to use.

1.  **Fork the repository:** Start by forking this repository to your own GitHub account.

2.  **Navigate to Settings:** In your forked repository, go to `Settings` > `Secrets and variables` > `Actions`.

3.  **Create New Secrets:** Click on `New repository secret` to add the necessary API keys. The secrets you need to add depend on the AI provider you want to use.

#### Required Secrets

The `generate-ai.js` script supports multiple AI providers. You need to provide an API key for at least one of them.

-   `AI_PROVIDER`: (Optional) The AI provider to use. Defaults to `openai`. Supported values are `openai`, `gemini`, `mistral`, `claude`, `anthropic`, `groq`, `ollama`.
-   `AI_MODEL`: (Optional) The specific model to use for the selected provider.
-   `OPENAI_API_KEY`: The API key for OpenAI.
-   `GEMINI_API_KEY`: The API key for Google Gemini.
-   `MISTRAL_API_KEY`: The API key for Mistral AI.
-   `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY`: The API key for Anthropic Claude.
-   `GROQ_API_KEY`: The API key for Groq.
-   `AI_API_KEY`: A generic API key that can be used if the provider-specific key is not set.
-   `OLLAMA_HOST`: (Optional) The host for the Ollama service (e.g., `http://localhost:11434`).

**Example:**

If you want to use OpenAI, you need to create a secret named `OPENAI_API_KEY` with your OpenAI API key as the value. You can also set the `AI_PROVIDER` secret to `openai`.

Once the secrets are configured, the GitHub Action will run automatically and keep your news feed up to date.
