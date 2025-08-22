export default {
    name: "Third Eye",
    description: "Mystical third eye opening with energy radiating outward",
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
const particles = [];

// Create energy particles
for (let i = 0; i < 50; i++) {
    particles.push({
        angle: Math.random() * Math.PI * 2,
        distance: 0,
        speed: 0.5 + Math.random() * 2,
        size: 1 + Math.random() * 3,
        hue: 260 + Math.random() * 40,
        life: 0
    });
}

function drawEye(x, y, size, openness) {
    ctx.save();
    ctx.translate(x, y);
    
    // Outer eye shape
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.5 * openness, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner iris
    const irisGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
    irisGradient.addColorStop(0, 'rgba(147, 112, 219, 0.9)');
    irisGradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.7)');
    irisGradient.addColorStop(1, 'rgba(75, 0, 130, 0.5)');
    
    ctx.fillStyle = irisGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.4 * openness, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupil with cosmic depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.15, size * 0.15 * openness, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner light
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(-size * 0.05, -size * 0.05, size * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 30, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Eye opening animation
    const openness = Math.sin(time * 0.01) * 0.3 + 0.7;
    
    // Draw radiating energy waves
    for (let i = 0; i < 3; i++) {
        const waveRadius = (time * 2 + i * 50) % 300;
        const waveOpacity = Math.max(0, 1 - waveRadius / 300);
        
        ctx.strokeStyle = \`rgba(147, 112, 219, \${waveOpacity * 0.3})\`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Draw and update particles
    particles.forEach(p => {
        p.distance += p.speed;
        p.life += 0.01;
        
        if (p.distance > 350 || p.life > 1) {
            p.distance = 0;
            p.angle = Math.random() * Math.PI * 2;
            p.life = 0;
            p.speed = 0.5 + Math.random() * 2;
        }
        
        const x = centerX + Math.cos(p.angle) * p.distance;
        const y = centerY + Math.sin(p.angle) * p.distance;
        const opacity = (1 - p.life) * 0.8;
        
        ctx.fillStyle = \`hsla(\${p.hue}, 70%, 60%, \${opacity})\`;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw the third eye
    drawEye(centerX, centerY, 80, openness);
    
    // Draw mystical symbols around the eye
    ctx.strokeStyle = 'rgba(147, 112, 219, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + time * 0.005;
        const distance = 120;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        // Draw triangle symbol
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-8, 8);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};