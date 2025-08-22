export default {
    name: "Rainbow Prisms",
    description: "Colorful light prisms with rainbow effects",
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
const prisms = [];
const lightBeams = [];

// Create floating prisms
for(let i = 0; i < 12; i++) {
  prisms.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 40 + 20,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    hue: Math.random() * 360
  });
}

// Create light beams
for(let i = 0; i < 6; i++) {
  lightBeams.push({
    startX: Math.random() * canvas.width,
    startY: 0,
    angle: Math.PI / 4 + Math.random() * Math.PI / 2,
    width: Math.random() * 30 + 10,
    speed: Math.random() * 2 + 1,
    offset: Math.random() * 1000
  });
}

function drawPrism(x, y, size, rotation, hue) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  // Draw triangular prism with rainbow effect
  for(let i = 0; i < 7; i++) {
    const offset = (i - 3) * 3;
    const color = (hue + i * 60) % 360;
    const opacity = 0.6 - Math.abs(i - 3) * 0.1;
    
    ctx.fillStyle = \`hsla(\${color}, 100%, 50%, \${opacity})\`;
    ctx.beginPath();
    ctx.moveTo(offset, -size);
    ctx.lineTo(offset - size * 0.866, size * 0.5);
    ctx.lineTo(offset + size * 0.866, size * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

function drawLightBeam(beam) {
  const beamX = beam.startX + Math.sin(time * 0.01 + beam.offset) * 100;
  const endX = beamX + Math.cos(beam.angle) * canvas.height * 2;
  const endY = canvas.height;
  
  // Create rainbow gradient for beam
  const gradient = ctx.createLinearGradient(beamX, 0, endX, endY);
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
  colors.forEach((color, i) => {
    gradient.addColorStop(i / colors.length, color);
    gradient.addColorStop((i + 1) / colors.length, color);
  });
  
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = beam.width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(beamX, 0);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
}

function animate() {
  // Light gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, 'rgba(240, 240, 255, 0.95)');
  bgGradient.addColorStop(0.5, 'rgba(230, 230, 250, 0.95)');
  bgGradient.addColorStop(1, 'rgba(220, 220, 245, 0.95)');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw light beams
  lightBeams.forEach(beam => {
    drawLightBeam(beam);
  });
  
  // Update and draw prisms
  prisms.forEach(prism => {
    // Update position
    prism.x += prism.vx;
    prism.y += prism.vy;
    prism.rotation += prism.rotationSpeed;
    
    // Bounce off walls
    if(prism.x < prism.size || prism.x > canvas.width - prism.size) {
      prism.vx *= -1;
    }
    if(prism.y < prism.size || prism.y > canvas.height - prism.size) {
      prism.vy *= -1;
    }
    
    // Draw prism
    drawPrism(prism.x, prism.y, prism.size, prism.rotation, prism.hue);
    
    // Draw refracted light rays from prism
    for(let i = 0; i < 7; i++) {
      const rayAngle = prism.rotation + (i - 3) * 0.2;
      const rayLength = 100 + Math.sin(time * 0.05 + i) * 50;
      const rayColor = (prism.hue + i * 60) % 360;
      
      ctx.strokeStyle = \`hsla(\${rayColor}, 100%, 50%, 0.3)\`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prism.x, prism.y);
      ctx.lineTo(
        prism.x + Math.cos(rayAngle) * rayLength,
        prism.y + Math.sin(rayAngle) * rayLength
      );
      ctx.stroke();
    }
  });
  
  // Add sparkle effects
  for(let i = 0; i < 3; i++) {
    const sparkleX = Math.random() * canvas.width;
    const sparkleY = Math.random() * canvas.height;
    const sparkleSize = Math.random() * 10 + 5;
    const sparkleHue = Math.random() * 360;
    
    const sparkleGradient = ctx.createRadialGradient(
      sparkleX, sparkleY, 0,
      sparkleX, sparkleY, sparkleSize
    );
    sparkleGradient.addColorStop(0, \`hsla(\${sparkleHue}, 100%, 100%, 0.8)\`);
    sparkleGradient.addColorStop(0.5, \`hsla(\${sparkleHue}, 100%, 70%, 0.4)\`);
    sparkleGradient.addColorStop(1, \`hsla(\${sparkleHue}, 100%, 50%, 0)\`);
    
    ctx.fillStyle = sparkleGradient;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};