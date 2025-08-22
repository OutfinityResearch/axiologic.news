export default {
    name: "Misty Fog",
    description: "Atmospheric fog with mysterious ambiance",
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
const fogLayers = [];
const particles = [];

// Create fog layers
for(let i = 0; i < 5; i++) {
  fogLayers.push({
    y: canvas.height * (0.3 + i * 0.15),
    amplitude: 30 + i * 10,
    frequency: 0.001 + i * 0.0005,
    speed: 0.005 + i * 0.002,
    opacity: 0.3 - i * 0.05,
    thickness: 100 + i * 30
  });
}

// Create drifting particles
for(let i = 0; i < 30; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.1,
    size: Math.random() * 60 + 20,
    opacity: Math.random() * 0.2 + 0.05
  });
}

function animate() {
  // Moody gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(60, 70, 80, 0.95)');
  gradient.addColorStop(0.5, 'rgba(70, 80, 90, 0.95)');
  gradient.addColorStop(1, 'rgba(80, 90, 100, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw fog layers
  fogLayers.forEach((layer, index) => {
    ctx.beginPath();
    
    for(let x = -50; x <= canvas.width + 50; x += 10) {
      const y = layer.y + Math.sin(x * layer.frequency + time * layer.speed) * layer.amplitude;
      
      if(x === -50) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.lineTo(canvas.width + 50, canvas.height);
    ctx.lineTo(-50, canvas.height);
    ctx.closePath();
    
    const fogGradient = ctx.createLinearGradient(0, layer.y - layer.thickness/2, 0, layer.y + layer.thickness);
    fogGradient.addColorStop(0, \`rgba(150, 160, 170, 0)\`);
    fogGradient.addColorStop(0.5, \`rgba(150, 160, 170, \${layer.opacity})\`);
    fogGradient.addColorStop(1, \`rgba(150, 160, 170, \${layer.opacity * 0.5})\`);
    
    ctx.fillStyle = fogGradient;
    ctx.fill();
  });
  
  // Draw drifting mist particles
  particles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Wrap around edges
    if(particle.x < -particle.size) particle.x = canvas.width + particle.size;
    if(particle.x > canvas.width + particle.size) particle.x = -particle.size;
    if(particle.y < -particle.size) particle.y = canvas.height + particle.size;
    if(particle.y > canvas.height + particle.size) particle.y = -particle.size;
    
    const mistGradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size
    );
    mistGradient.addColorStop(0, \`rgba(180, 190, 200, \${particle.opacity})\`);
    mistGradient.addColorStop(0.5, \`rgba(180, 190, 200, \${particle.opacity * 0.5})\`);
    mistGradient.addColorStop(1, 'rgba(180, 190, 200, 0)');
    
    ctx.fillStyle = mistGradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Add atmospheric overlay
  const overlayGradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2
  );
  overlayGradient.addColorStop(0, 'rgba(100, 110, 120, 0)');
  overlayGradient.addColorStop(1, 'rgba(100, 110, 120, 0.2)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};