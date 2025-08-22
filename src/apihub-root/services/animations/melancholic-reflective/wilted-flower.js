export default {
    name: "Wilted Flower",
    description: "A once-beautiful flower slowly wilting, petals falling like tears",
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

const fallenPetals = [];
const numPetals = 8;
let flowerDroop = 0;
let time = 0;

// Create fallen petals
for (let i = 0; i < 15; i++) {
    fallenPetals.push({
        x: Math.random() * canvas.width,
        y: canvas.height - Math.random() * 100,
        rotation: Math.random() * Math.PI * 2,
        size: 0.5 + Math.random() * 0.3,
        opacity: 0.2 + Math.random() * 0.3,
        sway: Math.random() * Math.PI * 2
    });
}

function drawPetal(x, y, size, rotation, opacity, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(size, size);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
    gradient.addColorStop(0, \`rgba(\${color[0]}, \${color[1]}, \${color[2]}, \${opacity})\`);
    gradient.addColorStop(0.7, \`rgba(\${color[0] - 20}, \${color[1] - 20}, \${color[2] - 20}, \${opacity * 0.7})\`);
    gradient.addColorStop(1, \`rgba(\${color[0] - 40}, \${color[1] - 40}, \${color[2] - 40}, \${opacity * 0.3})\`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    // Petal shape
    ctx.moveTo(0, -15);
    ctx.bezierCurveTo(-8, -10, -10, 0, -5, 8);
    ctx.bezierCurveTo(0, 10, 5, 8, 10, 0);
    ctx.bezierCurveTo(8, -10, 0, -15, 0, -15);
    ctx.fill();
    
    ctx.restore();
}

function drawStem(startX, startY, endX, endY, droop) {
    ctx.strokeStyle = 'rgba(60, 80, 40, 0.8)';
    ctx.lineWidth = 6;
    
    // Calculate drooping curve
    const midX = (startX + endX) / 2 + droop;
    const midY = (startY + endY) / 2 + droop * 0.5;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();
    
    // Add thorns
    for (let i = 0; i < 3; i++) {
        const t = 0.3 + i * 0.2;
        const x = startX + (endX - startX) * t + droop * t;
        const y = startY + (endY - startY) * t + droop * 0.5 * t;
        
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y - 8);
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function animate() {
    // Melancholic background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2c2c54');
    gradient.addColorStop(0.5, '#40407a');
    gradient.addColorStop(1, '#706fd3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Slowly increase droop over time
    flowerDroop = Math.min(50, time * 0.01);
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.4;
    
    // Draw stem
    drawStem(centerX, centerY, centerX, canvas.height, flowerDroop);
    
    // Draw flower center
    ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw remaining petals (some have fallen)
    const remainingPetals = Math.max(3, numPetals - Math.floor(time * 0.002));
    for (let i = 0; i < remainingPetals; i++) {
        const angle = (Math.PI * 2 / numPetals) * i;
        const petalX = centerX + Math.cos(angle) * (20 - flowerDroop * 0.2);
        const petalY = centerY + Math.sin(angle) * (15 - flowerDroop * 0.3);
        
        // Petals become more brown/wilted over time
        const freshness = Math.max(0, 1 - time * 0.001);
        const red = 255 * freshness + 139 * (1 - freshness);
        const green = 182 * freshness + 69 * (1 - freshness);
        const blue = 193 * freshness + 19 * (1 - freshness);
        
        const petalOpacity = 0.7 + Math.sin(time * 0.01 + i) * 0.1;
        drawPetal(petalX, petalY, 1, angle, petalOpacity, [red, green, blue]);
    }
    
    // Animate falling petals
    if (time % 300 === 0 && remainingPetals < numPetals) {
        fallenPetals.push({
            x: centerX + (Math.random() - 0.5) * 40,
            y: centerY,
            rotation: Math.random() * Math.PI * 2,
            size: 0.8 + Math.random() * 0.4,
            opacity: 0.6,
            sway: Math.random() * Math.PI * 2,
            fallSpeed: 0.5 + Math.random() * 0.3,
            driftSpeed: (Math.random() - 0.5) * 0.2
        });
    }
    
    // Update and draw fallen petals
    fallenPetals.forEach((petal, index) => {
        if (petal.fallSpeed) {
            petal.y += petal.fallSpeed;
            petal.x += petal.driftSpeed;
            petal.rotation += 0.01;
            petal.sway += 0.02;
            petal.x += Math.sin(petal.sway) * 0.3;
            
            if (petal.y > canvas.height - 50) {
                petal.fallSpeed = 0;
                petal.y = canvas.height - 50;
                petal.opacity *= 0.99; // Gradually fade
            }
        }
        
        if (petal.opacity > 0.05) {
            const brown = [139, 69, 19];
            drawPetal(petal.x, petal.y, petal.size, petal.rotation, petal.opacity, brown);
        }
    });
    
    // Add soft rain effect
    ctx.strokeStyle = 'rgba(200, 220, 240, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        const x = (time * 2 + i * 50) % (canvas.width + 100);
        const y1 = -10;
        const y2 = canvas.height;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x - 20, y2);
        ctx.stroke();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};