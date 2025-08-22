export default {
    name: "Crystal Meditation",
    description: "Floating crystals emitting peaceful healing energy",
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

const crystals = [];
for (let i = 0; i < 7; i++) {
    crystals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 30 + Math.random() * 40,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: 0.002 + Math.random() * 0.003,
        floatPhase: Math.random() * Math.PI * 2,
        color: [
            [147, 112, 219], // Purple
            [138, 43, 226],  // Blue Violet
            [123, 104, 238], // Medium Slate Blue
            [106, 90, 205],  // Slate Blue
            [72, 61, 139],   // Dark Slate Blue
            [186, 85, 211],  // Medium Orchid
            [148, 0, 211]    // Dark Violet
        ][i % 7]
    });
}

let time = 0;

function drawCrystal(x, y, size, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Crystal shape (hexagonal prism)
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        points.push({
            x: Math.cos(angle) * size,
            y: Math.sin(angle) * size * 0.5
        });
    }
    
    // Draw crystal faces with gradient
    for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        const gradient = ctx.createLinearGradient(0, -size, 0, size);
        gradient.addColorStop(0, \`rgba(\${color[0]}, \${color[1]}, \${color[2]}, 0.6)\`);
        gradient.addColorStop(0.5, \`rgba(\${color[0]}, \${color[1]}, \${color[2]}, 0.4)\`);
        gradient.addColorStop(1, \`rgba(\${color[0]}, \${color[1]}, \${color[2]}, 0.2)\`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.8);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.lineTo(points[next].x, points[next].y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = \`rgba(\${color[0]}, \${color[1]}, \${color[2]}, 0.8)\`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Crystal top
    ctx.fillStyle = \`rgba(\${color[0]}, \${color[1]}, \${color[2]}, 0.7)\`;
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function animate() {
    // Mystical gradient background
    const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    bgGradient.addColorStop(0, 'rgba(25, 0, 51, 0.95)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 20, 0.98)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw energy field
    ctx.strokeStyle = 'rgba(147, 112, 219, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const radius = 100 + i * 80 + Math.sin(time * 0.02 + i) * 20;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw and update crystals
    crystals.forEach((crystal, index) => {
        // Floating motion
        const floatY = Math.sin(time * 0.01 + crystal.floatPhase) * 20;
        const floatX = Math.cos(time * 0.008 + crystal.floatPhase) * 15;
        
        // Update rotation
        crystal.rotation += crystal.rotSpeed;
        
        // Draw crystal glow
        const glowGradient = ctx.createRadialGradient(
            crystal.x + floatX, crystal.y + floatY, 0,
            crystal.x + floatX, crystal.y + floatY, crystal.size * 2
        );
        glowGradient.addColorStop(0, \`rgba(\${crystal.color[0]}, \${crystal.color[1]}, \${crystal.color[2]}, 0.3)\`);
        glowGradient.addColorStop(0.5, \`rgba(\${crystal.color[0]}, \${crystal.color[1]}, \${crystal.color[2]}, 0.1)\`);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(crystal.x + floatX, crystal.y + floatY, crystal.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw crystal
        drawCrystal(
            crystal.x + floatX,
            crystal.y + floatY,
            crystal.size,
            crystal.rotation,
            crystal.color
        );
        
        // Energy beams between crystals
        if (index < crystals.length - 1) {
            const nextCrystal = crystals[index + 1];
            const nextFloatY = Math.sin(time * 0.01 + nextCrystal.floatPhase) * 20;
            const nextFloatX = Math.cos(time * 0.008 + nextCrystal.floatPhase) * 15;
            
            const gradient = ctx.createLinearGradient(
                crystal.x + floatX, crystal.y + floatY,
                nextCrystal.x + nextFloatX, nextCrystal.y + nextFloatY
            );
            gradient.addColorStop(0, \`rgba(\${crystal.color[0]}, \${crystal.color[1]}, \${crystal.color[2]}, 0.2)\`);
            gradient.addColorStop(0.5, 'rgba(147, 112, 219, 0.1)');
            gradient.addColorStop(1, \`rgba(\${nextCrystal.color[0]}, \${nextCrystal.color[1]}, \${nextCrystal.color[2]}, 0.2)\`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(crystal.x + floatX, crystal.y + floatY);
            ctx.lineTo(nextCrystal.x + nextFloatX, nextCrystal.y + nextFloatY);
            ctx.stroke();
        }
    });
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};