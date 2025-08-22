export default {
    name: "Energy Vortex",
    description: "Swirling energy vortex effect",
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
const particles = [];
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Create spiral particles
for(let i = 0; i < 200; i++) {
  particles.push({
    angle: Math.random() * Math.PI * 2,
    radius: Math.random() * 300 + 50,
    speed: Math.random() * 0.05 + 0.02,
    size: Math.random() * 4 + 2,
    hue: Math.random() * 360
  });
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  particles.forEach(particle => {
    // Update particle position in spiral
    particle.angle += particle.speed;
    particle.radius -= 1.5; // Move inward
    
    // Reset particle when it reaches center
    if(particle.radius < 5) {
      particle.radius = 300;
      particle.angle = Math.random() * Math.PI * 2;
      particle.hue = Math.random() * 360;
    }
    
    // Calculate position
    const x = centerX + Math.cos(particle.angle) * particle.radius;
    const y = centerY + Math.sin(particle.angle) * particle.radius;
    
    // Draw particle with trail effect
    const intensity = (300 - particle.radius) / 300;
    ctx.fillStyle = \`hsla(\${particle.hue}, 90%, 60%, \${intensity})\`;
    ctx.shadowBlur = 15;
    ctx.shadowColor = \`hsl(\${particle.hue}, 90%, 60%)\`;
    
    ctx.beginPath();
    const radius = Math.max(0.1, particle.size * intensity); // Prevent negative radius
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw center energy core
  const pulseSize = 30 + Math.sin(time * 0.1) * 15;
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 50, 150, 0.1)');
  
  ctx.fillStyle = gradient;
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};