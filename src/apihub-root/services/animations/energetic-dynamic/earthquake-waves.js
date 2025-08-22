export default {
    name: "Earthquake Waves",
    description: "Seismic shock waves with debris particles",
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
const waveRings = [];
const debrisParticles = [];

// Create earthquake wave rings
for(let i = 0; i < 6; i++) {
    waveRings.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.8 + (Math.random() - 0.5) * 100,
        radius: 0,
        maxRadius: 200 + Math.random() * 150,
        speed: 2 + Math.random() * 3,
        intensity: Math.random() * 0.8 + 0.2,
        frequency: Math.random() * 4 + 2,
        phase: Math.random() * Math.PI * 2
    });
}

// Create debris particles
for(let i = 0; i < 60; i++) {
    debrisParticles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 8 - 2,
        size: Math.random() * 6 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        bounces: 0,
        color: Math.random() * 60 + 20 // Brown to orange spectrum
    });
}

function animate() {
    // Dark, dusty background
    ctx.fillStyle = 'rgba(30, 20, 10, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw earthquake waves
    for(let i = waveRings.length - 1; i >= 0; i--) {
        const wave = waveRings[i];
        wave.radius += wave.speed;
        wave.phase += 0.1;
        
        if(wave.radius > wave.maxRadius) {
            // Reset wave
            wave.radius = 0;
            wave.x = canvas.width / 2 + (Math.random() - 0.5) * 200;
            wave.y = canvas.height * 0.8 + (Math.random() - 0.5) * 100;
        }
        
        // Draw concentric shock waves
        const alpha = wave.intensity * (1 - wave.radius / wave.maxRadius);
        
        for(let ring = 0; ring < 3; ring++) {
            const ringRadius = wave.radius - ring * 20;
            if(ringRadius > 0) {
                // Create jagged earthquake effect
                ctx.strokeStyle = \`hsla(35, 80%, 60%, \${alpha * (0.8 - ring * 0.2)})\`;
                ctx.lineWidth = (4 - ring) * alpha;
                ctx.shadowBlur = 20;
                ctx.shadowColor = 'hsl(35, 80%, 50%)';
                
                ctx.beginPath();
                const segments = 32;
                for(let j = 0; j < segments; j++) {
                    const angle = (j / segments) * Math.PI * 2;
                    const disturbance = Math.sin(angle * wave.frequency + wave.phase) * 8 * alpha;
                    const x = wave.x + Math.cos(angle) * (ringRadius + disturbance);
                    const y = wave.y + Math.sin(angle) * (ringRadius + disturbance);
                    
                    if(j === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
    }
    
    // Update and draw debris particles
    debrisParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3; // Gravity
        particle.rotation += particle.rotationSpeed;
        
        // Bounce off ground
        if(particle.y > canvas.height - particle.size && particle.vy > 0) {
            particle.vy *= -0.6;
            particle.vx *= 0.8;
            particle.bounces++;
        }
        
        // Reset if too many bounces or off screen
        if(particle.bounces > 3 || particle.x < -50 || particle.x > canvas.width + 50) {
            particle.x = Math.random() * canvas.width;
            particle.y = canvas.height + Math.random() * 100;
            particle.vx = (Math.random() - 0.5) * 4;
            particle.vy = -Math.random() * 8 - 2;
            particle.bounces = 0;
        }
        
        // Draw rotating debris
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        ctx.fillStyle = \`hsl(\${particle.color}, 70%, 40%)\`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = \`hsl(\${particle.color}, 70%, 30%)\`;
        
        // Draw irregular debris shape
        ctx.beginPath();
        ctx.moveTo(-particle.size, -particle.size/2);
        ctx.lineTo(particle.size/2, -particle.size);
        ctx.lineTo(particle.size, particle.size/2);
        ctx.lineTo(-particle.size/2, particle.size);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    });
    
    ctx.shadowBlur = 0;
    time += 1;
    requestAnimationFrame(animate);
}
animate();`
};