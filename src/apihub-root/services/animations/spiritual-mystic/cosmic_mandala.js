export default {
    name: "Cosmic Mandala - Sacred Geometry",
    description: "Sacred geometry mandala with cosmic energy",
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
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

function drawMandalaLayer(radius, segments, rotation, hue, opacity) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  
  ctx.strokeStyle = \`hsla(\${hue}, 70%, 60%, \${opacity})\`;
  ctx.lineWidth = 2;
  
  // Draw geometric pattern
  ctx.beginPath();
  for(let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const nextAngle = ((i + 1) / segments) * Math.PI * 2;
    
    const x1 = Math.cos(angle) * radius;
    const y1 = Math.sin(angle) * radius;
    const x2 = Math.cos(nextAngle) * radius;
    const y2 = Math.sin(nextAngle) * radius;
    
    // Draw main shape
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    // Draw connecting lines to center
    if(i % 2 === 0) {
      ctx.moveTo(0, 0);
      ctx.lineTo(x1, y1);
    }
    
    // Draw inner connections
    const innerRadius = radius * 0.5;
    const ix = Math.cos(angle + Math.PI / segments) * innerRadius;
    const iy = Math.sin(angle + Math.PI / segments) * innerRadius;
    ctx.moveTo(x1, y1);
    ctx.lineTo(ix, iy);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  
  // Draw circles at vertices
  for(let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    ctx.fillStyle = \`hsla(\${hue + i * 10}, 70%, 70%, \${opacity * 0.5})\`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawSacredFlower(radius, petals, rotation) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  
  for(let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    
    ctx.strokeStyle = \`hsla(\${280 + i * 15}, 60%, 60%, 0.3)\`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
      Math.cos(angle) * radius * 0.5,
      Math.sin(angle) * radius * 0.5,
      radius * 0.5,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  
  ctx.restore();
}

function animate() {
  // Dark cosmic background
  ctx.fillStyle = 'rgba(10, 0, 30, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw multiple mandala layers
  const baseRadius = 100;
  
  // Outer layers
  for(let i = 0; i < 6; i++) {
    const radius = baseRadius + i * 30;
    const segments = 6 + i * 2;
    const rotation = time * 0.001 * (i % 2 ? 1 : -1) * (i + 1);
    const hue = 250 + i * 20;
    const opacity = 0.6 - i * 0.08;
    
    drawMandalaLayer(radius, segments, rotation, hue, opacity);
  }
  
  // Sacred geometry flower pattern
  drawSacredFlower(80, 6, time * 0.005);
  drawSacredFlower(60, 12, -time * 0.003);
  
  // Central star tetrahedron
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * 0.01);
  
  // Draw interlocking triangles
  for(let i = 0; i < 2; i++) {
    ctx.rotate(i * Math.PI);
    ctx.strokeStyle = \`hsla(280, 70%, 70%, 0.5)\`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(-35, 20);
    ctx.lineTo(35, 20);
    ctx.closePath();
    ctx.stroke();
  }
  
  ctx.restore();
  
  // Particle field
  for(let i = 0; i < 50; i++) {
    const angle = (i / 50) * Math.PI * 2 + time * 0.002;
    const radiusVariation = Math.sin(time * 0.02 + i) * 50;
    const radius = 150 + radiusVariation;
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    const hue = (time * 2 + i * 7) % 360;
    ctx.fillStyle = \`hsla(\${hue}, 70%, 70%, 0.6)\`;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Central eye
  const eyeGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
  eyeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  eyeGradient.addColorStop(0.3, 'rgba(150, 100, 255, 0.7)');
  eyeGradient.addColorStop(0.6, 'rgba(100, 50, 200, 0.5)');
  eyeGradient.addColorStop(1, 'rgba(50, 0, 150, 0)');
  
  ctx.fillStyle = eyeGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
  ctx.fill();
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};