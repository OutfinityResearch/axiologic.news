export default {
    name: "Geometric Shapes",
    description: "Dynamic geometric shapes",
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

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw rotating geometric shapes
  for(let i = 0; i < 8; i++) {
    const x = (canvas.width / 8) * (i + 0.5);
    const y = canvas.height * 0.5 + Math.sin(time * 0.01 + i) * 100;
    const rotation = time * 0.02 + i * 0.5;
    const size = 20 + Math.sin(time * 0.03 + i) * 10;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = 'hsla(' + (i * 45) + ', 70%, 60%, 0.6)';
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.restore();
  }
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};