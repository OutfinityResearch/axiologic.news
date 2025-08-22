# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Axiologic.news is a static mobile-first news aggregator website built with the WebSkel framework. The application focuses on delivering high-quality, curated news content in a TikTok-style interface with vertical story feeds and horizontal carousels for each story.

## Architecture

### WebSkel Framework
- Custom lightweight framework located in `/WebSkel/` directory
- Configuration in `webskel.json` defines all components
- Components follow a presenter pattern with HTML/CSS/JS separation
- DO NOT modify the WebSkel framework itself

### Component Structure
Each component has three files:
- `.html` - Template structure
- `.css` - Component-specific styles  
- `.js` - Presenter class (exports a class with constructor(element, invalidate))

Component types:
- `page/` - Full page components
- `components/` - Reusable UI components
- `modals/` - Modal dialogs
- `base/` - Core utility components

### Key Services
Located in `/services/`:
- `LocalStorage.js` - Browser localStorage wrapper for data persistence
- `AnimationService.js` - Background animations for different moods
- `BackgroundMusicService.js` - Audio playback management
- `LLMAdapter.js` - AI integration for content processing
- `TTSService.js` - Text-to-speech functionality
- `PromptService.js` - AI prompt management

## Development Commands

Since this is a static site, there are no build or dependency management commands. Development workflow:
- Open `index.html` directly in browser or use a local web server
- Use browser DevTools for debugging
- Check browser console for errors and WebSkel initialization messages

## Known Issues

The site currently has loading problems. When debugging:
1. Check browser console for JavaScript errors
2. Verify WebSkel initialization in `app.js`
3. Ensure all component files (HTML/CSS/JS) exist and are properly referenced
4. Check that component presenter classes are exported correctly
5. Verify `webskel.json` configuration matches actual component locations

## Business Requirements

From `specs.txt`:
- Mobile-first TikTok-style news reader
- Vertical swipe for story navigation
- Horizontal swipe for story carousel (Title → Essence → Reactions → Source)
- AI-powered content moderation ("The Axiologic Standard")
- Settings for animations and background music
- Create Post and Create from RSS functionality
- All data stored in localStorage
- Auto-play for both vertical feed and horizontal carousel

## Important Notes

- This is a STATIC website - no server-side components or npm dependencies
- All functionality runs client-side in the browser
- Data persistence uses browser localStorage only
- The WebSkel framework should not be modified
- Focus on components in `/components/` directory for any changes