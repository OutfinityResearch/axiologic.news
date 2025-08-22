export default {
    name: "Lonely Rain",
    description: "Gentle rain falling on a melancholic evening",
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

const raindrops = [];
const ripples = [];

for (let i = 0; i < 200; i++) {
    raindrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 10 + Math.random() * 20,
        speed: 10 + Math.random() * 5,
        opacity: 0.1 + Math.random() * 0.3
    });
}

function animate() {
    // Dark, moody background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2C3E50');
    gradient.addColorStop(1, '#34495E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw raindrops
    ctx.strokeStyle = 'rgba(174, 198, 207, 0.5)';
    ctx.lineWidth = 1;
    
    raindrops.forEach(drop => {
        drop.y += drop.speed;
        
        if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
            
            // Create ripple
            if (Math.random() < 0.1) {
                ripples.push({
                    x: drop.x,
                    y: canvas.height - 50 + Math.random() * 50,
                    radius: 0,
                    maxRadius: 20 + Math.random() * 30,
                    life: 1
                });
            }
        }
        
        ctx.globalAlpha = drop.opacity;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
    });
    
    // Draw ripples
    ctx.globalAlpha = 1;
    for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += 1;
        ripple.life -= 0.02;
        
        if (ripple.life <= 0) {
            ripples.splice(i, 1);
            continue;
        }
        
        ctx.strokeStyle = \`rgba(174, 198, 207, \${ripple.life * 0.3})\`;
        ctx.lineWidth = 2 * ripple.life;
        ctx.beginPath();
        ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    requestAnimationFrame(animate);
}
animate();`
};