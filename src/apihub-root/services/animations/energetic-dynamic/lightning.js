export default {
    name: "Electric Lightning",
    description: "Electric lightning bolts with dynamic energy",
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
const bolts = [];

function createBolt() {
  return {
    segments: generateLightning(
      Math.random() * canvas.width, 20,
      Math.random() * canvas.width, canvas.height - 20,
      4
    ),
    life: 1.0,
    decay: 0.05 + Math.random() * 0.1
  };
}

function generateLightning(x1, y1, x2, y2, displace) {
  if(displace < 1) return [[x1, y1], [x2, y2]];
  
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  const offset = (Math.random() - 0.5) * displace * 0.3;
  const midX = mx + (-dy / dist) * offset;
  const midY = my + (dx / dist) * offset;
  
  return [
    ...generateLightning(x1, y1, midX, midY, displace/2),
    ...generateLightning(midX, midY, x2, y2, displace/2)
  ];
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Create new bolts randomly
  if(Math.random() < 0.05) {
    bolts.push(createBolt());
  }
  
  // Draw and update bolts
  for(let i = bolts.length - 1; i >= 0; i--) {
    const bolt = bolts[i];
    
    ctx.strokeStyle = \`rgba(100, 150, 255, \${bolt.life})\`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#4488ff';
    
    ctx.beginPath();
    for(let j = 0; j < bolt.segments.length - 1; j++) {
      ctx.moveTo(bolt.segments[j][0], bolt.segments[j][1]);
      ctx.lineTo(bolt.segments[j+1][0], bolt.segments[j+1][1]);
    }
    ctx.stroke();
    
    bolt.life -= bolt.decay;
    if(bolt.life <= 0) {
      bolts.splice(i, 1);
    }
  }
  
  ctx.shadowBlur = 0;
  time += 0.02;
  requestAnimationFrame(animate);
}
animate();`
};