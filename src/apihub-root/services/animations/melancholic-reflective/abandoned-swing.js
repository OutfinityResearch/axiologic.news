export default {
    name: "Abandoned Swing",
    description: "An empty swing moving gently in the wind, carrying memories of childhood",
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
let swingAngle = 0;
let windStrength = 0;

const leaves = [];
for (let i = 0; i < 12; i++) {
    leaves.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.3,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        fallSpeed: 0.3 + Math.random() * 0.5,
        sway: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? [210, 180, 140] : [160, 140, 100]
    });
}

function drawTree(x, y) {
    // Tree trunk
    ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
    ctx.fillRect(x - 15, y, 30, -120);
    
    // Tree texture
    ctx.strokeStyle = 'rgba(80, 50, 20, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 20 - i * 20);
        ctx.lineTo(x + 10, y - 30 - i * 20);
        ctx.stroke();
    }
    
    // Branch for swing
    ctx.strokeStyle = 'rgba(101, 67, 33, 0.8)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x, y - 120);
    ctx.lineTo(x + 80, y - 100);
    ctx.stroke();
}

function drawSwing(treeX, treeY, angle) {
    const branchX = treeX + 80;
    const branchY = treeY - 100;
    const ropeLength = 100;
    
    // Calculate swing position
    const swingX = branchX + Math.sin(angle) * ropeLength;
    const swingY = branchY + Math.cos(angle) * ropeLength;
    
    // Draw ropes
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.8)';
    ctx.lineWidth = 4;
    
    // Left rope
    ctx.beginPath();
    ctx.moveTo(branchX - 10, branchY);
    ctx.lineTo(swingX - 15, swingY);
    ctx.stroke();
    
    // Right rope
    ctx.beginPath();
    ctx.moveTo(branchX + 10, branchY);
    ctx.lineTo(swingX + 15, swingY);
    ctx.stroke();
    
    // Swing seat
    ctx.fillStyle = 'rgba(101, 67, 33, 0.9)';
    ctx.fillRect(swingX - 25, swingY - 5, 50, 10);
    
    // Swing seat edges
    ctx.strokeStyle = 'rgba(80, 50, 20, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(swingX - 25, swingY - 5, 50, 10);
    
    // Add rope wear marks
    ctx.fillStyle = 'rgba(160, 140, 120, 0.6)';
    ctx.fillRect(swingX - 18, swingY - 3, 4, 6);
    ctx.fillRect(swingX + 14, swingY - 3, 4, 6);
}

function animate() {
    // Overcast sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#95a5a6');
    gradient.addColorStop(0.4, '#7f8c8d');
    gradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    const groundGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
    groundGradient.addColorStop(0, 'rgba(139, 115, 85, 0.6)');
    groundGradient.addColorStop(1, 'rgba(101, 67, 33, 0.8)');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Update wind
    windStrength = Math.sin(time * 0.005) * 0.3 + Math.sin(time * 0.002) * 0.1;
    swingAngle = Math.sin(time * 0.008) * 0.2 + windStrength;
    
    // Draw tree and swing
    const treeX = canvas.width * 0.3;
    const treeY = canvas.height - 100;
    
    drawTree(treeX, treeY);
    drawSwing(treeX, treeY, swingAngle);
    
    // Update and draw falling leaves
    leaves.forEach(leaf => {
        leaf.y += leaf.fallSpeed;
        leaf.x += Math.sin(leaf.sway) * 0.5 + windStrength * 2;
        leaf.rotation += 0.02;
        leaf.sway += 0.03;
        
        if (leaf.y > canvas.height) {
            leaf.y = -10;
            leaf.x = Math.random() * canvas.width;
        }
        
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);
        
        ctx.fillStyle = \`rgba(\${leaf.color[0]}, \${leaf.color[1]}, \${leaf.color[2]}, 0.7)\`;
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
    
    // Memory ghosts - faint silhouettes of children who once played
    const ghostOpacity = Math.sin(time * 0.003) * 0.08 + 0.05;
    if (ghostOpacity > 0.08) {
        ctx.fillStyle = \`rgba(200, 200, 220, \${ghostOpacity})\`;
        // Small ghost figure on swing
        const ghostX = treeX + 80 + Math.sin(swingAngle - Math.PI * 0.1) * 100;
        const ghostY = treeY - 100 + Math.cos(swingAngle - Math.PI * 0.1) * 100;
        
        ctx.beginPath();
        ctx.ellipse(ghostX, ghostY - 20, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillRect(ghostX - 6, ghostY - 10, 12, 15);
    }
    
    // Mood lighting - soft, melancholic rays
    ctx.strokeStyle = 'rgba(255, 248, 220, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) + i * 0.1;
        const startX = canvas.width * 0.8;
        const startY = canvas.height * 0.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.cos(angle) * 200, startY + Math.sin(angle) * 200);
        ctx.stroke();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};