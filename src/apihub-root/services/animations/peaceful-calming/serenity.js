export default {
    name: "Serenity - Inner Peace",
    description: "Peaceful meditation effects with soft colors",
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
const breathingOrbs = [];
const zenParticles = [];

// Create breathing orbs
for(let i = 0; i < 5; i++) {
  breathingOrbs.push({
    angle: (i / 5) * Math.PI * 2,
    radius: 100 + i * 30,
    phase: i * 0.5,
    hue: 180 + i * 20,
    size: 20 + i * 5
  });
}

// Create zen particles
for(let i = 0; i < 30; i++) {
  zenParticles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 3 + 1,
    opacity: Math.random() * 0.5 + 0.2
  });
}

function animate() {
  // Soft fade effect
  ctx.fillStyle = 'rgba(240, 248, 255, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw central mandala pattern
  const pulseScale = 1 + Math.sin(time * 0.01) * 0.1;
  
  for(let ring = 0; ring < 5; ring++) {
    const ringRadius = (50 + ring * 40) * pulseScale;
    const segments = 8 + ring * 4;
    
    ctx.strokeStyle = \`hsla(200, 50%, 70%, \${0.3 - ring * 0.05})\`;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for(let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + time * 0.005 * (ring % 2 ? 1 : -1);
      const x = centerX + Math.cos(angle) * ringRadius;
      const y = centerY + Math.sin(angle) * ringRadius;
      
      if(i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  // Draw breathing orbs
  breathingOrbs.forEach(orb => {
    const breathe = Math.sin(time * 0.02 + orb.phase);
    const currentRadius = orb.radius + breathe * 20;
    const x = centerX + Math.cos(orb.angle + time * 0.003) * currentRadius;
    const y = centerY + Math.sin(orb.angle + time * 0.003) * currentRadius;
    
    // Orb glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.size * (1 + breathe * 0.3));
    gradient.addColorStop(0, \`hsla(\${orb.hue}, 60%, 70%, 0.6)\`);
    gradient.addColorStop(0.5, \`hsla(\${orb.hue}, 60%, 70%, 0.3)\`);
    gradient.addColorStop(1, \`hsla(\${orb.hue}, 60%, 70%, 0)\`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, orb.size * (1 + breathe * 0.3), 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw zen particles
  zenParticles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Wrap around edges
    if(particle.x < 0) particle.x = canvas.width;
    if(particle.x > canvas.width) particle.x = 0;
    if(particle.y < 0) particle.y = canvas.height;
    if(particle.y > canvas.height) particle.y = 0;
    
    ctx.fillStyle = \`rgba(200, 220, 255, \${particle.opacity})\`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Central peace symbol
  const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
  centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  centerGradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.4)');
  centerGradient.addColorStop(1, 'rgba(150, 180, 220, 0)');
  
  ctx.fillStyle = centerGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50 * pulseScale, 0, Math.PI * 2);
  ctx.fill();
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};