export default {
    name: "Gentle Rain",
    description: "Peaceful rain drops with soft water effects",
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

const raindrops = [];
const ripples = [];
const dropCount = 100;

// Create raindrops
for(let i = 0; i < dropCount; i++) {
  raindrops.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    length: Math.random() * 15 + 10,
    speed: Math.random() * 4 + 8,
    opacity: Math.random() * 0.5 + 0.3,
    wind: Math.random() * 0.5 - 0.25
  });
}

function createRipple(x, y) {
  ripples.push({
    x: x,
    y: y,
    radius: 0,
    maxRadius: Math.random() * 30 + 20,
    opacity: 0.5,
    speed: 2
  });
}

function animate() {
  // Clear with rainy sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(60, 70, 80, 0.95)');
  gradient.addColorStop(0.5, 'rgba(70, 80, 90, 0.95)');
  gradient.addColorStop(1, 'rgba(80, 90, 100, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw raindrops
  ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
  ctx.lineWidth = 1;
  
  raindrops.forEach(drop => {
    // Update position
    drop.y += drop.speed;
    drop.x += drop.wind;
    
    // Draw raindrop
    ctx.globalAlpha = drop.opacity;
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x + drop.wind, drop.y + drop.length);
    ctx.stroke();
    
    // Reset if hit ground
    if(drop.y > canvas.height - 50) {
      // Create ripple at ground level
      if(Math.random() > 0.7) {
        createRipple(drop.x, canvas.height - 50);
      }
      
      drop.y = -drop.length;
      drop.x = Math.random() * canvas.width;
    }
    
    // Wrap around horizontally
    if(drop.x > canvas.width) drop.x = 0;
    if(drop.x < 0) drop.x = canvas.width;
  });
  
  ctx.globalAlpha = 1;
  
  // Draw and update ripples
  ripples.forEach((ripple, index) => {
    ripple.radius += ripple.speed;
    ripple.opacity -= 0.02;
    
    if(ripple.opacity > 0) {
      ctx.strokeStyle = \`rgba(200, 220, 255, \${ripple.opacity})\`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Remove faded ripples
    if(ripple.opacity <= 0 || ripple.radius > ripple.maxRadius) {
      ripples.splice(index, 1);
    }
  });
  
  // Add wet ground effect
  const groundGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
  groundGradient.addColorStop(0, 'rgba(100, 120, 140, 0)');
  groundGradient.addColorStop(1, 'rgba(100, 120, 140, 0.3)');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
  
  requestAnimationFrame(animate);
}
animate();`
};