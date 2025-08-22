export default {
    name: "Aurora Borealis",
    description: "Northern lights with mystical green waves",
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
const stars = [];

// Create aurora waves
for(let i = 0; i < 5; i++) {
  waves.push({
    baseY: canvas.height * 0.2 + i * 40,
    amplitude: 50 + i * 20,
    frequency: 0.002 + i * 0.001,
    speed: 0.01 + i * 0.005,
    phase: i * Math.PI / 4,
    hue: 120 + i * 20,
    opacity: 0.4 - i * 0.08
  });
}

// Create background stars
for(let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.7,
    size: Math.random() * 2,
    twinkle: Math.random() * Math.PI * 2,
    speed: 0.01 + Math.random() * 0.02
  });
}

function animate() {
  // Dark night sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 0, 20, 0.95)');
  gradient.addColorStop(0.5, 'rgba(0, 10, 30, 0.95)');
  gradient.addColorStop(1, 'rgba(0, 20, 40, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw stars
  stars.forEach(star => {
    const twinkle = Math.sin(time * star.speed + star.twinkle) * 0.5 + 0.5;
    ctx.fillStyle = \`rgba(255, 255, 255, \${twinkle * 0.8})\`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw aurora waves
  waves.forEach((wave, index) => {
    ctx.beginPath();
    
    for(let x = 0; x <= canvas.width; x += 5) {
      const y = wave.baseY + 
                Math.sin(x * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude +
                Math.sin(x * wave.frequency * 2 + time * wave.speed * 1.5) * (wave.amplitude * 0.3) +
                Math.sin(x * wave.frequency * 3 + time * wave.speed * 0.5) * (wave.amplitude * 0.2);
      
      if(x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Create vertical gradient for each wave
    const waveGradient = ctx.createLinearGradient(0, wave.baseY - wave.amplitude, 0, wave.baseY + wave.amplitude * 2);
    waveGradient.addColorStop(0, \`hsla(\${wave.hue}, 80%, 50%, 0)\`);
    waveGradient.addColorStop(0.3, \`hsla(\${wave.hue}, 80%, 60%, \${wave.opacity})\`);
    waveGradient.addColorStop(0.5, \`hsla(\${wave.hue + 10}, 70%, 50%, \${wave.opacity * 0.8})\`);
    waveGradient.addColorStop(1, \`hsla(\${wave.hue + 20}, 60%, 40%, 0)\`);
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    
    ctx.fillStyle = waveGradient;
    ctx.fill();
    
    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = \`hsl(\${wave.hue}, 80%, 60%)\`;
    ctx.strokeStyle = \`hsla(\${wave.hue}, 90%, 70%, \${wave.opacity * 0.5})\`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
  
  // Add shimmer particles
  for(let i = 0; i < 3; i++) {
    const x = Math.random() * canvas.width;
    const y = canvas.height * 0.2 + Math.random() * 200;
    const shimmerOpacity = Math.random() * 0.5;
    
    ctx.fillStyle = \`hsla(140, 100%, 70%, \${shimmerOpacity})\`;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};