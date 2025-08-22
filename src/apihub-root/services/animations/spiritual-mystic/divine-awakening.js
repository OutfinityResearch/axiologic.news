export default {
    name: "Divine Awakening",
    description: "The moment of spiritual awakening with expanding consciousness and divine light",
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
let awakening = 0;
const lightRays = [];

// Create divine light rays
for (let i = 0; i < 12; i++) {
    lightRays.push({
        angle: (Math.PI * 2 / 12) * i,
        length: 0,
        maxLength: 300 + Math.random() * 200,
        speed: 2 + Math.random() * 3,
        intensity: 0.5 + Math.random() * 0.5,
        pulsation: Math.random() * Math.PI * 2
    });
}

function drawThirdEye(x, y, size, intensity) {
    ctx.save();
    ctx.translate(x, y);
    
    // Third eye glow
    const eyeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
    eyeGradient.addColorStop(0, \`rgba(138, 43, 226, \${intensity * 0.8})\`);
    eyeGradient.addColorStop(0.5, \`rgba(75, 0, 130, \${intensity * 0.5})\`);
    eyeGradient.addColorStop(1, \`rgba(25, 25, 112, \${intensity * 0.2})\`);
    
    ctx.fillStyle = eyeGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye outline
    ctx.strokeStyle = \`rgba(138, 43, 226, \${intensity})\`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Pupil
    ctx.fillStyle = \`rgba(25, 25, 112, \${intensity})\`;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner light
    ctx.fillStyle = \`rgba(255, 255, 255, \${intensity * 0.8})\`;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyelashes/decoration
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const x1 = Math.cos(angle) * size * 1.2;
        const y1 = Math.sin(angle) * size * 0.7;
        const x2 = Math.cos(angle) * size * 1.8;
        const y2 = Math.sin(angle) * size * 1.1;
        
        ctx.strokeStyle = \`rgba(138, 43, 226, \${intensity * 0.6})\`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawExpandingConsciousness(centerX, centerY, radius, intensity) {
    // Consciousness rings
    for (let i = 0; i < 5; i++) {
        const ringRadius = radius * (i + 1) * 0.8;
        const ringOpacity = intensity * (1 - i * 0.15);
        
        if (ringOpacity > 0) {
            ctx.strokeStyle = \`rgba(255, 215, 0, \${ringOpacity})\`;
            ctx.lineWidth = 3 - i * 0.5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Sacred geometry patterns
            ctx.strokeStyle = \`rgba(255, 255, 255, \${ringOpacity * 0.5})\`;
            ctx.lineWidth = 1;
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI * 2 / 6) * j;
                const x1 = centerX + Math.cos(angle) * ringRadius;
                const y1 = centerY + Math.sin(angle) * ringRadius;
                
                ctx.beginPath();
                ctx.arc(x1, y1, ringRadius * 0.1, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    // Deep cosmic background
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#000051');
    gradient.addColorStop(0.5, '#1a0033');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Progressive awakening
    awakening = Math.min(1, awakening + 0.003);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw expanding consciousness
    drawExpandingConsciousness(centerX, centerY, 50 + awakening * 150, awakening);
    
    // Update and draw light rays
    lightRays.forEach(ray => {
        ray.pulsation += 0.05;
        ray.length = Math.min(ray.maxLength, ray.length + ray.speed * awakening);
        
        const pulsationIntensity = Math.sin(ray.pulsation) * 0.3 + 0.7;
        const currentIntensity = ray.intensity * awakening * pulsationIntensity;
        
        if (currentIntensity > 0.1) {
            const endX = centerX + Math.cos(ray.angle) * ray.length;
            const endY = centerY + Math.sin(ray.angle) * ray.length;
            
            // Ray gradient
            const rayGradient = ctx.createLinearGradient(centerX, centerY, endX, endY);
            rayGradient.addColorStop(0, \`rgba(255, 215, 0, \${currentIntensity})\`);
            rayGradient.addColorStop(0.5, \`rgba(255, 255, 255, \${currentIntensity * 0.8})\`);
            rayGradient.addColorStop(1, \`rgba(255, 215, 0, 0)\`);
            
            ctx.strokeStyle = rayGradient;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Ray glow
            ctx.strokeStyle = \`rgba(255, 255, 255, \${currentIntensity * 0.3})\`;
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    });
    
    // Central divine light
    const centralGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80 * awakening);
    centralGradient.addColorStop(0, \`rgba(255, 255, 255, \${awakening})\`);
    centralGradient.addColorStop(0.3, \`rgba(255, 215, 0, \${awakening * 0.8})\`);
    centralGradient.addColorStop(0.7, \`rgba(138, 43, 226, \${awakening * 0.6})\`);
    centralGradient.addColorStop(1, \`rgba(75, 0, 130, 0)\`);
    
    ctx.fillStyle = centralGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80 * awakening, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw third eye
    const eyeY = centerY - 60;
    const eyeIntensity = Math.max(0, awakening - 0.3);
    if (eyeIntensity > 0) {
        drawThirdEye(centerX, eyeY, 30, eyeIntensity);
    }
    
    // Floating divine symbols
    if (awakening > 0.5) {
        const symbols = ['ॐ', '☸', '✡', '☩', '☪'];
        symbols.forEach((symbol, index) => {
            const angle = (Math.PI * 2 / symbols.length) * index + time * 0.01;
            const radius = 200 + Math.sin(time * 0.02 + index) * 50;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.6;
            
            ctx.fillStyle = \`rgba(255, 215, 0, \${(awakening - 0.5) * 2})\`;
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.fillText(symbol, x, y);
            
            // Symbol glow
            ctx.fillStyle = \`rgba(255, 255, 255, \${(awakening - 0.5) * 0.5})\`;
            ctx.font = 'bold 26px serif';
            ctx.fillText(symbol, x, y);
        });
    }
    
    // Ascending light particles
    for (let i = 0; i < 20; i++) {
        const particleX = centerX + (Math.random() - 0.5) * 400 * awakening;
        const particleY = centerY + 200 - (time * 2 + i * 50) % 600;
        const particleSize = 1 + Math.random() * 3;
        const particleOpacity = Math.random() * awakening;
        
        if (particleOpacity > 0.1) {
            ctx.fillStyle = \`rgba(255, 215, 0, \${particleOpacity})\`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};