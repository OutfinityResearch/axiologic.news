export default {
    name: "Triangle Mesh",
    description: "Connected triangle mesh animation",
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

const points = [];
const triangleSize = 80;
const rows = Math.ceil(canvas.height / triangleSize) + 2;
const cols = Math.ceil(canvas.width / triangleSize) + 2;

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        points.push({
            x: col * triangleSize + (row % 2) * triangleSize / 2,
            y: row * triangleSize,
            offsetX: Math.random() * 15 - 7.5,
            offsetY: Math.random() * 15 - 7.5,
            speed: Math.random() * 0.04 + 0.02 // Faster animation
        });
    }
}

let time = 0;
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 100, 150, 0.3)';
    ctx.lineWidth = 2;
    
    points.forEach((point, i) => {
        const x = point.x + Math.sin(time * point.speed) * point.offsetX;
        const y = point.y + Math.cos(time * point.speed) * point.offsetY;
        
        // Connect to nearby points
        points.forEach((other, j) => {
            if (i !== j) {
                const dx = other.x - point.x;
                const dy = other.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < triangleSize * 1.5) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(
                        other.x + Math.sin(time * other.speed) * other.offsetX,
                        other.y + Math.cos(time * other.speed) * other.offsetY
                    );
                    ctx.stroke();
                }
            }
        });
    });
    
    time += 2; // Faster animation
    requestAnimationFrame(animate);
}
animate();`
};