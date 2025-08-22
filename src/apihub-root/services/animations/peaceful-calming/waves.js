export default {
    name: "Flowing Waves",
    description: "Gentle flowing wave patterns",
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
  
  // Draw flowing waves
  for(let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.5);
    
    for(let x = 0; x < canvas.width; x += 10) {
      const y = canvas.height * 0.5 + Math.sin((x * 0.01) + (time * 0.02) + (i * 2)) * (50 + i * 20);
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = 'hsla(' + (200 + i * 20) + ', 70%, 60%, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};