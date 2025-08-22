export default {
    name: "Falling Snow",
    description: "Gentle snowflakes falling with winter ambiance",
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

const snowflakes = [];
const snowflakeCount = 150;

// Create snowflakes
for(let i = 0; i < snowflakeCount; i++) {
  snowflakes.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    radius: Math.random() * 3 + 1,
    speed: Math.random() * 1 + 0.5,
    wind: Math.random() * 0.5 - 0.25,
    opacity: Math.random() * 0.6 + 0.4,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.02 + 0.01
  });
}

function drawSnowflake(x, y, radius, opacity) {
  ctx.fillStyle = \`rgba(255, 255, 255, \${opacity})\`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Add subtle glow
  ctx.shadowBlur = radius * 2;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();
  ctx.shadowBlur = 0;
}

function animate() {
  // Clear with winter sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(50, 60, 80, 0.95)');
  gradient.addColorStop(1, 'rgba(90, 100, 120, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw snowflakes
  snowflakes.forEach(flake => {
    // Update position
    flake.y += flake.speed;
    flake.sway += flake.swaySpeed;
    flake.x += Math.sin(flake.sway) * 0.5 + flake.wind;
    
    // Reset if off screen
    if(flake.y > canvas.height + 10) {
      flake.y = -10;
      flake.x = Math.random() * canvas.width;
    }
    if(flake.x > canvas.width + 10) {
      flake.x = -10;
    }
    if(flake.x < -10) {
      flake.x = canvas.width + 10;
    }
    
    // Draw snowflake
    drawSnowflake(flake.x, flake.y, flake.radius, flake.opacity);
  });
  
  // Add ground accumulation effect
  const groundGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
  groundGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  groundGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
  
  requestAnimationFrame(animate);
}
animate();`
};