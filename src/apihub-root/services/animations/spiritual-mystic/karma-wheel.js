export default {
    name: "Karma Wheel",
    description: "The eternal wheel of karma turning with cosmic justice and divine balance",
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
let wheelRotation = 0;
const karmaParticles = [];

// Create karma particles
for (let i = 0; i < 30; i++) {
    karmaParticles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 50 + Math.random() * 200,
        speed: 0.005 + Math.random() * 0.01,
        size: 2 + Math.random() * 4,
        hue: Math.random() * 60 + 30, // Golden hues
        intensity: 0.5 + Math.random() * 0.5,
        type: Math.random() > 0.5 ? 'positive' : 'negative',
        orbitSpeed: 0.02 + Math.random() * 0.02
    });
}

function drawKarmaWheel(centerX, centerY, radius) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(wheelRotation);
    
    // Wheel outer glow
    const wheelGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
    wheelGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    wheelGlow.addColorStop(0.5, 'rgba(218, 165, 32, 0.2)');
    wheelGlow.addColorStop(1, 'rgba(184, 134, 11, 0)');
    ctx.fillStyle = wheelGlow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Main wheel rim
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner rim
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Spokes of karma (8 spokes for the Eightfold Path)
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const innerRadius = radius * 0.2;
        const outerRadius = radius * 0.9;
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
        ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
        ctx.stroke();
        
        // Spoke decorations
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.7, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Central hub with yin-yang symbol
    const hubGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.3);
    hubGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    hubGradient.addColorStop(0.5, 'rgba(240, 240, 240, 0.8)');
    hubGradient.addColorStop(1, 'rgba(200, 200, 200, 0.6)');
    ctx.fillStyle = hubGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Yin-yang symbol
    const yinYangRadius = radius * 0.2;
    
    // Yang (white) side
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, yinYangRadius, 0, Math.PI, false);
    ctx.arc(0, -yinYangRadius/2, yinYangRadius/2, 0, Math.PI * 2, false);
    ctx.arc(0, yinYangRadius/2, yinYangRadius/2, 0, Math.PI * 2, true);
    ctx.fill();
    
    // Yin (black) side
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, yinYangRadius, 0, Math.PI, true);
    ctx.fill();
    
    // Small circles
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(0, -yinYangRadius/2, yinYangRadius/6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, yinYangRadius/2, yinYangRadius/6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawKarmaParticle(particle, centerX, centerY) {
    const x = centerX + Math.cos(particle.angle) * particle.radius;
    const y = centerY + Math.sin(particle.angle) * particle.radius;
    
    const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 3);
    
    if (particle.type === 'positive') {
        particleGradient.addColorStop(0, \`hsla(\${particle.hue}, 80%, 70%, \${particle.intensity})\`);
        particleGradient.addColorStop(0.5, \`hsla(\${particle.hue}, 70%, 60%, \${particle.intensity * 0.6})\`);
        particleGradient.addColorStop(1, \`hsla(\${particle.hue}, 60%, 50%, 0)\`);
    } else {
        particleGradient.addColorStop(0, \`rgba(139, 0, 0, \${particle.intensity})\`);
        particleGradient.addColorStop(0.5, \`rgba(100, 0, 0, \${particle.intensity * 0.6})\`);
        particleGradient.addColorStop(1, \`rgba(60, 0, 0, 0)\`);
    }
    
    ctx.fillStyle = particleGradient;
    ctx.beginPath();
    ctx.arc(x, y, particle.size * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Particle core
    ctx.fillStyle = particle.type === 'positive' ? 
        \`hsla(\${particle.hue}, 90%, 80%, \${particle.intensity})\` : 
        \`rgba(200, 50, 50, \${particle.intensity})\`;
    ctx.beginPath();
    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
    ctx.fill();
}

function animate() {
    // Deep spiritual background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a40');
    gradient.addColorStop(0.5, '#2d1b69');
    gradient.addColorStop(1, '#1a1a40');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Rotate the wheel slowly
    wheelRotation += 0.008;
    
    // Update karma particles
    karmaParticles.forEach(particle => {
        particle.angle += particle.speed;
        particle.orbitSpeed += 0.001;
        
        // Particles slowly spiral inward or outward based on karma type
        if (particle.type === 'positive') {
            particle.radius = Math.max(50, particle.radius - 0.2);
            if (particle.radius <= 50) {
                particle.radius = 250;
                particle.angle = Math.random() * Math.PI * 2;
            }
        } else {
            particle.radius = Math.min(250, particle.radius + 0.15);
            if (particle.radius >= 250) {
                particle.radius = 50;
                particle.angle = Math.random() * Math.PI * 2;
            }
        }
        
        // Intensity pulsation
        particle.intensity = 0.5 + Math.sin(time * 0.02 + particle.angle) * 0.3;
        
        drawKarmaParticle(particle, centerX, centerY);
    });
    
    // Draw the main karma wheel
    drawKarmaWheel(centerX, centerY, 120);
    
    // Draw cosmic energy rings
    for (let i = 0; i < 3; i++) {
        const ringRadius = 200 + i * 50;
        const ringOpacity = 0.2 - i * 0.05;
        const ringRotation = time * (0.005 + i * 0.002);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ringRotation);
        
        ctx.strokeStyle = \`rgba(255, 215, 0, \${ringOpacity})\`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 20]);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
    
    // Sacred mantras floating around
    const mantras = ['ॐ', 'कर्म', '☸', '☯'];
    mantras.forEach((mantra, index) => {
        const angle = (Math.PI * 2 / mantras.length) * index + time * 0.01;
        const radius = 300 + Math.sin(time * 0.02 + index) * 30;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.fillText(mantra, x, y);
        
        // Mantra glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 22px serif';
        ctx.fillText(mantra, x, y);
    });
    
    // Balance indicator - shows cosmic equilibrium
    const balance = (karmaParticles.filter(p => p.type === 'positive').length - 
                    karmaParticles.filter(p => p.type === 'negative').length) / karmaParticles.length;
    
    ctx.fillStyle = \`rgba(255, 215, 0, 0.7)\`;
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cosmic Balance', centerX, centerY + 200);
    
    // Balance meter
    const meterWidth = 200;
    const meterHeight = 10;
    const meterX = centerX - meterWidth / 2;
    const meterY = centerY + 220;
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    const balancePos = (balance + 1) / 2; // Normalize to 0-1
    ctx.fillStyle = balance > 0 ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
    ctx.fillRect(meterX, meterY, meterWidth * balancePos, meterHeight);
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};