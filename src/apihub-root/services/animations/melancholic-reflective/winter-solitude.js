export default {
    name: "Winter Solitude",
    description: "Lonely snowfall in a cold, empty winter landscape",
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

const snowflakes = [];
const trees = [];
let wind = 0;

// Create snowflakes
for (let i = 0; i < 150; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        drift: Math.random() * 0.5
    });
}

// Create bare trees
for (let i = 0; i < 5; i++) {
    trees.push({
        x: Math.random() * canvas.width,
        height: 150 + Math.random() * 100,
        sway: Math.random() * Math.PI * 2
    });
}

function drawBareTree(x, height, sway) {
    ctx.strokeStyle = 'rgba(40, 40, 50, 0.8)';
    ctx.lineWidth = 8;
    
    // Trunk
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x, canvas.height - height);
    ctx.stroke();
    
    // Branches
    const branches = [
        { h: 0.3, angle: -0.6, length: 0.3 },
        { h: 0.4, angle: 0.5, length: 0.25 },
        { h: 0.5, angle: -0.4, length: 0.35 },
        { h: 0.6, angle: 0.6, length: 0.3 },
        { h: 0.7, angle: -0.5, length: 0.25 }
    ];
    
    branches.forEach(branch => {
        const branchY = canvas.height - height * (1 - branch.h);
        const swayOffset = Math.sin(sway) * 5 * branch.h;
        const endX = x + Math.cos(branch.angle) * height * branch.length + swayOffset;
        const endY = branchY - Math.sin(Math.abs(branch.angle)) * height * branch.length * 0.5;
        
        ctx.lineWidth = 4 - branch.h * 2;
        ctx.beginPath();
        ctx.moveTo(x, branchY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Sub-branches
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const subLength = 15 + Math.random() * 10;
            const subAngle = branch.angle + (Math.random() - 0.5) * 0.5;
            const startRatio = 0.3 + i * 0.2;
            const subX = x + (endX - x) * startRatio;
            const subY = branchY + (endY - branchY) * startRatio;
            
            ctx.beginPath();
            ctx.moveTo(subX, subY);
            ctx.lineTo(
                subX + Math.cos(subAngle) * subLength,
                subY - Math.sin(Math.abs(subAngle)) * subLength
            );
            ctx.stroke();
        }
    });
}

let time = 0;

function animate() {
    // Cold winter sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(0.3, '#34495e');
    gradient.addColorStop(0.7, '#445566');
    gradient.addColorStop(1, '#556677');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground fog
    const fogGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
    fogGradient.addColorStop(0, 'rgba(200, 210, 220, 0)');
    fogGradient.addColorStop(0.5, 'rgba(200, 210, 220, 0.3)');
    fogGradient.addColorStop(1, 'rgba(200, 210, 220, 0.5)');
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Update wind
    wind = Math.sin(time * 0.001) * 0.5;
    
    // Draw trees
    trees.forEach(tree => {
        tree.sway += 0.01;
        drawBareTree(tree.x, tree.height, tree.sway);
    });
    
    // Draw and update snowflakes
    ctx.fillStyle = 'rgba(240, 248, 255, 0.8)';
    snowflakes.forEach(flake => {
        flake.y += flake.speed;
        flake.x += wind + Math.sin(flake.y * 0.01) * flake.drift;
        
        if (flake.y > canvas.height) {
            flake.y = -10;
            flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;
        
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Add loneliness vignette
    const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};