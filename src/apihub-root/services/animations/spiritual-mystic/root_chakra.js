export default {
    name: "Root Chakra - Grounding",
    description: "Root chakra grounding energy visualization",
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
const centerY = canvas.height * 0.7;
const roots = [];
const earthParticles = [];

// Create root tendrils
for(let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI + Math.PI;
  roots.push({
    angle: angle,
    length: 0,
    maxLength: 100 + Math.random() * 100,
    segments: 10,
    thickness: 8 - i * 0.3,
    growthSpeed: 0.5 + Math.random() * 0.5
  });
}

// Create earth energy particles
for(let i = 0; i < 50; i++) {
  earthParticles.push({
    x: centerX + (Math.random() - 0.5) * 300,
    y: centerY + Math.random() * 200,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -Math.random() * 1,
    size: Math.random() * 4 + 2,
    hue: Math.random() * 30,
    opacity: Math.random() * 0.5 + 0.3
  });
}

function drawRoot(root) {
  ctx.strokeStyle = \`rgba(139, 69, 19, 0.8)\`;
  ctx.lineWidth = root.thickness;
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#8B4513';
  
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  
  for(let j = 0; j < root.segments; j++) {
    const segmentLength = root.length / root.segments;
    const wobble = Math.sin(time * 0.02 + j * 0.5) * 10;
    const x = centerX + Math.cos(root.angle) * segmentLength * j + wobble;
    const y = centerY + Math.sin(root.angle) * segmentLength * j;
    ctx.lineTo(x, y);
  }
  
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function animate() {
  // Earth gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(20, 10, 5, 0.95)');
  gradient.addColorStop(0.5, 'rgba(60, 30, 15, 0.95)');
  gradient.addColorStop(1, 'rgba(139, 69, 19, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw roots
  roots.forEach(root => {
    if(root.length < root.maxLength) {
      root.length += root.growthSpeed;
    }
    drawRoot(root);
  });
  
  // Draw root chakra symbol
  const pulseSize = 50 + Math.sin(time * 0.03) * 10;
  
  // Outer glow
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize * 2);
  glowGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
  glowGradient.addColorStop(0.5, 'rgba(200, 0, 0, 0.2)');
  glowGradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Four-petaled lotus
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  for(let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + time * 0.01;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(pulseSize * 0.7, 0, pulseSize * 0.5, pulseSize * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Central square (earth element)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * 0.005);
  ctx.fillStyle = 'rgba(139, 69, 19, 0.9)';
  ctx.fillRect(-pulseSize * 0.3, -pulseSize * 0.3, pulseSize * 0.6, pulseSize * 0.6);
  ctx.restore();
  
  // Update and draw earth particles
  earthParticles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Attract to chakra center
    const dx = centerX - particle.x;
    const dy = centerY - particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if(dist > 50) {
      particle.vx += dx / dist * 0.05;
      particle.vy += dy / dist * 0.05;
    }
    
    // Reset if too close or off screen
    if(dist < 30 || particle.y < 0) {
      particle.x = centerX + (Math.random() - 0.5) * 300;
      particle.y = canvas.height;
      particle.vx = (Math.random() - 0.5) * 0.5;
      particle.vy = -Math.random() * 1;
    }
    
    ctx.fillStyle = \`hsla(\${particle.hue}, 70%, 40%, \${particle.opacity})\`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};