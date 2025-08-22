export default {
    name: "Dancing Flames",
    description: "Playful flames dancing with warm colors",
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
const flames = [];
const embers = [];

// Create flame sources
for(let i = 0; i < 8; i++) {
  flames.push({
    x: (canvas.width / 8) * i + canvas.width / 16,
    baseY: canvas.height * 0.8,
    particles: []
  });
  
  // Initialize flame particles
  for(let j = 0; j < 20; j++) {
    flames[i].particles.push({
      offsetX: 0,
      offsetY: 0,
      vx: 0,
      vy: 0,
      size: Math.random() * 20 + 10,
      life: Math.random(),
      hue: Math.random() * 60,
      dance: Math.random() * Math.PI * 2
    });
  }
}

// Create floating embers
for(let i = 0; i < 30; i++) {
  embers.push({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 100,
    vx: (Math.random() - 0.5) * 2,
    vy: -Math.random() * 3 - 1,
    size: Math.random() * 4 + 2,
    hue: Math.random() * 60,
    life: 1
  });
}

function updateFlameParticle(particle, flameX, flameBaseY, index) {
  particle.life -= 0.02;
  
  if(particle.life <= 0) {
    // Reset particle
    particle.offsetX = (Math.random() - 0.5) * 40;
    particle.offsetY = 0;
    particle.vx = (Math.random() - 0.5) * 2;
    particle.vy = -Math.random() * 4 - 2;
    particle.size = Math.random() * 20 + 10;
    particle.life = 1;
    particle.hue = Math.random() * 60;
    particle.dance = Math.random() * Math.PI * 2;
  }
  
  // Dance movement
  particle.dance += 0.1;
  const danceOffset = Math.sin(particle.dance + index) * 20;
  
  // Update position
  particle.offsetX += particle.vx + Math.sin(time * 0.05 + index) * 0.5;
  particle.offsetY += particle.vy;
  particle.vy *= 0.98; // Deceleration
  
  // Draw flame particle
  const x = flameX + particle.offsetX + danceOffset;
  const y = flameBaseY + particle.offsetY;
  const currentSize = particle.size * particle.life;
  
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentSize);
  gradient.addColorStop(0, \`hsla(\${particle.hue}, 100%, 70%, \${particle.life})\`);
  gradient.addColorStop(0.3, \`hsla(\${particle.hue + 20}, 100%, 50%, \${particle.life * 0.7})\`);
  gradient.addColorStop(0.6, \`hsla(\${particle.hue + 40}, 80%, 40%, \${particle.life * 0.4})\`);
  gradient.addColorStop(1, \`hsla(\${particle.hue + 60}, 60%, 30%, 0)\`);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, currentSize, 0, Math.PI * 2);
  ctx.fill();
}

function animate() {
  // Warm background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, 'rgba(20, 10, 40, 0.95)');
  bgGradient.addColorStop(0.5, 'rgba(40, 20, 60, 0.95)');
  bgGradient.addColorStop(1, 'rgba(80, 40, 20, 0.95)');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw dancing flames
  flames.forEach((flame, flameIndex) => {
    // Make flames dance side to side
    const danceX = Math.sin(time * 0.03 + flameIndex * 0.5) * 30;
    const currentX = flame.x + danceX;
    
    // Update and draw flame particles
    flame.particles.forEach((particle, index) => {
      updateFlameParticle(particle, currentX, flame.baseY, flameIndex);
    });
    
    // Draw flame base glow
    const baseGradient = ctx.createRadialGradient(
      currentX, flame.baseY, 0,
      currentX, flame.baseY, 50
    );
    baseGradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
    baseGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
    baseGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(currentX, flame.baseY, 50, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Update and draw embers
  embers.forEach(ember => {
    ember.x += ember.vx;
    ember.y += ember.vy;
    ember.life -= 0.005;
    
    // Add slight wobble
    ember.vx += (Math.random() - 0.5) * 0.1;
    
    // Reset ember if it goes off screen
    if(ember.y < -10 || ember.life <= 0) {
      ember.x = Math.random() * canvas.width;
      ember.y = canvas.height + 10;
      ember.vx = (Math.random() - 0.5) * 2;
      ember.vy = -Math.random() * 3 - 1;
      ember.life = 1;
    }
    
    ctx.fillStyle = \`hsla(\${ember.hue}, 100%, 50%, \${ember.life * 0.8})\`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = \`hsl(\${ember.hue}, 100%, 50%)\`;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, ember.size * ember.life, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.shadowBlur = 0;
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};