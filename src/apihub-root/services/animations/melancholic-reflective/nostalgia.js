export default {
    name: "Nostalgia - Warm Memories",
    description: "Warm memories with gentle fading effects",
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
const memories = [];
const particles = [];

// Create memory orbs
for(let i = 0; i < 8; i++) {
  memories.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 50 + 30,
    fadeIn: Math.random() * Math.PI * 2,
    speed: 0.01 + Math.random() * 0.02,
    hue: 30 + Math.random() * 30,
    drift: {
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5
    }
  });
}

// Create floating dust particles
for(let i = 0; i < 50; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.1,
    opacity: Math.random() * 0.5 + 0.1,
    angle: Math.random() * Math.PI * 2
  });
}

function animate() {
  // Sepia-toned gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(112, 88, 64, 0.95)');
  gradient.addColorStop(0.5, 'rgba(128, 96, 72, 0.95)');
  gradient.addColorStop(1, 'rgba(96, 72, 56, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw memory orbs
  memories.forEach(memory => {
    // Gentle drift
    memory.x += memory.drift.x;
    memory.y += memory.drift.y;
    
    // Bounce off edges softly
    if(memory.x < memory.radius || memory.x > canvas.width - memory.radius) {
      memory.drift.x *= -1;
    }
    if(memory.y < memory.radius || memory.y > canvas.height - memory.radius) {
      memory.drift.y *= -1;
    }
    
    // Fading in and out effect
    const fade = (Math.sin(time * memory.speed + memory.fadeIn) + 1) * 0.5;
    
    // Draw memory glow
    const memoryGradient = ctx.createRadialGradient(
      memory.x, memory.y, 0,
      memory.x, memory.y, memory.radius * (1 + fade * 0.3)
    );
    memoryGradient.addColorStop(0, \`hsla(\${memory.hue}, 40%, 70%, \${fade * 0.6})\`);
    memoryGradient.addColorStop(0.3, \`hsla(\${memory.hue}, 35%, 65%, \${fade * 0.4})\`);
    memoryGradient.addColorStop(0.6, \`hsla(\${memory.hue}, 30%, 60%, \${fade * 0.2})\`);
    memoryGradient.addColorStop(1, \`hsla(\${memory.hue}, 25%, 55%, 0)\`);
    
    ctx.fillStyle = memoryGradient;
    ctx.beginPath();
    ctx.arc(memory.x, memory.y, memory.radius * (1 + fade * 0.3), 0, Math.PI * 2);
    ctx.fill();
    
    // Inner light
    const innerGradient = ctx.createRadialGradient(
      memory.x, memory.y, 0,
      memory.x, memory.y, memory.radius * 0.3
    );
    innerGradient.addColorStop(0, \`rgba(255, 248, 220, \${fade * 0.8})\`);
    innerGradient.addColorStop(1, \`rgba(255, 248, 220, 0)\`);
    
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(memory.x, memory.y, memory.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw floating dust particles
  particles.forEach(particle => {
    particle.angle += 0.01;
    particle.x += Math.cos(particle.angle) * particle.speed;
    particle.y -= particle.speed * 0.5;
    
    // Reset particle if it goes off screen
    if(particle.y < -10) {
      particle.y = canvas.height + 10;
      particle.x = Math.random() * canvas.width;
    }
    if(particle.x < -10) particle.x = canvas.width + 10;
    if(particle.x > canvas.width + 10) particle.x = -10;
    
    ctx.fillStyle = \`rgba(255, 248, 220, \${particle.opacity})\`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Add vignette effect
  const vignetteGradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height) * 0.7
  );
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add film grain effect
  for(let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const opacity = Math.random() * 0.1;
    ctx.fillStyle = \`rgba(255, 248, 220, \${opacity})\`;
    ctx.fillRect(x, y, 1, 1);
  }
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};