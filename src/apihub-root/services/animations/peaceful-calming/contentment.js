export default {
    name: "Contentment - Gentle Satisfaction",
    description: "Warm gentle glow with satisfied feelings",
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
const warmGlows = [];
const floatingHearts = [];
const gentleWaves = [];

// Create warm glow sources
for(let i = 0; i < 6; i++) {
  warmGlows.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 100 + 50,
    hue: 30 + Math.random() * 30,
    intensity: Math.random() * 0.5 + 0.5,
    pulse: Math.random() * Math.PI * 2,
    speed: 0.01 + Math.random() * 0.02
  });
}

// Create floating hearts
for(let i = 0; i < 15; i++) {
  floatingHearts.push({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 200,
    size: Math.random() * 15 + 10,
    speed: Math.random() * 1 + 0.5,
    sway: Math.random() * Math.PI * 2,
    opacity: Math.random() * 0.5 + 0.3
  });
}

// Create gentle wave layers
for(let i = 0; i < 3; i++) {
  gentleWaves.push({
    amplitude: 20 + i * 10,
    frequency: 0.005 - i * 0.001,
    speed: 0.01 + i * 0.005,
    phase: i * Math.PI / 3,
    opacity: 0.2 - i * 0.05
  });
}

function drawHeart(x, y, size, opacity) {
  ctx.fillStyle = \`rgba(255, 182, 193, \${opacity})\`;
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
  ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 3/4, x, y + size);
  ctx.bezierCurveTo(x, y + size * 3/4, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
  ctx.fill();
}

function animate() {
  // Clear with warm gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(255, 239, 213, 0.95)');
  gradient.addColorStop(0.5, 'rgba(255, 228, 196, 0.95)');
  gradient.addColorStop(1, 'rgba(255, 218, 185, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw warm glows
  warmGlows.forEach(glow => {
    const pulse = Math.sin(time * glow.speed + glow.pulse) * 0.3 + 0.7;
    const currentRadius = glow.radius * pulse;
    
    const glowGradient = ctx.createRadialGradient(
      glow.x, glow.y, 0,
      glow.x, glow.y, currentRadius
    );
    glowGradient.addColorStop(0, \`hsla(\${glow.hue}, 70%, 60%, \${glow.intensity * 0.5})\`);
    glowGradient.addColorStop(0.5, \`hsla(\${glow.hue}, 70%, 65%, \${glow.intensity * 0.3})\`);
    glowGradient.addColorStop(1, \`hsla(\${glow.hue}, 70%, 70%, 0)\`);
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(glow.x, glow.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw gentle waves
  gentleWaves.forEach(wave => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    
    for(let x = 0; x <= canvas.width; x += 10) {
      const y = canvas.height / 2 + 
                Math.sin(x * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude;
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = \`rgba(255, 200, 150, \${wave.opacity})\`;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  
  // Update and draw floating hearts
  floatingHearts.forEach(heart => {
    heart.y -= heart.speed;
    heart.sway += 0.02;
    heart.x += Math.sin(heart.sway) * 0.5;
    
    if(heart.y < -heart.size * 2) {
      heart.y = canvas.height + heart.size;
      heart.x = Math.random() * canvas.width;
    }
    
    drawHeart(heart.x, heart.y, heart.size, heart.opacity);
  });
  
  // Add soft overlay
  const overlayGradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
  );
  overlayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  overlayGradient.addColorStop(1, 'rgba(255, 200, 150, 0.05)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};