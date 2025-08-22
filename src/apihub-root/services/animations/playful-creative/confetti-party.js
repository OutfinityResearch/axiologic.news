export default {
    name: "Confetti Party",
    description: "Celebratory confetti falling with party vibes",
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

const confetti = [];
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#FD79A8', '#A29BFE'];

for (let i = 0; i < 100; i++) {
    confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: 5 + Math.random() * 10,
        h: 5 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

function animate() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    confetti.forEach(piece => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotSpeed;
        
        // Sway effect
        piece.x += Math.sin(piece.y * 0.01) * 0.5;
        
        // Reset when off screen
        if (piece.y > canvas.height) {
            piece.y = -20;
            piece.x = Math.random() * canvas.width;
        }
        
        // Draw confetti piece
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w/2, -piece.h/2, piece.w, piece.h);
        ctx.restore();
    });
    
    requestAnimationFrame(animate);
}
animate();`
};