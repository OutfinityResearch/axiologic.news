export default {
    name: "Soul Journey",
    description: "Spiritual journey through ethereal realms with flowing soul energy",
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

const soulPaths = [];
for (let i = 0; i < 5; i++) {
    const path = [];
    for (let j = 0; j < 100; j++) {
        path.push({
            x: 0,
            y: 0
        });
    }
    soulPaths.push({
        path: path,
        hue: 250 + i * 20,
        offset: i * 0.2,
        speed: 0.01 + Math.random() * 0.01
    });
}

let time = 0;

function animate() {
    // Deep space background
    ctx.fillStyle = 'rgba(0, 0, 20, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ethereal background mist
    const mistGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
    );
    mistGradient.addColorStop(0, 'rgba(138, 43, 226, 0.02)');
    mistGradient.addColorStop(0.5, 'rgba(147, 112, 219, 0.01)');
    mistGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = mistGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw soul paths
    soulPaths.forEach((soul, soulIndex) => {
        // Update path points
        for (let i = 0; i < soul.path.length; i++) {
            const t = i / soul.path.length;
            const angle = time * soul.speed + t * Math.PI * 4 + soul.offset;
            
            // Create spiraling path through space
            const radius = 100 + Math.sin(angle * 2) * 50 + t * 200;
            const x = canvas.width / 2 + Math.cos(angle) * radius;
            const y = canvas.height / 2 + Math.sin(angle) * radius * 0.6 + Math.sin(time * 0.02 + t * Math.PI) * 30;
            
            soul.path[i].x = x;
            soul.path[i].y = y;
        }
        
        // Draw soul trail
        ctx.strokeStyle = \`hsla(\${soul.hue}, 70%, 60%, 0.3)\`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        soul.path.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        
        // Draw glowing soul orbs along the path
        for (let i = 0; i < soul.path.length; i += 10) {
            const point = soul.path[i];
            const size = 3 + Math.sin(time * 0.05 + i * 0.1) * 2;
            
            // Outer glow
            const glowGradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, size * 4
            );
            glowGradient.addColorStop(0, \`hsla(\${soul.hue}, 100%, 70%, 0.4)\`);
            glowGradient.addColorStop(0.5, \`hsla(\${soul.hue}, 80%, 60%, 0.2)\`);
            glowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner core
            ctx.fillStyle = \`hsla(\${soul.hue}, 100%, 90%, 0.8)\`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw leading soul entity
        const leadPoint = soul.path[soul.path.length - 1];
        const leadSize = 8 + Math.sin(time * 0.03 + soulIndex) * 3;
        
        // Soul entity glow
        const entityGradient = ctx.createRadialGradient(
            leadPoint.x, leadPoint.y, 0,
            leadPoint.x, leadPoint.y, leadSize * 5
        );
        entityGradient.addColorStop(0, \`hsla(\${soul.hue}, 100%, 80%, 0.6)\`);
        entityGradient.addColorStop(0.3, \`hsla(\${soul.hue}, 80%, 70%, 0.3)\`);
        entityGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = entityGradient;
        ctx.beginPath();
        ctx.arc(leadPoint.x, leadPoint.y, leadSize * 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Soul entity core
        ctx.fillStyle = \`hsla(\${soul.hue}, 100%, 95%, 0.9)\`;
        ctx.beginPath();
        ctx.arc(leadPoint.x, leadPoint.y, leadSize, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw dimensional portal at center
    const portalSize = 30 + Math.sin(time * 0.02) * 10;
    const portalGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, portalSize
    );
    portalGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    portalGradient.addColorStop(0.5, 'rgba(147, 112, 219, 0.5)');
    portalGradient.addColorStop(1, 'rgba(138, 43, 226, 0.2)');
    
    ctx.fillStyle = portalGradient;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, portalSize, 0, Math.PI * 2);
    ctx.fill();
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};