export default {
    name: "Twinkling Stars",
    description: "Twinkling stars in the night sky",
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
const stars = [];

// Create stars
for(let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 3 + 1,
    twinkle: Math.random() * Math.PI * 2
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  stars.forEach(star => {
    const alpha = (Math.sin(time * 0.05 + star.twinkle) + 1) * 0.5;
    ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};