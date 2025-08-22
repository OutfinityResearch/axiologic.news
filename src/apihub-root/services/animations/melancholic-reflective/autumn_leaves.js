export default {
    name: "Autumn Leaves",
    description: "Falling autumn leaves with seasonal colors",
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
const leaves = [];

// Create falling leaves
for(let i = 0; i < 40; i++) {
  leaves.push({
    x: Math.random() * canvas.width * 1.5 - canvas.width * 0.25,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 20 + 15,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
    fallSpeed: Math.random() * 1.5 + 0.5,
    swaySpeed: Math.random() * 0.02 + 0.01,
    swayAmount: Math.random() * 50 + 20,
    hue: Math.random() * 60 - 10, // Orange to red range
    type: Math.floor(Math.random() * 3) // Different leaf shapes
  });
}

function drawLeaf(x, y, size, rotation, hue, type) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  // Choose color based on hue
  const gradient = ctx.createLinearGradient(-size, -size, size, size);
  gradient.addColorStop(0, \`hsla(\${hue}, 70%, 50%, 0.8)\`);
  gradient.addColorStop(0.5, \`hsla(\${hue + 20}, 60%, 45%, 0.8)\`);
  gradient.addColorStop(1, \`hsla(\${hue + 40}, 50%, 40%, 0.8)\`);
  ctx.fillStyle = gradient;
  
  ctx.beginPath();
  
  if(type === 0) {
    // Maple leaf shape
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.5, -size, 0, -size * 0.5, size * 0.5);
    ctx.bezierCurveTo(-size * 0.3, size * 0.7, 0, size, 0, size);
    ctx.bezierCurveTo(0, size, size * 0.3, size * 0.7, size * 0.5, size * 0.5);
    ctx.bezierCurveTo(size, 0, size * 0.5, -size * 0.5, 0, -size);
  } else if(type === 1) {
    // Oak leaf shape
    ctx.ellipse(0, 0, size * 0.6, size, 0, 0, Math.PI * 2);
  } else {
    // Simple oval leaf
    ctx.ellipse(0, 0, size * 0.5, size, 0, 0, Math.PI * 2);
  }
  
  ctx.fill();
  
  // Add leaf vein
  ctx.strokeStyle = \`hsla(\${hue}, 50%, 30%, 0.5)\`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.stroke();
  
  ctx.restore();
}

function animate() {
  // Autumn sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(180, 140, 100, 0.95)');
  gradient.addColorStop(0.5, 'rgba(200, 160, 120, 0.95)');
  gradient.addColorStop(1, 'rgba(150, 120, 90, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Update and draw leaves
  leaves.forEach(leaf => {
    // Update position
    leaf.y += leaf.fallSpeed;
    leaf.x += Math.sin(time * leaf.swaySpeed) * leaf.swayAmount * 0.02;
    leaf.rotation += leaf.rotationSpeed;
    
    // Reset leaf if it falls off screen
    if(leaf.y > canvas.height + leaf.size) {
      leaf.y = -leaf.size * 2;
      leaf.x = Math.random() * canvas.width * 1.5 - canvas.width * 0.25;
      leaf.rotation = Math.random() * Math.PI * 2;
    }
    
    // Draw leaf
    drawLeaf(leaf.x, leaf.y, leaf.size, leaf.rotation, leaf.hue, leaf.type);
  });
  
  // Add ground leaves effect
  const groundGradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
  groundGradient.addColorStop(0, 'rgba(139, 69, 19, 0)');
  groundGradient.addColorStop(0.5, 'rgba(139, 69, 19, 0.3)');
  groundGradient.addColorStop(1, 'rgba(110, 50, 10, 0.5)');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
  
  // Add some stationary ground leaves
  for(let i = 0; i < 10; i++) {
    const x = (Math.sin(i * 1.5 + time * 0.001) + 1) * 0.5 * canvas.width;
    const y = canvas.height - Math.random() * 50 - 20;
    const size = 15 + Math.random() * 10;
    const rotation = Math.random() * Math.PI * 2;
    const hue = Math.random() * 60 - 10;
    
    ctx.globalAlpha = 0.6;
    drawLeaf(x, y, size, rotation, hue, Math.floor(Math.random() * 3));
    ctx.globalAlpha = 1;
  }
  
  // Atmospheric overlay
  const overlayGradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2
  );
  overlayGradient.addColorStop(0, 'rgba(180, 140, 100, 0)');
  overlayGradient.addColorStop(1, 'rgba(100, 70, 40, 0.2)');
  ctx.fillStyle = overlayGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};