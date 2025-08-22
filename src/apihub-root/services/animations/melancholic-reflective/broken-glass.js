export default {
    name: "Broken Glass",
    description: "Shattered fragments reflecting broken dreams and lost hopes",
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

const fragments = [];
const numFragments = 25;

// Create glass fragments
for (let i = 0; i < numFragments; i++) {
    const centerX = Math.random() * canvas.width;
    const centerY = Math.random() * canvas.height;
    const vertices = [];
    const numVertices = 3 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < numVertices; j++) {
        const angle = (Math.PI * 2 / numVertices) * j + (Math.random() - 0.5) * 0.5;
        const radius = 30 + Math.random() * 50;
        vertices.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        });
    }
    
    fragments.push({
        x: centerX,
        y: centerY,
        vertices: vertices,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.002,
        opacity: 0.3 + Math.random() * 0.4,
        shimmer: Math.random() * Math.PI * 2,
        fall: Math.random() * 0.3
    });
}

let time = 0;

function animate() {
    // Dark, moody background
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw fragments
    fragments.forEach(fragment => {
        fragment.rotation += fragment.rotSpeed;
        fragment.y += fragment.fall;
        fragment.shimmer += 0.02;
        
        // Reset fragment when it falls off screen
        if (fragment.y - 100 > canvas.height) {
            fragment.y = -100;
            fragment.x = Math.random() * canvas.width;
        }
        
        ctx.save();
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(fragment.rotation);
        
        // Glass shimmer effect
        const shimmerOpacity = Math.sin(fragment.shimmer) * 0.2 + 0.3;
        
        // Draw fragment with gradient
        const gradient = ctx.createLinearGradient(-50, -50, 50, 50);
        gradient.addColorStop(0, \`rgba(180, 200, 220, \${fragment.opacity * shimmerOpacity})\`);
        gradient.addColorStop(0.5, \`rgba(150, 170, 190, \${fragment.opacity * 0.7})\`);
        gradient.addColorStop(1, \`rgba(120, 140, 160, \${fragment.opacity * 0.5})\`);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = \`rgba(200, 220, 240, \${fragment.opacity})\`;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        fragment.vertices.forEach((vertex, i) => {
            if (i === 0) ctx.moveTo(vertex.x, vertex.y);
            else ctx.lineTo(vertex.x, vertex.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add reflection highlight
        ctx.fillStyle = \`rgba(255, 255, 255, \${fragment.opacity * shimmerOpacity * 0.5})\`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 5, fragment.rotation, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
    
    // Add subtle light rays through fragments
    ctx.strokeStyle = 'rgba(200, 220, 240, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const startX = Math.random() * canvas.width;
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + Math.cos(angle) * canvas.height, canvas.height);
        ctx.stroke();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};