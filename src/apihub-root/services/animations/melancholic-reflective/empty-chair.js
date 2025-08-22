export default {
    name: "Empty Chair",
    description: "A single empty chair in a room filled with memories and shadows",
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

const dustParticles = [];
for (let i = 0; i < 30; i++) {
    dustParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1
    });
}

let time = 0;

function drawChair(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    
    // Chair shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 60, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Chair legs
    ctx.strokeStyle = '#3a342f';
    ctx.lineWidth = 6;
    const legPositions = [[-15, -15], [15, -15], [-15, 15], [15, 15]];
    legPositions.forEach(pos => {
        ctx.beginPath();
        ctx.moveTo(pos[0], pos[1]);
        ctx.lineTo(pos[0], 50);
        ctx.stroke();
    });
    
    // Chair seat
    ctx.fillStyle = '#4a4238';
    ctx.strokeStyle = '#3a342f';
    ctx.lineWidth = 2;
    ctx.fillRect(-20, -20, 40, 35);
    ctx.strokeRect(-20, -20, 40, 35);
    
    // Chair back
    ctx.fillRect(-18, -50, 36, 35);
    ctx.strokeRect(-18, -50, 36, 35);
    
    ctx.restore();
}

function animate() {
    // Dim room background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1e1a17');
    gradient.addColorStop(0.5, '#252118');
    gradient.addColorStop(1, '#1a1814');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Faint window light
    const lightGradient = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.2, 0,
        canvas.width * 0.8, canvas.height * 0.2, canvas.width * 0.4
    );
    lightGradient.addColorStop(0, 'rgba(255, 248, 220, 0.1)');
    lightGradient.addColorStop(0.5, 'rgba(255, 248, 220, 0.05)');
    lightGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw dust particles
    dustParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Gentle floating motion
        particle.x += Math.sin(time * 0.001 + particle.y * 0.01) * 0.1;
        particle.y += Math.cos(time * 0.0008 + particle.x * 0.01) * 0.05;
        
        // Wrap around edges
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;
        
        ctx.fillStyle = \`rgba(200, 180, 160, \${particle.opacity})\`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw the empty chair in center
    const chairScale = 1 + Math.sin(time * 0.001) * 0.02; // Slight breathing effect
    drawChair(canvas.width / 2, canvas.height * 0.65, chairScale);
    
    // Add memory ghosting effect - faint silhouette of someone who used to sit there
    const ghostOpacity = Math.sin(time * 0.0005) * 0.05 + 0.03;
    ctx.fillStyle = \`rgba(180, 160, 140, \${ghostOpacity})\`;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height * 0.55, 25, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Floor reflection
    ctx.save();
    ctx.scale(1, -0.3);
    ctx.translate(0, -canvas.height * 2);
    ctx.globalAlpha = 0.1;
    drawChair(canvas.width / 2, canvas.height * 0.65, 1);
    ctx.restore();
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};