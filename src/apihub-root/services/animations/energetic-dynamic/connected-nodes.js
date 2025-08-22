export default {
    name: "Dynamic Network",
    description: "Fast-moving interconnected nodes",
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

const nodes = [];
for (let i = 0; i < 60; i++) {
    nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2, // Faster movement
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 2
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update positions
    nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
    });
    
    // Draw connections
    nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(other => {
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const opacity = (1 - distance / 150) * 0.7;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(other.x, other.y);
                ctx.strokeStyle = \`rgba(255, 150, 50, \${opacity})\`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    });
    
    // Draw nodes
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
        ctx.fill();
    });
    
    requestAnimationFrame(animate);
}
animate();`
};