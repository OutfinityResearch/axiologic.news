export default {
    name: "Fractal Bloom",
    description: "Life-inspired fractal patterns blooming with vibrant energy",
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

let time = 0;

function drawFractalBranch(x, y, length, angle, depth, hue) {
    if (depth <= 0 || length < 2) return;
    
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    // Branch color based on depth and time
    const intensity = depth / 8;
    const shimmer = Math.sin(time * 0.02 + depth) * 0.3 + 0.7;
    
    ctx.strokeStyle = \`hsla(\${hue + depth * 15}, 70%, \${50 + intensity * 30}%, \${intensity * shimmer})\`;
    ctx.lineWidth = Math.max(1, depth * 0.8);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Add glowing effect for vibrant energy
    if (depth > 3) {
        ctx.strokeStyle = \`hsla(\${hue + depth * 15}, 90%, 80%, \${intensity * 0.3})\`;
        ctx.lineWidth = depth * 1.5;
        ctx.stroke();
    }
    
    // Recursive branching with natural variation
    const newLength = length * (0.7 + Math.sin(time * 0.01 + angle) * 0.1);
    const angleVar = 0.3 + Math.sin(time * 0.008) * 0.2;
    
    drawFractalBranch(endX, endY, newLength, angle - angleVar, depth - 1, hue);
    drawFractalBranch(endX, endY, newLength, angle + angleVar, depth - 1, hue);
    
    // Add flowering effect at branch tips
    if (depth <= 2 && length > 5) {
        const flowerSize = 3 + Math.sin(time * 0.05 + x * 0.01) * 2;
        const petalGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, flowerSize * 2);
        petalGradient.addColorStop(0, \`hsla(\${hue + 60}, 80%, 70%, 0.8)\`);
        petalGradient.addColorStop(0.5, \`hsla(\${hue + 40}, 70%, 60%, 0.5)\`);
        petalGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = petalGradient;
        ctx.beginPath();
        ctx.arc(endX, endY, flowerSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Petal details
        for (let i = 0; i < 5; i++) {
            const petalAngle = (Math.PI * 2 / 5) * i + time * 0.01;
            const petalX = endX + Math.cos(petalAngle) * flowerSize;
            const petalY = endY + Math.sin(petalAngle) * flowerSize;
            
            ctx.fillStyle = \`hsla(\${hue + 60}, 90%, 80%, 0.7)\`;
            ctx.beginPath();
            ctx.arc(petalX, petalY, flowerSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function animate() {
    // Gradient background representing life energy
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
    );
    gradient.addColorStop(0, '#0a1a0a');
    gradient.addColorStop(0.5, '#1a2a1a');
    gradient.addColorStop(1, '#0f1f0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height;
    
    // Multiple fractal trees with different hues
    const treePositions = [
        { x: centerX, hue: 120 }, // Green
        { x: centerX - 150, hue: 60 }, // Yellow-green
        { x: centerX + 150, hue: 180 }, // Cyan
        { x: centerX - 300, hue: 300 }, // Magenta
        { x: centerX + 300, hue: 30 }   // Orange
    ];
    
    treePositions.forEach(tree => {
        if (tree.x >= -100 && tree.x <= canvas.width + 100) {
            // Main trunk with breathing effect
            const trunkHeight = 80 + Math.sin(time * 0.005 + tree.x * 0.01) * 20;
            
            drawFractalBranch(
                tree.x, 
                centerY, 
                trunkHeight, 
                -Math.PI / 2 + Math.sin(time * 0.003) * 0.1, 
                8, 
                tree.hue
            );
            
            // Root system (inverted fractal)
            ctx.save();
            ctx.globalAlpha = 0.3;
            drawFractalBranch(
                tree.x, 
                centerY, 
                trunkHeight * 0.6, 
                Math.PI / 2 + Math.sin(time * 0.004) * 0.1, 
                6, 
                tree.hue + 180
            );
            ctx.restore();
        }
    });
    
    // Add floating pollen/energy particles
    for (let i = 0; i < 30; i++) {
        const x = (time * 0.5 + i * 30) % (canvas.width + 100) - 50;
        const y = canvas.height * 0.3 + Math.sin(time * 0.01 + i) * 100;
        const size = 2 + Math.sin(time * 0.03 + i) * 1;
        const hue = (time * 2 + i * 12) % 360;
        
        ctx.fillStyle = \`hsla(\${hue}, 80%, 70%, 0.6)\`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle trail
        ctx.fillStyle = \`hsla(\${hue}, 60%, 50%, 0.2)\`;
        ctx.beginPath();
        ctx.ellipse(x - 10, y, size * 2, size, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};