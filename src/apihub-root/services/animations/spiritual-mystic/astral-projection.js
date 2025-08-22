export default {
    name: "Astral Projection",
    description: "Ethereal energy streams and astral bodies floating through dimensions",
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

const astralBodies = [];
for (let i = 0; i < 8; i++) {
    astralBodies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 20 + Math.random() * 30,
        hue: 250 + Math.random() * 60,
        phase: Math.random() * Math.PI * 2,
        trail: []
    });
}

let time = 0;

function animate() {
    // Dark cosmic background with fade effect
    ctx.fillStyle = 'rgba(0, 0, 20, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw astral bodies
    astralBodies.forEach(body => {
        // Update position
        body.x += body.vx;
        body.y += body.vy;
        
        // Wrap around screen
        if (body.x < -50) body.x = canvas.width + 50;
        if (body.x > canvas.width + 50) body.x = -50;
        if (body.y < -50) body.y = canvas.height + 50;
        if (body.y > canvas.height + 50) body.y = -50;
        
        // Add to trail
        body.trail.push({ x: body.x, y: body.y });
        if (body.trail.length > 20) body.trail.shift();
        
        // Draw ethereal trail
        ctx.strokeStyle = \`hsla(\${body.hue}, 70%, 60%, 0.1)\`;
        ctx.lineWidth = body.size / 5;
        ctx.beginPath();
        body.trail.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        
        // Draw astral body with pulsing glow
        const pulse = Math.sin(time * 0.02 + body.phase) * 0.3 + 0.7;
        const gradient = ctx.createRadialGradient(body.x, body.y, 0, body.x, body.y, body.size * pulse);
        gradient.addColorStop(0, \`hsla(\${body.hue}, 100%, 80%, 0.8)\`);
        gradient.addColorStop(0.5, \`hsla(\${body.hue}, 80%, 60%, 0.4)\`);
        gradient.addColorStop(1, \`hsla(\${body.hue}, 60%, 40%, 0)\`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(body.x, body.y, body.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = \`hsla(\${body.hue}, 100%, 90%, 0.9)\`;
        ctx.beginPath();
        ctx.arc(body.x, body.y, body.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw energy connections between nearby bodies
    ctx.strokeStyle = 'rgba(147, 112, 219, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < astralBodies.length; i++) {
        for (let j = i + 1; j < astralBodies.length; j++) {
            const dx = astralBodies[i].x - astralBodies[j].x;
            const dy = astralBodies[i].y - astralBodies[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const opacity = (1 - distance / 150) * 0.3;
                ctx.strokeStyle = \`rgba(147, 112, 219, \${opacity})\`;
                ctx.beginPath();
                ctx.moveTo(astralBodies[i].x, astralBodies[i].y);
                ctx.lineTo(astralBodies[j].x, astralBodies[j].y);
                ctx.stroke();
            }
        }
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};