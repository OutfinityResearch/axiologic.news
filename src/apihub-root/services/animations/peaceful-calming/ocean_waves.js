export default {
    name: "Ocean Waves",
    description: "Realistic ocean waves with foam particles and rising bubbles",
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
const waves = [];
const foam = [];
const bubbles = [];

// Create wave layers
for(let i = 0; i < 5; i++) {
  waves.push({
    amplitude: 30 + i * 15,
    frequency: 0.01 - i * 0.002,
    speed: 0.02 - i * 0.003,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.4 - i * 0.08,
    color: [70 - i * 5, 150 - i * 10, 200 - i * 15]
  });
}

// Create foam particles
for(let i = 0; i < 20; i++) {
  foam.push({
    x: Math.random() * canvas.width,
    y: canvas.height * 0.4 + Math.random() * 100,
    radius: Math.random() * 3 + 1,
    lifetime: 0,
    maxLifetime: 100 + Math.random() * 100
  });
}

// Create rising bubbles
for(let i = 0; i < 15; i++) {
  bubbles.push({
    x: Math.random() * canvas.width,
    y: canvas.height + Math.random() * 200,
    radius: Math.random() * 4 + 2,
    speed: Math.random() * 2 + 1,
    wobble: Math.random() * Math.PI * 2
  });
}

function animate() {
  // Clear with ocean gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(20, 50, 80, 0.95)');
  gradient.addColorStop(0.5, 'rgba(30, 80, 120, 0.95)');
  gradient.addColorStop(1, 'rgba(10, 40, 70, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw waves
  waves.forEach((wave, index) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.5);
    
    for(let x = 0; x <= canvas.width; x += 5) {
      const y = canvas.height * 0.5 + 
                Math.sin(x * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude +
                Math.sin(x * wave.frequency * 2 + time * wave.speed * 1.5) * (wave.amplitude * 0.3);
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    
    const [r, g, b] = wave.color;
    ctx.fillStyle = \`rgba(\${r}, \${g}, \${b}, \${wave.opacity})\`;
    ctx.fill();
  });
  
  // Update and draw foam
  foam.forEach(particle => {
    particle.lifetime++;
    if(particle.lifetime > particle.maxLifetime) {
      particle.x = Math.random() * canvas.width;
      particle.y = canvas.height * 0.4 + Math.random() * 100;
      particle.lifetime = 0;
      particle.maxLifetime = 100 + Math.random() * 100;
    }
    
    const opacity = 1 - (particle.lifetime / particle.maxLifetime);
    ctx.fillStyle = \`rgba(255, 255, 255, \${opacity * 0.6})\`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y + Math.sin(time * 0.05) * 5, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Update and draw bubbles
  bubbles.forEach(bubble => {
    bubble.y -= bubble.speed;
    bubble.x += Math.sin(time * 0.03 + bubble.wobble) * 0.5;
    
    if(bubble.y < -20) {
      bubble.y = canvas.height + 20;
      bubble.x = Math.random() * canvas.width;
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add bubble highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};