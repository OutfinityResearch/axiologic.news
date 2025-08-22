export default {
    name: "Butterfly Dance",
    description: "Colorful butterflies dancing in a garden of joy and freedom",
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

const butterflies = [];
const flowers = [];
let time = 0;

// Create butterflies
for (let i = 0; i < 8; i++) {
    butterflies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0.8 + Math.random() * 0.6,
        wingPhase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1,
        direction: Math.random() * Math.PI * 2,
        directionChange: 0,
        colors: {
            primary: [Math.random() * 100 + 155, Math.random() * 100 + 155, Math.random() * 100 + 155],
            secondary: [Math.random() * 150 + 100, Math.random() * 150 + 100, Math.random() * 150 + 100]
        },
        trail: []
    });
}

// Create flowers
for (let i = 0; i < 15; i++) {
    flowers.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.6 + Math.random() * canvas.height * 0.4,
        size: 8 + Math.random() * 12,
        color: [Math.random() * 100 + 155, Math.random() * 100 + 155, Math.random() * 100 + 155],
        sway: Math.random() * Math.PI * 2,
        petals: 5 + Math.floor(Math.random() * 3)
    });
}

function drawButterfly(butterfly) {
    ctx.save();
    ctx.translate(butterfly.x, butterfly.y);
    ctx.rotate(butterfly.direction);
    ctx.scale(butterfly.size, butterfly.size);
    
    const wingFlap = Math.sin(butterfly.wingPhase) * 0.3;
    
    // Butterfly body
    ctx.fillStyle = 'rgba(80, 50, 30, 0.8)';
    ctx.fillRect(-1, -15, 2, 30);
    
    // Antennae
    ctx.strokeStyle = 'rgba(80, 50, 30, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-3, -20);
    ctx.moveTo(0, -15);
    ctx.lineTo(3, -20);
    ctx.stroke();
    
    // Upper wings
    ctx.save();
    ctx.rotate(wingFlap);
    
    // Upper left wing
    const upperGradient = ctx.createRadialGradient(-5, -8, 0, -12, -12, 12);
    upperGradient.addColorStop(0, \`rgba(\${butterfly.colors.primary[0]}, \${butterfly.colors.primary[1]}, \${butterfly.colors.primary[2]}, 0.9)\`);
    upperGradient.addColorStop(0.7, \`rgba(\${butterfly.colors.secondary[0]}, \${butterfly.colors.secondary[1]}, \${butterfly.colors.secondary[2]}, 0.7)\`);
    upperGradient.addColorStop(1, \`rgba(\${butterfly.colors.primary[0]}, \${butterfly.colors.primary[1]}, \${butterfly.colors.primary[2]}, 0.3)\`);
    
    ctx.fillStyle = upperGradient;
    ctx.beginPath();
    ctx.ellipse(-10, -8, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Upper right wing
    ctx.scale(-1, 1);
    ctx.fill();
    ctx.scale(-1, 1);
    
    ctx.restore();
    
    // Lower wings
    ctx.save();
    ctx.rotate(-wingFlap * 0.7);
    
    // Lower left wing
    const lowerGradient = ctx.createRadialGradient(-3, 3, 0, -8, 8, 8);
    lowerGradient.addColorStop(0, \`rgba(\${butterfly.colors.secondary[0]}, \${butterfly.colors.secondary[1]}, \${butterfly.colors.secondary[2]}, 0.8)\`);
    lowerGradient.addColorStop(1, \`rgba(\${butterfly.colors.primary[0]}, \${butterfly.colors.primary[1]}, \${butterfly.colors.primary[2]}, 0.4)\`);
    
    ctx.fillStyle = lowerGradient;
    ctx.beginPath();
    ctx.ellipse(-6, 5, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Lower right wing
    ctx.scale(-1, 1);
    ctx.fill();
    
    ctx.restore();
    
    // Wing patterns
    ctx.fillStyle = \`rgba(\${255 - butterfly.colors.primary[0]}, \${255 - butterfly.colors.primary[1]}, \${255 - butterfly.colors.primary[2]}, 0.4)\`;
    ctx.beginPath();
    ctx.arc(-8, -8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawFlower(flower) {
    ctx.save();
    ctx.translate(flower.x, flower.y);
    
    // Stem
    ctx.strokeStyle = 'rgba(80, 150, 80, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(flower.sway) * 5, 30);
    ctx.stroke();
    
    // Petals
    const angleStep = (Math.PI * 2) / flower.petals;
    for (let i = 0; i < flower.petals; i++) {
        const angle = angleStep * i;
        const petalX = Math.cos(angle) * flower.size * 0.7;
        const petalY = Math.sin(angle) * flower.size * 0.7;
        
        const petalGradient = ctx.createRadialGradient(petalX, petalY, 0, petalX, petalY, flower.size * 0.5);
        petalGradient.addColorStop(0, \`rgba(\${flower.color[0]}, \${flower.color[1]}, \${flower.color[2]}, 0.9)\`);
        petalGradient.addColorStop(1, \`rgba(\${flower.color[0] - 30}, \${flower.color[1] - 30}, \${flower.color[2] - 30}, 0.6)\`);
        
        ctx.fillStyle = petalGradient;
        ctx.beginPath();
        ctx.ellipse(petalX, petalY, flower.size * 0.3, flower.size * 0.5, angle, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Flower center
    ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, flower.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function animate() {
    // Bright sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#98FB98');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grass ground
    const grassGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
    grassGradient.addColorStop(0, 'rgba(144, 238, 144, 0.8)');
    grassGradient.addColorStop(1, 'rgba(34, 139, 34, 0.9)');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
    
    // Draw flowers
    flowers.forEach(flower => {
        flower.sway += 0.02;
        drawFlower(flower);
    });
    
    // Update and draw butterflies
    butterflies.forEach(butterfly => {
        // Wing flapping
        butterfly.wingPhase += 0.2;
        
        // Movement pattern - figure-8 like flight
        butterfly.directionChange += 0.05;
        butterfly.direction += Math.sin(butterfly.directionChange) * 0.1;
        
        butterfly.x += Math.cos(butterfly.direction) * butterfly.speed;
        butterfly.y += Math.sin(butterfly.direction) * butterfly.speed * 0.5;
        
        // Gentle floating motion
        butterfly.y += Math.sin(time * 0.01 + butterfly.x * 0.01) * 0.3;
        
        // Boundary behavior - gentle turn when reaching edges
        if (butterfly.x < 0 || butterfly.x > canvas.width) {
            butterfly.direction = Math.PI - butterfly.direction;
        }
        if (butterfly.y < 0 || butterfly.y > canvas.height * 0.8) {
            butterfly.direction = -butterfly.direction;
        }
        
        // Keep within bounds
        butterfly.x = Math.max(0, Math.min(canvas.width, butterfly.x));
        butterfly.y = Math.max(0, Math.min(canvas.height * 0.8, butterfly.y));
        
        // Add to trail
        butterfly.trail.push({ x: butterfly.x, y: butterfly.y, opacity: 0.5 });
        if (butterfly.trail.length > 20) {
            butterfly.trail.shift();
        }
        
        // Draw butterfly trail
        butterfly.trail.forEach((point, index) => {
            point.opacity *= 0.95;
            if (point.opacity > 0.05) {
                ctx.fillStyle = \`rgba(\${butterfly.colors.primary[0]}, \${butterfly.colors.primary[1]}, \${butterfly.colors.primary[2]}, \${point.opacity})\`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        drawButterfly(butterfly);
    });
    
    // Add sparkling particles of joy
    for (let i = 0; i < 15; i++) {
        const sparkX = (time * 0.5 + i * 50) % (canvas.width + 100);
        const sparkY = canvas.height * 0.2 + Math.sin(time * 0.02 + i) * 100;
        const sparkSize = 1 + Math.sin(time * 0.03 + i) * 0.5;
        const hue = (time * 2 + i * 24) % 360;
        
        ctx.fillStyle = \`hsla(\${hue}, 80%, 70%, 0.6)\`;
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};