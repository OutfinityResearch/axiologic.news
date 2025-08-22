export default {
    name: "Sacred Geometry",
    description: "Rotating sacred geometric patterns with mystical energy",
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

let rotation = 0;
let pulsePhase = 0;

function drawFlowerOfLife(x, y, radius, rotation, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = \`rgba(147, 112, 219, \${opacity})\`;
    ctx.lineWidth = 2;
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw 6 surrounding circles
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const cx = Math.cos(angle) * radius;
        const cy = Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawMerkaba(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.6)';
    ctx.lineWidth = 1.5;
    
    // Draw upward triangle
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw downward triangle
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i + Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
}

function animate() {
    ctx.fillStyle = 'rgba(25, 0, 51, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw multiple layers of sacred geometry
    const pulse = Math.sin(pulsePhase) * 0.3 + 0.7;
    
    // Flower of Life patterns
    drawFlowerOfLife(centerX, centerY, 60 * pulse, rotation, 0.8);
    drawFlowerOfLife(centerX, centerY, 100 * pulse, -rotation * 0.7, 0.5);
    drawFlowerOfLife(centerX, centerY, 140 * pulse, rotation * 0.5, 0.3);
    
    // Merkaba
    drawMerkaba(centerX, centerY, 80 * pulse, rotation * 2);
    drawMerkaba(centerX, centerY, 120 * pulse, -rotation * 1.5);
    
    // Outer ring of symbols
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i + rotation * 0.3;
        const distance = 200;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        ctx.fillStyle = \`rgba(147, 112, 219, \${0.5 + Math.sin(pulsePhase + i) * 0.3})\`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    rotation += 0.005;
    pulsePhase += 0.02;
    requestAnimationFrame(animate);
}
animate();`
};