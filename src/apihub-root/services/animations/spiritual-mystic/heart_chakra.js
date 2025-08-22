export default {
    name: "Heart Chakra - Healing Love",
    description: "Heart chakra healing love energy visualization",
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
const loveParticles = [];
const healingWaves = [];

// Create love particles
for(let i = 0; i < 60; i++) {
  loveParticles.push({
    angle: Math.random() * Math.PI * 2,
    radius: Math.random() * 200,
    speed: 0.01 + Math.random() * 0.02,
    size: Math.random() * 6 + 3,
    hue: 120 + Math.random() * 20,
    heartPhase: Math.random() * Math.PI * 2
  });
}

// Create healing waves
for(let i = 0; i < 5; i++) {
  healingWaves.push({
    radius: 0,
    maxRadius: 300,
    speed: 2,
    opacity: 0.5,
    birthTime: i * 30
  });
}

function drawHeart(x, y, size, color, opacity) {
  ctx.fillStyle = \`rgba(\${color.r}, \${color.g}, \${color.b}, \${opacity})\`;
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
  ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 3/4, x, y + size);
  ctx.bezierCurveTo(x, y + size * 3/4, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
  ctx.fill();
}

function animate() {
  // Soft green gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(40, 80, 40, 0.95)');
  gradient.addColorStop(0.5, 'rgba(60, 120, 60, 0.95)');
  gradient.addColorStop(1, 'rgba(40, 100, 40, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw healing waves
  healingWaves.forEach((wave, index) => {
    if(time > wave.birthTime) {
      wave.radius += wave.speed;
      wave.opacity = Math.max(0, 0.5 - (wave.radius / wave.maxRadius) * 0.5);
      
      if(wave.radius > wave.maxRadius) {
        wave.radius = 0;
        wave.birthTime = time + 150;
      }
      
      ctx.strokeStyle = \`rgba(0, 255, 0, \${wave.opacity})\`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  
  // Draw 12-petaled lotus
  const pulseSize = 60 + Math.sin(time * 0.02) * 15;
  
  for(let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + time * 0.01;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    
    const petalGradient = ctx.createLinearGradient(0, 0, pulseSize, 0);
    petalGradient.addColorStop(0, 'rgba(0, 255, 0, 0.6)');
    petalGradient.addColorStop(1, 'rgba(0, 200, 0, 0.2)');
    ctx.fillStyle = petalGradient;
    
    ctx.beginPath();
    ctx.ellipse(pulseSize * 0.8, 0, pulseSize * 0.4, pulseSize * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Central hexagram (two triangles)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * 0.005);
  
  // Upward triangle
  ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.beginPath();
  ctx.moveTo(0, -pulseSize * 0.4);
  ctx.lineTo(-pulseSize * 0.35, pulseSize * 0.2);
  ctx.lineTo(pulseSize * 0.35, pulseSize * 0.2);
  ctx.closePath();
  ctx.fill();
  
  // Downward triangle
  ctx.beginPath();
  ctx.moveTo(0, pulseSize * 0.4);
  ctx.lineTo(-pulseSize * 0.35, -pulseSize * 0.2);
  ctx.lineTo(pulseSize * 0.35, -pulseSize * 0.2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  
  // Update and draw love particles
  loveParticles.forEach(particle => {
    particle.angle += particle.speed;
    particle.heartPhase += 0.05;
    
    const heartBeat = Math.sin(particle.heartPhase) * 0.3 + 0.7;
    const currentRadius = particle.radius * heartBeat;
    
    const x = centerX + Math.cos(particle.angle) * currentRadius;
    const y = centerY + Math.sin(particle.angle) * currentRadius;
    
    // Draw particle as small heart
    drawHeart(x, y, particle.size * heartBeat, 
              {r: 0, g: 255, b: 0}, 
              0.6);
  });
  
  // Central glow
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
  glowGradient.addColorStop(0.5, 'rgba(0, 200, 0, 0.4)');
  glowGradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};