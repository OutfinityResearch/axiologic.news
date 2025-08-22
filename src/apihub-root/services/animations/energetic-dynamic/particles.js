export default {
    name: "Colored Particles",
    description: "Colorful particles floating upward",
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
const particles = [];

// Create particles
for(let i = 0; i < 25; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 6 + 3,
    speed: Math.random() * 3 + 1,
    color: 'hsl(' + (Math.random() * 60 + 300) + ', 70%, 60%)'
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach(p => {
    p.y -= p.speed;
    if(p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  time += 0.02;
  requestAnimationFrame(animate);
}
animate();`
};