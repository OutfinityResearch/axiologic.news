export default {
    name: "Neon Pulse",
    description: "Retro neon grid with scanning light effects",
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
const lines = [];

// Create neon grid lines
for(let i = 0; i < 15; i++) {
  lines.push({
    horizontal: true,
    pos: (canvas.height / 15) * i,
    phase: Math.random() * Math.PI * 2,
    speed: 0.05 + Math.random() * 0.1
  });
}

for(let i = 0; i < 20; i++) {
  lines.push({
    horizontal: false,
    pos: (canvas.width / 20) * i,
    phase: Math.random() * Math.PI * 2,
    speed: 0.05 + Math.random() * 0.1
  });
}

function drawNeonLine(x1, y1, x2, y2, color, intensity) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * intensity;
  ctx.shadowBlur = 20 * intensity;
  ctx.shadowColor = color;
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  lines.forEach(line => {
    const intensity = (Math.sin(time * line.speed + line.phase) + 1) * 0.5;
    const hue = (time * 2 + line.phase * 50) % 360;
    const color = \`hsl(\${hue}, 100%, 60%)\`;
    
    if(line.horizontal) {
      // Horizontal neon lines
      drawNeonLine(0, line.pos, canvas.width, line.pos, color, intensity);
      
      // Add scanning effect
      const scanX = (Math.sin(time * 0.03 + line.phase) + 1) * 0.5 * canvas.width;
      ctx.fillStyle = \`hsla(\${hue}, 100%, 80%, \${intensity * 0.3})\`;
      ctx.shadowBlur = 30;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(scanX, line.pos, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Vertical neon lines
      drawNeonLine(line.pos, 0, line.pos, canvas.height, color, intensity);
      
      // Add scanning effect
      const scanY = (Math.sin(time * 0.04 + line.phase) + 1) * 0.5 * canvas.height;
      ctx.fillStyle = \`hsla(\${hue}, 100%, 80%, \${intensity * 0.3})\`;
      ctx.shadowBlur = 30;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(line.pos, scanY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  ctx.shadowBlur = 0;
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};