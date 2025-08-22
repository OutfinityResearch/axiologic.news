const fs = require('fs');
const path = require('path');

// Read meme-editor.js content
const editorPath = path.join(__dirname, '../components/page/meme-editor/meme-editor.js');
let editorContent = fs.readFileSync(editorPath, 'utf8');

// Find the backgroundAnimations object
const animationsStartIdx = editorContent.indexOf('backgroundAnimations: {');
const animationsEndIdx = editorContent.indexOf('// Emotions-inspired animations') - 10;

if (animationsStartIdx === -1) {
    console.error('Could not find backgroundAnimations object');
    process.exit(1);
}

// Extract just the animations object part
const animationsSection = editorContent.substring(animationsStartIdx, animationsEndIdx);

// Write to file for manual inspection
fs.writeFileSync('animations-extracted.txt', animationsSection);
console.log('Animations extracted to animations-extracted.txt');

// Category mappings
const categoryMappings = {
    'particles': 'energetic-dynamic',
    'lightning': 'energetic-dynamic',
    'plasma': 'energetic-dynamic',
    'vortex': 'energetic-dynamic',
    'neon': 'energetic-dynamic',
    'volcanic-eruption': 'energetic-dynamic',
    'solar-flares': 'energetic-dynamic',
    'earthquake-waves': 'energetic-dynamic',
    'excitement': 'energetic-dynamic',
    'anger': 'energetic-dynamic',
    
    'waves': 'peaceful-calming',
    'stars': 'peaceful-calming',
    'ocean-waves': 'peaceful-calming',
    'falling-snow': 'peaceful-calming',
    'gentle-rain': 'peaceful-calming',
    'floating-clouds': 'peaceful-calming',
    'serenity': 'peaceful-calming',
    'contentment': 'peaceful-calming',
    
    'root-chakra': 'spiritual-mystic',
    'sacral-chakra': 'spiritual-mystic',
    'solar-chakra': 'spiritual-mystic',
    'heart-chakra': 'spiritual-mystic',
    'throat-chakra': 'spiritual-mystic',
    'third-eye-chakra': 'spiritual-mystic',
    'crown-chakra': 'spiritual-mystic',
    'kundalini-energy': 'spiritual-mystic',
    'chakra-alignment': 'spiritual-mystic',
    'cosmic-mandala': 'spiritual-mystic',
    'aurora-borealis': 'spiritual-mystic',
    'wonder': 'spiritual-mystic',
    'transcendence': 'spiritual-mystic',
    
    'geometric': 'playful-creative',
    'matrix': 'playful-creative',
    'rainbow-prisms': 'playful-creative',
    'dancing-flames': 'playful-creative',
    'joy': 'playful-creative',
    'curiosity': 'playful-creative',
    'playfulness': 'playful-creative',
    
    'misty-fog': 'melancholic-reflective',
    'autumn-leaves': 'melancholic-reflective',
    'melancholy': 'melancholic-reflective',
    'nostalgia': 'melancholic-reflective',
    'longing': 'melancholic-reflective',
    'contemplation': 'melancholic-reflective'
};

console.log('\nNow manually extract each animation from animations-extracted.txt');
console.log('and create files in the appropriate category folders.');