export default {
    name: "Bouncing Bubbles",
    description: "Colorful bubbles bouncing and popping with playful energy",
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

const bubbles = [];
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#FD79A8', '#A29BFE', '#6C5CE7', '#FDCB6E', '#E17055'
];

for (let i = 0; i < 20; i++) {
    bubbles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 20 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.05,
        popTime: 0,
        popping: false
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function animate() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    bubbles.forEach((bubble, index) => {
        if (bubble.popping) {
            bubble.popTime += 0.1;
            if (bubble.popTime > 1) {
                // Reset bubble
                bubble.x = Math.random() * canvas.width;
                bubble.y = canvas.height + bubble.radius;
                bubble.vx = (Math.random() - 0.5) * 2;
                bubble.vy = -Math.random() * 2 - 1;
                bubble.color = colors[Math.floor(Math.random() * colors.length)];
                bubble.popping = false;
                bubble.popTime = 0;
            } else {
                // Draw popping animation
                const rgb = hexToRgb(bubble.color);
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    const distance = bubble.radius * bubble.popTime * 2;
                    const x = bubble.x + Math.cos(angle) * distance;
                    const y = bubble.y + Math.sin(angle) * distance;
                    const size = bubble.radius * 0.3 * (1 - bubble.popTime);
                    
                    ctx.fillStyle = \`rgba(\${rgb.r}, \${rgb.g}, \${rgb.b}, \${1 - bubble.popTime})\`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            return;
        }
        
        // Update position
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        bubble.wobble += bubble.wobbleSpeed;
        
        // Add wobble effect
        const wobbleX = Math.sin(bubble.wobble) * 2;
        const wobbleY = Math.cos(bubble.wobble * 1.3) * 2;
        
        // Bounce off walls
        if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > canvas.width) {
            bubble.vx *= -0.9;
            bubble.x = Math.max(bubble.radius, Math.min(canvas.width - bubble.radius, bubble.x));
        }
        if (bubble.y - bubble.radius < 0 || bubble.y + bubble.radius > canvas.height) {
            bubble.vy *= -0.9;
            bubble.y = Math.max(bubble.radius, Math.min(canvas.height - bubble.radius, bubble.y));
        }
        
        // Random pop chance
        if (Math.random() < 0.001) {
            bubble.popping = true;
        }
        
        // Draw bubble
        const rgb = hexToRgb(bubble.color);
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(
            bubble.x + wobbleX, bubble.y + wobbleY, 0,
            bubble.x + wobbleX, bubble.y + wobbleY, bubble.radius * 1.5
        );
        glowGradient.addColorStop(0, \`rgba(\${rgb.r}, \${rgb.g}, \${rgb.b}, 0.3)\`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(bubble.x + wobbleX, bubble.y + wobbleY, bubble.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Main bubble
        const bubbleGradient = ctx.createRadialGradient(
            bubble.x + wobbleX - bubble.radius * 0.3,
            bubble.y + wobbleY - bubble.radius * 0.3,
            0,
            bubble.x + wobbleX, bubble.y + wobbleY, bubble.radius
        );
        bubbleGradient.addColorStop(0, \`rgba(\${rgb.r}, \${rgb.g}, \${rgb.b}, 0.2)\`);
        bubbleGradient.addColorStop(0.5, \`rgba(\${rgb.r}, \${rgb.g}, \${rgb.b}, 0.4)\`);
        bubbleGradient.addColorStop(1, \`rgba(\${rgb.r}, \${rgb.g}, \${rgb.b}, 0.6)\`);
        
        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();
        ctx.arc(bubble.x + wobbleX, bubble.y + wobbleY, bubble.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(
            bubble.x + wobbleX - bubble.radius * 0.3,
            bubble.y + wobbleY - bubble.radius * 0.3,
            bubble.radius * 0.3, bubble.radius * 0.2,
            -Math.PI / 4, 0, Math.PI * 2
        );
        ctx.fill();
    });
    
    requestAnimationFrame(animate);
}
animate();`
};