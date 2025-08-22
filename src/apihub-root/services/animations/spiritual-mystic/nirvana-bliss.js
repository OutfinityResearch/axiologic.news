export default {
    name: "Nirvana Bliss",
    description: "The ultimate state of enlightenment and liberation from suffering",
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
let enlightenment = 0;
const blissParticles = [];
const liberationWaves = [];

// Create bliss particles
for (let i = 0; i < 50; i++) {
    blissParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        targetX: canvas.width / 2,
        targetY: canvas.height / 2,
        size: 1 + Math.random() * 3,
        hue: Math.random() * 360,
        intensity: 0.3 + Math.random() * 0.7,
        ascension: 0,
        liberated: false,
        blissLevel: Math.random()
    });
}

// Create liberation waves
for (let i = 0; i < 8; i++) {
    liberationWaves.push({
        radius: 0,
        maxRadius: 400 + i * 100,
        opacity: 0,
        frequency: 0.01 + i * 0.005,
        active: false,
        delay: i * 60
    });
}

function drawLotusFlower(centerX, centerY, size, enlightenmentLevel) {
    ctx.save();
    ctx.translate(centerX, centerY);
    
    const petals = 8;
    const petalSize = size * (0.5 + enlightenmentLevel * 0.5);
    
    // Lotus glow
    const lotusGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
    lotusGlow.addColorStop(0, \`rgba(255, 255, 255, \${enlightenmentLevel * 0.8})\`);
    lotusGlow.addColorStop(0.3, \`rgba(255, 215, 0, \${enlightenmentLevel * 0.6})\`);
    lotusGlow.addColorStop(0.7, \`rgba(238, 130, 238, \${enlightenmentLevel * 0.4})\`);
    lotusGlow.addColorStop(1, \`rgba(147, 112, 219, 0)\`);
    
    ctx.fillStyle = lotusGlow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw lotus petals
    for (let i = 0; i < petals; i++) {
        const angle = (Math.PI * 2 / petals) * i + time * 0.005;
        const petalX = Math.cos(angle) * petalSize * 0.7;
        const petalY = Math.sin(angle) * petalSize * 0.7;
        
        ctx.save();
        ctx.translate(petalX, petalY);
        ctx.rotate(angle + Math.PI / 2);
        
        // Petal gradient
        const petalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, petalSize);
        petalGradient.addColorStop(0, \`rgba(255, 255, 255, \${enlightenmentLevel})\`);
        petalGradient.addColorStop(0.5, \`rgba(255, 192, 203, \${enlightenmentLevel * 0.8})\`);
        petalGradient.addColorStop(1, \`rgba(218, 112, 214, \${enlightenmentLevel * 0.6})\`);
        
        ctx.fillStyle = petalGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, petalSize * 0.4, petalSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Petal outline
        ctx.strokeStyle = \`rgba(255, 255, 255, \${enlightenmentLevel * 0.5})\`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Lotus center
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.3);
    centerGradient.addColorStop(0, \`rgba(255, 215, 0, \${enlightenmentLevel})\`);
    centerGradient.addColorStop(0.7, \`rgba(255, 165, 0, \${enlightenmentLevel * 0.8})\`);
    centerGradient.addColorStop(1, \`rgba(255, 140, 0, \${enlightenmentLevel * 0.6})\`);
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Sacred Om symbol in center
    if (enlightenmentLevel > 0.5) {
        ctx.fillStyle = \`rgba(255, 255, 255, \${(enlightenmentLevel - 0.5) * 2})\`;
        ctx.font = \`\${size * 0.3}px serif\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ॐ', 0, 0);
    }
    
    ctx.restore();
}

function drawBlissParticle(particle) {
    const currentIntensity = particle.intensity * (1 - particle.ascension);
    
    if (currentIntensity > 0.1) {
        // Particle trail effect
        ctx.save();
        ctx.globalAlpha = currentIntensity;
        
        const particleGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 4
        );
        particleGradient.addColorStop(0, \`hsla(\${particle.hue}, 70%, 80%, 1)\`);
        particleGradient.addColorStop(0.5, \`hsla(\${particle.hue}, 60%, 70%, 0.6)\`);
        particleGradient.addColorStop(1, \`hsla(\${particle.hue}, 50%, 60%, 0)\`);
        
        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle core
        ctx.fillStyle = \`hsla(\${particle.hue}, 80%, 90%, 1)\`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

function drawLiberationWave(wave, centerX, centerY) {
    if (wave.active && wave.opacity > 0) {
        // Main wave
        ctx.strokeStyle = \`rgba(255, 255, 255, \${wave.opacity})\`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner harmonics
        for (let i = 1; i <= 3; i++) {
            ctx.strokeStyle = \`rgba(255, 215, 0, \${wave.opacity * (1 - i * 0.2)})\`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, wave.radius * (1 - i * 0.1), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

function animate() {
    // Transcendent void background
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(0.3, '#1a0066');
    gradient.addColorStop(0.7, '#0f0033');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gradually increase enlightenment
    enlightenment = Math.min(1, enlightenment + 0.002);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Update liberation waves
    liberationWaves.forEach((wave, index) => {
        if (time % 300 === wave.delay && enlightenment > 0.3) {
            wave.active = true;
            wave.radius = 0;
            wave.opacity = 0.8;
        }
        
        if (wave.active) {
            wave.radius += 2 + enlightenment * 2;
            wave.opacity *= 0.99;
            
            if (wave.radius >= wave.maxRadius) {
                wave.active = false;
            }
        }
        
        drawLiberationWave(wave, centerX, centerY);
    });
    
    // Update bliss particles
    blissParticles.forEach((particle, index) => {
        if (!particle.liberated) {
            // Gentle drift toward center
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 20) {
                particle.vx += dx * 0.0001 * enlightenment;
                particle.vy += dy * 0.0001 * enlightenment;
            }
            
            // Orbital motion around center
            if (distance < 100 + enlightenment * 200) {
                const angle = Math.atan2(dy, dx);
                particle.vx += Math.cos(angle + Math.PI / 2) * 0.001;
                particle.vy += Math.sin(angle + Math.PI / 2) * 0.001;
            }
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Friction
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            // Liberation condition
            if (enlightenment > 0.7 && distance < 50 && Math.random() < 0.01) {
                particle.liberated = true;
                particle.ascension = 0;
            }
        } else {
            // Ascension to nirvana
            particle.ascension += 0.02;
            particle.y -= 1;
            particle.size *= 1.01;
            particle.hue = (particle.hue + 2) % 360;
            
            // Reset if completely ascended
            if (particle.ascension >= 1 || particle.y < -50) {
                particle.x = Math.random() * canvas.width;
                particle.y = canvas.height + 50;
                particle.liberated = false;
                particle.ascension = 0;
                particle.size = 1 + Math.random() * 3;
                particle.intensity = 0.3 + Math.random() * 0.7;
            }
        }
        
        // Color evolution toward pure light
        if (enlightenment > 0.5) {
            const purity = (enlightenment - 0.5) * 2;
            particle.hue = particle.hue + purity * 60; // Shift toward white/gold
        }
        
        drawBlissParticle(particle);
    });
    
    // Draw the lotus of enlightenment
    const lotusSize = 80 + enlightenment * 40;
    drawLotusFlower(centerX, centerY, lotusSize, enlightenment);
    
    // Nirvana emanation
    if (enlightenment > 0.8) {
        const nirvanaIntensity = (enlightenment - 0.8) * 5;
        
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + time * 0.01;
            const rayLength = 200 + Math.sin(time * 0.02 + i) * 100;
            const startX = centerX + Math.cos(angle) * 100;
            const startY = centerY + Math.sin(angle) * 100;
            const endX = centerX + Math.cos(angle) * rayLength;
            const endY = centerY + Math.sin(angle) * rayLength;
            
            const rayGradient = ctx.createLinearGradient(startX, startY, endX, endY);
            rayGradient.addColorStop(0, \`rgba(255, 255, 255, \${nirvanaIntensity})\`);
            rayGradient.addColorStop(0.5, \`rgba(255, 215, 0, \${nirvanaIntensity * 0.6})\`);
            rayGradient.addColorStop(1, \`rgba(255, 255, 255, 0)\`);
            
            ctx.strokeStyle = rayGradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    // Sacred Buddhist symbols floating around
    if (enlightenment > 0.4) {
        const symbols = ['☸', '☯', 'ॐ', '🪷'];
        symbols.forEach((symbol, index) => {
            const angle = (Math.PI * 2 / symbols.length) * index + time * 0.008;
            const radius = 300 + Math.sin(time * 0.015 + index) * 50;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.fillStyle = \`rgba(255, 215, 0, \${(enlightenment - 0.4) * 1.67})\`;
            ctx.font = '28px serif';
            ctx.textAlign = 'center';
            ctx.fillText(symbol, x, y);
            
            // Symbol glow
            ctx.fillStyle = \`rgba(255, 255, 255, \${(enlightenment - 0.4) * 0.8})\`;
            ctx.font = 'bold 30px serif';
            ctx.fillText(symbol, x, y);
        });
    }
    
    // Liberation percentage indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText(\`Enlightenment: \${Math.floor(enlightenment * 100)}%\`, centerX, centerY + 250);
    
    // Pure consciousness field effect
    if (enlightenment > 0.9) {
        ctx.fillStyle = \`rgba(255, 255, 255, \${(enlightenment - 0.9) * 10 * 0.1})\`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};