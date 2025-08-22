export default {
    name: "Zen Garden",
    description: "Peaceful ripples spreading across tranquil water",
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

const ripples = [];
let time = 0;

// Create new ripples periodically
setInterval(() => {
    if (ripples.length < 5) {
        ripples.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 0,
            maxRadius: 150 + Math.random() * 100,
            speed: 0.5 + Math.random() * 0.5,
            opacity: 1
        });
    }
}, 3000);

function animate() {
    ctx.fillStyle = 'rgba(240, 248, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += ripple.speed;
        ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);
        
        if (ripple.opacity <= 0) {
            ripples.splice(i, 1);
            continue;
        }
        
        // Draw multiple concentric circles for each ripple
        for (let j = 0; j < 3; j++) {
            const r = ripple.radius - j * 20;
            if (r > 0) {
                ctx.strokeStyle = \`rgba(135, 206, 235, \${ripple.opacity * (0.3 - j * 0.1)})\`;
                ctx.lineWidth = 2 - j * 0.5;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    // Draw peaceful bamboo stalks
    ctx.strokeStyle = 'rgba(34, 139, 34, 0.2)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        const x = (canvas.width / 6) * (i + 1);
        const sway = Math.sin(time * 0.001 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.quadraticCurveTo(x + sway, canvas.height / 2, x + sway * 2, 0);
        ctx.stroke();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};