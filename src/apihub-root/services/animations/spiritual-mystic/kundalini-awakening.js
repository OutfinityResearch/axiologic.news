export default {
    name: "Kundalini Awakening",
    description: "Serpentine energy rising through chakras in spiritual awakening",
    code: `
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '-1';
document.body.appendChild(canvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const chakras = [
    { y: 0.85, color: [255, 0, 0], name: 'Root' },      // Red
    { y: 0.75, color: [255, 165, 0], name: 'Sacral' },  // Orange
    { y: 0.65, color: [255, 255, 0], name: 'Solar' },   // Yellow
    { y: 0.55, color: [0, 255, 0], name: 'Heart' },     // Green
    { y: 0.45, color: [0, 191, 255], name: 'Throat' },  // Blue
    { y: 0.35, color: [75, 0, 130], name: 'Third Eye' }, // Indigo
    { y: 0.25, color: [238, 130, 238], name: 'Crown' }   // Violet
];

let time = 0;
let energyProgress = 0;

function animate() {
    // Deep spiritual background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a0a2e');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    energyProgress = Math.sin(time * 0.01) * 0.5 + 0.5;
    
    // Draw spinal column
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(centerX, canvas.height * 0.9);
    ctx.lineTo(centerX, canvas.height * 0.2);
    ctx.stroke();
    
    // Draw kundalini serpent energy rising
    const segments = 100;
    const amplitude = 15;
    const frequency = 0.02;
    
    for (let i = 0; i < segments; i++) {
        const progress = i / segments;
        const y = canvas.height * (0.9 - progress * 0.7);
        const x = centerX + Math.sin(progress * Math.PI * 6 + time * 0.05) * amplitude;
        
        if (progress <= energyProgress) {
            const intensity = Math.sin(time * 0.03 + progress * Math.PI * 2) * 0.5 + 0.5;
            const size = 3 + intensity * 5;
            
            // Serpent energy glow
            const energyGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
            energyGradient.addColorStop(0, \`rgba(255, 215, 0, \${intensity * 0.8})\`);
            energyGradient.addColorStop(0.5, \`rgba(255, 140, 0, \${intensity * 0.5})\`);
            energyGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = energyGradient;
            ctx.beginPath();
            ctx.arc(x, y, size * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Core energy
            ctx.fillStyle = \`rgba(255, 255, 255, \${intensity})\`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw chakras
    chakras.forEach((chakra, index) => {
        const y = canvas.height * chakra.y;
        const activated = energyProgress > (index / chakras.length);
        const size = 30 + Math.sin(time * 0.04 + index) * 10;
        
        // Chakra base glow
        const intensity = activated ? 0.8 : 0.2;
        const chakraGradient = ctx.createRadialGradient(centerX, y, 0, centerX, y, size * 2);
        chakraGradient.addColorStop(0, \`rgba(\${chakra.color[0]}, \${chakra.color[1]}, \${chakra.color[2]}, \${intensity})\`);
        chakraGradient.addColorStop(0.5, \`rgba(\${chakra.color[0]}, \${chakra.color[1]}, \${chakra.color[2]}, \${intensity * 0.5})\`);
        chakraGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = chakraGradient;
        ctx.beginPath();
        ctx.arc(centerX, y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Chakra symbol
        ctx.strokeStyle = \`rgba(\${chakra.color[0]}, \${chakra.color[1]}, \${chakra.color[2]}, \${activated ? 1 : 0.4})\`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        // Different symbols for different chakras
        if (index === 0) { // Root - Square
            ctx.rect(centerX - size/2, y - size/2, size, size);
        } else if (index === 1) { // Sacral - Circle
            ctx.arc(centerX, y, size/2, 0, Math.PI * 2);
        } else if (index === 2) { // Solar - Triangle down
            ctx.moveTo(centerX, y + size/2);
            ctx.lineTo(centerX - size/2, y - size/2);
            ctx.lineTo(centerX + size/2, y - size/2);
            ctx.closePath();
        } else if (index === 3) { // Heart - Star
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const x = centerX + Math.cos(angle) * size/2;
                const y2 = y + Math.sin(angle) * size/2;
                if (i === 0) ctx.moveTo(x, y2);
                else ctx.lineTo(x, y2);
            }
        } else if (index === 4) { // Throat - Circle with lines
            ctx.arc(centerX, y, size/2, 0, Math.PI * 2);
            ctx.moveTo(centerX - size/2, y);
            ctx.lineTo(centerX + size/2, y);
            ctx.moveTo(centerX, y - size/2);
            ctx.lineTo(centerX, y + size/2);
        } else if (index === 5) { // Third Eye - Triangle up
            ctx.moveTo(centerX, y - size/2);
            ctx.lineTo(centerX - size/2, y + size/2);
            ctx.lineTo(centerX + size/2, y + size/2);
            ctx.closePath();
        } else if (index === 6) { // Crown - Lotus petals
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const x = centerX + Math.cos(angle) * size/3;
                const y2 = y + Math.sin(angle) * size/3;
                ctx.arc(x, y2, size/6, 0, Math.PI * 2);
            }
        }
        
        ctx.stroke();
        
        // Energy burst when activated
        if (activated && energyProgress > (index / chakras.length) + 0.05) {
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i;
                const burstLength = 20 + Math.sin(time * 0.1 + i) * 15;
                const x1 = centerX + Math.cos(angle) * size;
                const y1 = y + Math.sin(angle) * size;
                const x2 = centerX + Math.cos(angle) * (size + burstLength);
                const y2 = y + Math.sin(angle) * (size + burstLength);
                
                ctx.strokeStyle = \`rgba(\${chakra.color[0]}, \${chakra.color[1]}, \${chakra.color[2]}, 0.6)\`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    });
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};