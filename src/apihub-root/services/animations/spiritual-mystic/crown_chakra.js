export default {
    name: "Crown Chakra - Cosmic Unity",
    description: "Crown chakra cosmic unity visualization",
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
const centerY = canvas.height * 0.3;
const cosmicParticles = [];
const lightRays = [];

// Create cosmic particles
for(let i = 0; i < 100; i++) {
  cosmicParticles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -Math.random() * 2,
    size: Math.random() * 3 + 1,
    hue: 270 + Math.random() * 60,
    opacity: Math.random() * 0.8 + 0.2
  });
}

// Create ascending light rays
for(let i = 0; i < 8; i++) {
  lightRays.push({
    angle: (i / 8) * Math.PI * 2,
    length: 200 + Math.random() * 150,
    intensity: Math.random(),
    speed: 0.02 + Math.random() * 0.03,
    width: 20 + Math.random() * 30
  });
}

function animate() {
  // Deep cosmic gradient background
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.height);
  gradient.addColorStop(0, 'rgba(60, 0, 120, 0.95)');
  gradient.addColorStop(0.5, 'rgba(30, 0, 80, 0.95)');
  gradient.addColorStop(1, 'rgba(10, 0, 30, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw ascending light rays
  lightRays.forEach(ray => {
    const pulse = Math.sin(time * ray.speed) * 0.5 + 0.5;
    const currentLength = ray.length * (1 + pulse * 0.3);
    
    const x2 = centerX + Math.cos(ray.angle) * currentLength;
    const y2 = centerY + Math.sin(ray.angle) * currentLength;
    
    const rayGradient = ctx.createLinearGradient(centerX, centerY, x2, y2);
    rayGradient.addColorStop(0, \`rgba(255, 255, 255, \${ray.intensity * pulse})\`);
    rayGradient.addColorStop(0.5, \`rgba(200, 150, 255, \${ray.intensity * pulse * 0.5})\`);
    rayGradient.addColorStop(1, \`rgba(150, 100, 255, 0)\`);
    
    ctx.strokeStyle = rayGradient;
    ctx.lineWidth = ray.width * pulse;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  
  // Draw thousand-petaled lotus
  const petalCount = 50;
  const pulseSize = 80 + Math.sin(time * 0.015) * 20;
  
  for(let layer = 0; layer < 3; layer++) {
    const layerSize = pulseSize * (1 - layer * 0.2);
    const layerPetals = petalCount - layer * 10;
    
    for(let i = 0; i < layerPetals; i++) {
      const angle = (i / layerPetals) * Math.PI * 2 + time * 0.005 * (layer % 2 ? 1 : -1);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      
      const petalGradient = ctx.createLinearGradient(0, 0, layerSize, 0);
      petalGradient.addColorStop(0, \`rgba(255, 255, 255, \${0.3 - layer * 0.1})\`);
      petalGradient.addColorStop(0.5, \`rgba(200, 150, 255, \${0.2 - layer * 0.05})\`);
      petalGradient.addColorStop(1, 'rgba(150, 100, 255, 0)');
      ctx.fillStyle = petalGradient;
      
      ctx.beginPath();
      ctx.ellipse(layerSize * 0.6, 0, layerSize * 0.3, layerSize * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  
  // Central Om symbol (simplified as circle)
  const omGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
  omGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  omGradient.addColorStop(0.5, 'rgba(200, 150, 255, 0.8)');
  omGradient.addColorStop(1, 'rgba(150, 100, 255, 0.4)');
  ctx.fillStyle = omGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw Om symbol
  ctx.fillStyle = 'rgba(100, 0, 200, 0.8)';
  ctx.font = 'bold 30px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ॐ', centerX, centerY);
  
  // Update and draw cosmic particles
  cosmicParticles.forEach(particle => {
    particle.y += particle.vy;
    particle.x += particle.vx;
    
    // Attract to crown
    const dx = centerX - particle.x;
    const dy = centerY - particle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if(dist > 100) {
      particle.vx += dx / dist * 0.1;
    }
    
    // Reset particles that go off screen
    if(particle.y < -10) {
      particle.y = canvas.height + 10;
      particle.x = Math.random() * canvas.width;
      particle.vx = (Math.random() - 0.5) * 0.5;
    }
    
    ctx.fillStyle = \`hsla(\${particle.hue}, 70%, 70%, \${particle.opacity})\`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = \`hsl(\${particle.hue}, 70%, 70%)\`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.shadowBlur = 0;
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};