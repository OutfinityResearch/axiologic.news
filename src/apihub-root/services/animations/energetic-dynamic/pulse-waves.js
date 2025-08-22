export default {
    name: "Pulsing Energy Waves",
    description: "Radial pulsing wave effect with high energy",
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

let pulse = 0;
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let i = 0; i < 10; i++) {
        const radius = (pulse + i * 30) % 300;
        const opacity = 1 - (radius / 300);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = \`rgba(255, 100, 100, \${opacity * 0.5})\`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    pulse += 4; // Faster for energetic feel
    requestAnimationFrame(animate);
}
animate();`
};