#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read meme-editor.js
const editorPath = path.join(__dirname, '../components/page/meme-editor/meme-editor.js');
const editorContent = fs.readFileSync(editorPath, 'utf8');

// Define animation categories and mappings
const categoryMappings = {
    // Energetic & Dynamic
    'particles': { category: 'energetic-dynamic', name: 'Colored Particles' },
    'lightning': { category: 'energetic-dynamic', name: 'Electric Lightning' },
    'plasma': { category: 'energetic-dynamic', name: 'Plasma Energy' },
    'vortex': { category: 'energetic-dynamic', name: 'Energy Vortex' },
    'neon': { category: 'energetic-dynamic', name: 'Neon Pulse' },
    'volcanic-eruption': { category: 'energetic-dynamic', name: 'Volcanic Eruption' },
    'solar-flares': { category: 'energetic-dynamic', name: 'Solar Flares' },
    'earthquake-waves': { category: 'energetic-dynamic', name: 'Earthquake Waves' },
    'excitement': { category: 'energetic-dynamic', name: 'Excitement - Bursting Joy' },
    'anger': { category: 'energetic-dynamic', name: 'Anger - Fiery Rage' },
    
    // Peaceful & Calming
    'waves': { category: 'peaceful-calming', name: 'Flowing Waves' },
    'stars': { category: 'peaceful-calming', name: 'Twinkling Stars' },
    'ocean-waves': { category: 'peaceful-calming', name: 'Ocean Waves' },
    'falling-snow': { category: 'peaceful-calming', name: 'Falling Snow' },
    'gentle-rain': { category: 'peaceful-calming', name: 'Gentle Rain' },
    'floating-clouds': { category: 'peaceful-calming', name: 'Floating Clouds' },
    'serenity': { category: 'peaceful-calming', name: 'Serenity - Inner Peace' },
    'contentment': { category: 'peaceful-calming', name: 'Contentment - Gentle Satisfaction' },
    
    // Spiritual & Mystic
    'root-chakra': { category: 'spiritual-mystic', name: 'Root Chakra - Grounding' },
    'sacral-chakra': { category: 'spiritual-mystic', name: 'Sacral Chakra - Creative Flow' },
    'solar-chakra': { category: 'spiritual-mystic', name: 'Solar Plexus - Golden Power' },
    'heart-chakra': { category: 'spiritual-mystic', name: 'Heart Chakra - Healing Love' },
    'throat-chakra': { category: 'spiritual-mystic', name: 'Throat Chakra - True Voice' },
    'third-eye-chakra': { category: 'spiritual-mystic', name: 'Third Eye - Inner Vision' },
    'crown-chakra': { category: 'spiritual-mystic', name: 'Crown Chakra - Cosmic Unity' },
    'kundalini-energy': { category: 'spiritual-mystic', name: 'Kundalini Energy - Rising Serpent' },
    'chakra-alignment': { category: 'spiritual-mystic', name: 'Chakra Alignment - Seven Centers' },
    'cosmic-mandala': { category: 'spiritual-mystic', name: 'Cosmic Mandala - Sacred Geometry' },
    'aurora-borealis': { category: 'spiritual-mystic', name: 'Aurora Borealis' },
    'wonder': { category: 'spiritual-mystic', name: 'Wonder - Mystical Awe' },
    'transcendence': { category: 'spiritual-mystic', name: 'Transcendence - Spiritual Elevation' },
    
    // Playful & Creative
    'geometric': { category: 'playful-creative', name: 'Geometric Shapes' },
    'matrix': { category: 'playful-creative', name: 'Matrix Rain' },
    'rainbow-prisms': { category: 'playful-creative', name: 'Rainbow Prisms' },
    'dancing-flames': { category: 'playful-creative', name: 'Dancing Flames' },
    'joy': { category: 'playful-creative', name: 'Joy - Pure Happiness' },
    'curiosity': { category: 'playful-creative', name: 'Curiosity - Inquisitive Spark' },
    'playfulness': { category: 'playful-creative', name: 'Playfulness - Lighthearted Fun' },
    
    // Melancholic & Reflective
    'misty-fog': { category: 'melancholic-reflective', name: 'Misty Fog' },
    'autumn-leaves': { category: 'melancholic-reflective', name: 'Autumn Leaves' },
    'melancholy': { category: 'melancholic-reflective', name: 'Melancholy - Wistful Sadness' },
    'nostalgia': { category: 'melancholic-reflective', name: 'Nostalgia - Warm Memories' },
    'longing': { category: 'melancholic-reflective', name: 'Longing - Deep Yearning' },
    'contemplation': { category: 'melancholic-reflective', name: 'Contemplation - Thoughtful Reflection' }
};

// Extract animation codes from meme-editor
const extractAnimationCode = (animationType) => {
    // Search for the animation in the backgroundAnimations object
    const regex = new RegExp(`${animationType}:\\s*\\\`([^\`]*)\\\``, 's');
    const match = editorContent.match(regex);
    
    if (match) {
        return match[1];
    }
    
    // Try alternative search pattern
    const altRegex = new RegExp(`['"]${animationType}['"]:\\s*\\\`([^\`]*)\\\``, 's');
    const altMatch = editorContent.match(altRegex);
    
    if (altMatch) {
        return altMatch[1];
    }
    
    return null;
};

// Get descriptions from the getAnimationDescriptions method
const getDescription = (animationType) => {
    const descRegex = new RegExp(`['"]${animationType}['"]:\\s*['"]([^'"]+)['"]`);
    const match = editorContent.match(descRegex);
    return match ? match[1] : `${animationType} animation effect`;
};

// Create animation files
Object.entries(categoryMappings).forEach(([animationType, info]) => {
    const { category, name } = info;
    const code = extractAnimationCode(animationType);
    const description = getDescription(animationType);
    
    if (code) {
        const categoryDir = path.join(__dirname, '../services/animations', category);
        
        // Create category directory if it doesn't exist
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        // Create animation file
        const fileName = animationType.replace(/-/g, '_') + '.js';
        const filePath = path.join(categoryDir, fileName);
        
        const fileContent = `export default {
    name: "${name}",
    description: "${description}",
    code: \`${code}\`
};
`;
        
        fs.writeFileSync(filePath, fileContent);
        console.log(`Created: ${category}/${fileName}`);
    } else {
        console.warn(`Could not find code for: ${animationType}`);
    }
});

// Create index files for each category
const categories = [...new Set(Object.values(categoryMappings).map(m => m.category))];

categories.forEach(category => {
    const categoryDir = path.join(__dirname, '../services/animations', category);
    
    if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir)
            .filter(f => f.endsWith('.js') && f !== 'index.js');
        
        const imports = files.map(f => {
            const name = f.replace('.js', '');
            const importName = name.replace(/_/g, '');
            return `import ${importName} from './${name}.js';`;
        }).join('\n');
        
        const exports = files.map(f => {
            const name = f.replace('.js', '');
            const importName = name.replace(/_/g, '');
            const exportName = name.replace(/_/g, '-');
            return `    '${exportName}': ${importName},`;
        }).join('\n');
        
        const indexContent = `// ${category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Animations
${imports}

export default {
${exports}
};
`;
        
        fs.writeFileSync(path.join(categoryDir, 'index.js'), indexContent);
        console.log(`Created index for: ${category}`);
    }
});

console.log('\nExtraction complete! All animations have been moved to their respective category folders.');
console.log('\nRemember to update meme-editor.js to remove the hardcoded animations.');