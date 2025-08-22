export default {
    name: "Floating Clouds",
    description: "Soft clouds drifting across the background",
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

const clouds = [];
const cloudCount = 8;

// Create clouds
for(let i = 0; i < cloudCount; i++) {
  const cloud = {
    x: Math.random() * canvas.width * 1.5 - canvas.width * 0.25,
    y: Math.random() * canvas.height * 0.6,
    speed: Math.random() * 0.3 + 0.1,
    scale: Math.random() * 0.5 + 0.5,
    opacity: Math.random() * 0.3 + 0.3,
    puffs: []
  };
  
  // Create cloud puffs
  const puffCount = Math.floor(Math.random() * 4) + 5;
  for(let j = 0; j < puffCount; j++) {
    cloud.puffs.push({
      offsetX: (Math.random() - 0.5) * 100,
      offsetY: (Math.random() - 0.5) * 40,
      radius: Math.random() * 40 + 30,
      opacity: Math.random() * 0.3 + 0.2
    });
  }
  
  clouds.push(cloud);
}

function drawCloud(cloud) {
  ctx.save();
  ctx.translate(cloud.x, cloud.y);
  ctx.scale(cloud.scale, cloud.scale);
  
  // Draw each puff of the cloud
  cloud.puffs.forEach(puff => {
    const gradient = ctx.createRadialGradient(
      puff.offsetX, puff.offsetY, 0,
      puff.offsetX, puff.offsetY, puff.radius
    );
    gradient.addColorStop(0, \`rgba(255, 255, 255, \${cloud.opacity * puff.opacity})\`);
    gradient.addColorStop(0.5, \`rgba(240, 240, 250, \${cloud.opacity * puff.opacity * 0.8})\`);
    gradient.addColorStop(1, \`rgba(220, 220, 240, 0)\`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(puff.offsetX, puff.offsetY, puff.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.restore();
}

function animate() {
  // Clear with sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(135, 206, 235, 0.95)');
  gradient.addColorStop(0.6, 'rgba(135, 206, 250, 0.95)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw clouds
  clouds.forEach(cloud => {
    // Move cloud
    cloud.x += cloud.speed;
    
    // Wrap around when cloud goes off screen
    if(cloud.x - 200 * cloud.scale > canvas.width) {
      cloud.x = -200 * cloud.scale;
      cloud.y = Math.random() * canvas.height * 0.6;
      cloud.opacity = Math.random() * 0.3 + 0.3;
    }
    
    // Draw cloud
    drawCloud(cloud);
  });
  
  // Add sun effect
  const sunX = canvas.width * 0.8;
  const sunY = canvas.height * 0.2;
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 100);
  sunGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
  sunGradient.addColorStop(0.3, 'rgba(255, 255, 150, 0.4)');
  sunGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
  
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 100, 0, Math.PI * 2);
  ctx.fill();
  
  requestAnimationFrame(animate);
}
animate();`
};