export default {
    name: "Floating Garden",
    description: "A magical garden of floating flowers and swirling petals in the breeze",
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

const flowers = [];
const petals = [];
let time = 0;

// Create floating flowers
for (let i = 0; i < 12; i++) {
    flowers.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 15 + Math.random() * 25,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        rotation: Math.random() * Math.PI * 2,
        float: Math.random() * Math.PI * 2,
        floatSpeed: 0.01 + Math.random() * 0.02,
        petals: 5 + Math.floor(Math.random() * 3),
        hue: Math.random() * 360,
        drift: {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.2
        }
    });
}

// Create floating petals
for (let i = 0; i < 30; i++) {
    petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 3 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        hue: Math.random() * 360,
        opacity: 0.6 + Math.random() * 0.4,
        flutter: Math.random() * Math.PI * 2
    });
}

function drawFlower(flower) {
    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.rotate(flower.rotation);
    
    // Flower glow
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, flower.size * 2);
    glowGradient.addColorStop(0, \`hsla(\${flower.hue}, 80%, 70%, 0.3)\`);
    glowGradient.addColorStop(1, \`hsla(\${flower.hue}, 60%, 50%, 0)\`);
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, flower.size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw petals
    for (let i = 0; i < flower.petals; i++) {
        const angle = (Math.PI * 2 / flower.petals) * i;
        const petalX = Math.cos(angle) * flower.size * 0.7;
        const petalY = Math.sin(angle) * flower.size * 0.7;
        
        ctx.save();
        ctx.translate(petalX, petalY);
        ctx.rotate(angle + Math.PI / 2);
        
        // Petal gradient
        const petalGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, flower.size * 0.5);
        petalGradient.addColorStop(0, \`hsla(\${flower.hue}, 90%, 80%, 0.9)\`);
        petalGradient.addColorStop(0.7, \`hsla(\${flower.hue + 20}, 80%, 70%, 0.7)\`);
        petalGradient.addColorStop(1, \`hsla(\${flower.hue - 20}, 70%, 60%, 0.5)\`);
        
        ctx.fillStyle = petalGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, flower.size * 0.3, flower.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Petal highlight
        ctx.fillStyle = \`hsla(\${flower.hue + 40}, 70%, 90%, 0.5)\`;
        ctx.beginPath();
        ctx.ellipse(-flower.size * 0.1, -flower.size * 0.2, flower.size * 0.1, flower.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Flower center
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, flower.size * 0.3);
    centerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
    centerGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.8)');
    centerGradient.addColorStop(1, 'rgba(218, 165, 32, 0.6)');
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, flower.size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Center sparkle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-flower.size * 0.08, -flower.size * 0.08, flower.size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawPetal(petal) {
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.rotation);
    ctx.scale(1, 0.6); // Make petals elliptical
    
    // Petal shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(1, 1, petal.size, petal.size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main petal
    const petalGradient = ctx.createRadialGradient(
        -petal.size * 0.3, -petal.size * 0.3, 0,
        0, 0, petal.size
    );
    petalGradient.addColorStop(0, \`hsla(\${petal.hue}, 80%, 80%, \${petal.opacity})\`);
    petalGradient.addColorStop(0.7, \`hsla(\${petal.hue + 20}, 70%, 60%, \${petal.opacity * 0.8})\`);
    petalGradient.addColorStop(1, \`hsla(\${petal.hue - 20}, 60%, 40%, \${petal.opacity * 0.5})\`);
    
    ctx.fillStyle = petalGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, petal.size, petal.size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Petal highlight
    ctx.fillStyle = \`rgba(255, 255, 255, \${petal.opacity * 0.4})\`;
    ctx.beginPath();
    ctx.ellipse(-petal.size * 0.4, -petal.size * 0.3, petal.size * 0.3, petal.size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function animate() {
    // Sky gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#98FB98');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add gentle wind effect with floating sparkles
    for (let i = 0; i < 25; i++) {
        const sparkX = (time * 0.3 + i * 40) % (canvas.width + 80) - 40;
        const sparkY = canvas.height * 0.2 + Math.sin(time * 0.015 + i * 0.3) * 150;
        const sparkSize = 1 + Math.sin(time * 0.03 + i) * 0.5;
        const sparkHue = (time * 1.5 + i * 15) % 360;
        
        ctx.fillStyle = \`hsla(\${sparkHue}, 70%, 80%, 0.4)\`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Update and draw flowers
    flowers.forEach(flower => {
        flower.float += flower.floatSpeed;
        flower.rotation += flower.rotationSpeed;
        
        // Gentle floating motion
        flower.x += flower.drift.x + Math.sin(flower.float) * 0.5;
        flower.y += flower.drift.y + Math.cos(flower.float * 0.8) * 0.3;
        
        // Color cycling for magical effect
        flower.hue = (flower.hue + 0.2) % 360;
        
        // Keep flowers on screen
        if (flower.x < -flower.size) flower.x = canvas.width + flower.size;
        if (flower.x > canvas.width + flower.size) flower.x = -flower.size;
        if (flower.y < -flower.size) flower.y = canvas.height + flower.size;
        if (flower.y > canvas.height + flower.size) flower.y = -flower.size;
        
        drawFlower(flower);
    });
    
    // Update and draw petals
    petals.forEach(petal => {
        petal.x += petal.vx;
        petal.y += petal.vy;
        petal.rotation += petal.rotationSpeed;
        petal.flutter += 0.02;
        
        // Add flutter motion
        petal.x += Math.sin(petal.flutter) * 0.2;
        petal.y += Math.cos(petal.flutter * 1.3) * 0.15;
        
        // Gentle wind drift
        petal.vx += Math.sin(time * 0.01) * 0.002;
        petal.vy += Math.cos(time * 0.008) * 0.001;
        
        // Color shifting
        petal.hue = (petal.hue + 0.5) % 360;
        
        // Wrap around screen
        if (petal.x > canvas.width + petal.size) petal.x = -petal.size;
        if (petal.x < -petal.size) petal.x = canvas.width + petal.size;
        if (petal.y > canvas.height + petal.size) petal.y = -petal.size;
        if (petal.y < -petal.size) petal.y = canvas.height + petal.size;
        
        drawPetal(petal);
    });
    
    // Add occasional magical burst
    if (time % 200 === 0) {
        const burstX = Math.random() * canvas.width;
        const burstY = Math.random() * canvas.height;
        
        for (let i = 0; i < 8; i++) {
            petals.push({
                x: burstX,
                y: burstY,
                size: 5 + Math.random() * 10,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                vx: Math.cos(i * Math.PI / 4) * (1 + Math.random()),
                vy: Math.sin(i * Math.PI / 4) * (1 + Math.random()),
                hue: Math.random() * 360,
                opacity: 0.8,
                flutter: Math.random() * Math.PI * 2
            });
        }
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};