export default {
    name: "Divine Love",
    description: "The infinite flow of divine love emanating from the cosmic heart",
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
const loveParticles = [];
const heartbeats = [];

// Create love particles
for (let i = 0; i < 40; i++) {
    loveParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 6,
        hue: 300 + Math.random() * 60, // Pink to purple
        intensity: 0.6 + Math.random() * 0.4,
        pulsation: Math.random() * Math.PI * 2,
        life: 1
    });
}

// Create heartbeat pulses
for (let i = 0; i < 5; i++) {
    heartbeats.push({
        radius: 0,
        maxRadius: 100 + i * 50,
        opacity: 0.8 - i * 0.1,
        active: false,
        delay: i * 20
    });
}

function drawDivineHeart(centerX, centerY, size, intensity) {
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Heart glow
    const heartGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
    heartGlow.addColorStop(0, \`rgba(255, 20, 147, \${intensity * 0.8})\`);
    heartGlow.addColorStop(0.5, \`rgba(255, 105, 180, \${intensity * 0.5})\`);
    heartGlow.addColorStop(1, \`rgba(238, 130, 238, 0)\`);
    
    ctx.fillStyle = heartGlow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw heart shape
    const heartSize = size;
    ctx.fillStyle = \`rgba(255, 20, 147, \${intensity})\`;
    ctx.beginPath();
    ctx.moveTo(0, heartSize * 0.3);
    
    // Left curve
    ctx.bezierCurveTo(-heartSize * 0.5, -heartSize * 0.2, -heartSize, -heartSize * 0.2, -heartSize, heartSize * 0.2);
    ctx.bezierCurveTo(-heartSize, heartSize * 0.5, -heartSize * 0.5, heartSize * 0.8, 0, heartSize * 1.2);
    
    // Right curve  
    ctx.bezierCurveTo(heartSize * 0.5, heartSize * 0.8, heartSize, heartSize * 0.5, heartSize, heartSize * 0.2);
    ctx.bezierCurveTo(heartSize, -heartSize * 0.2, heartSize * 0.5, -heartSize * 0.2, 0, heartSize * 0.3);
    
    ctx.fill();
    
    // Heart highlight
    ctx.fillStyle = \`rgba(255, 255, 255, \${intensity * 0.6})\`;
    ctx.beginPath();
    ctx.ellipse(-heartSize * 0.3, -heartSize * 0.1, heartSize * 0.2, heartSize * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner sacred geometry
    ctx.strokeStyle = \`rgba(255, 255, 255, \${intensity * 0.4})\`;
    ctx.lineWidth = 2;
    
    // Flower of life in heart center
    const centerRadius = heartSize * 0.15;
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const x = Math.cos(angle) * centerRadius;
        const y = Math.sin(angle) * centerRadius;
        
        ctx.beginPath();
        ctx.arc(x, y + heartSize * 0.1, centerRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawLoveParticle(particle) {
    const pulsation = Math.sin(particle.pulsation) * 0.3 + 0.7;
    const currentSize = particle.size * pulsation;
    const currentIntensity = particle.intensity * particle.life;
    
    // Particle glow
    const particleGlow = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, currentSize * 3
    );
    particleGlow.addColorStop(0, \`hsla(\${particle.hue}, 80%, 70%, \${currentIntensity})\`);
    particleGlow.addColorStop(0.5, \`hsla(\${particle.hue}, 70%, 60%, \${currentIntensity * 0.5})\`);
    particleGlow.addColorStop(1, \`hsla(\${particle.hue}, 60%, 50%, 0)\`);
    
    ctx.fillStyle = particleGlow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, currentSize * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Particle core
    ctx.fillStyle = \`hsla(\${particle.hue}, 90%, 80%, \${currentIntensity})\`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Sparkle effect
    if (Math.random() < 0.1) {
        ctx.fillStyle = \`rgba(255, 255, 255, \${currentIntensity})\`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawHeartbeatPulse(pulse, centerX, centerY) {
    if (pulse.active && pulse.opacity > 0) {
        ctx.strokeStyle = \`rgba(255, 20, 147, \${pulse.opacity})\`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner pulse
        ctx.strokeStyle = \`rgba(255, 105, 180, \${pulse.opacity * 0.7})\`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulse.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function animate() {
    // Cosmic love background
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#2c1810');
    gradient.addColorStop(0.3, '#4a1942');
    gradient.addColorStop(0.7, '#1a0033');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Update heartbeat pulses
    heartbeats.forEach((pulse, index) => {
        if (time % 120 === pulse.delay) {
            pulse.active = true;
            pulse.radius = 0;
            pulse.opacity = 0.8 - index * 0.1;
        }
        
        if (pulse.active) {
            pulse.radius += 3;
            pulse.opacity *= 0.97;
            
            if (pulse.radius >= pulse.maxRadius) {
                pulse.active = false;
            }
        }
        
        drawHeartbeatPulse(pulse, centerX, centerY);
    });
    
    // Heart size with breathing effect
    const heartSize = 60 + Math.sin(time * 0.02) * 10;
    const heartIntensity = 0.8 + Math.sin(time * 0.03) * 0.2;
    
    // Draw main divine heart
    drawDivineHeart(centerX, centerY, heartSize, heartIntensity);
    
    // Update love particles
    loveParticles.forEach((particle, index) => {
        // Particle movement
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.pulsation += 0.05;
        
        // Attraction to center heart
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            particle.vx += dx * 0.00001;
            particle.vy += dy * 0.00001;
        }
        
        // Orbital motion around heart
        if (distance < 150) {
            const angle = Math.atan2(dy, dx);
            particle.vx += Math.cos(angle + Math.PI / 2) * 0.001;
            particle.vy += Math.sin(angle + Math.PI / 2) * 0.001;
        }
        
        // Color cycling through love spectrum
        particle.hue = (particle.hue + 0.2) % 360;
        if (particle.hue < 280) particle.hue = 280;
        if (particle.hue > 360) particle.hue = 300;
        
        // Boundary wrapping
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        drawLoveParticle(particle);
    });
    
    // Love emanation waves
    for (let i = 0; i < 3; i++) {
        const waveRadius = 200 + i * 100 + (time * 2) % 300;
        const waveOpacity = 0.3 - (waveRadius / 600) - i * 0.05;
        
        if (waveOpacity > 0) {
            ctx.strokeStyle = \`rgba(255, 20, 147, \${waveOpacity})\`;
            ctx.lineWidth = 3 - i;
            ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Divine love mantras
    const loveSymbols = ['💕', '♡', '❤', '💖', '✨'];
    loveSymbols.forEach((symbol, index) => {
        const angle = (Math.PI * 2 / loveSymbols.length) * index + time * 0.01;
        const radius = 250 + Math.sin(time * 0.02 + index) * 30;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.fillStyle = 'rgba(255, 105, 180, 0.7)';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, x, y);
    });
    
    // Add new particles occasionally
    if (Math.random() < 0.02) {
        loveParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: 2 + Math.random() * 6,
            hue: 300 + Math.random() * 60,
            intensity: 0.6 + Math.random() * 0.4,
            pulsation: Math.random() * Math.PI * 2,
            life: 1
        });
    }
    
    // Remove excess particles
    if (loveParticles.length > 50) {
        loveParticles.splice(0, loveParticles.length - 50);
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};