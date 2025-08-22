export default {
    name: "Morning Mist",
    description: "Gentle mist flowing across a peaceful morning landscape",
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

const mistLayers = [];
for (let i = 0; i < 4; i++) {
    mistLayers.push({
        offset: Math.random() * Math.PI * 2,
        speed: 0.0003 + Math.random() * 0.0002,
        amplitude: 30 + Math.random() * 20,
        opacity: 0.08 - i * 0.015
    });
}

let time = 0;

function animate() {
    // Soft gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#E6F3FF');
    gradient.addColorStop(0.5, '#F0F8FF');
    gradient.addColorStop(1, '#FAFAFA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw soft sun glow
    const sunX = canvas.width * 0.7;
    const sunY = canvas.height * 0.3;
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 200);
    sunGradient.addColorStop(0, 'rgba(255, 246, 143, 0.3)');
    sunGradient.addColorStop(0.5, 'rgba(255, 246, 143, 0.1)');
    sunGradient.addColorStop(1, 'rgba(255, 246, 143, 0)');
    ctx.fillStyle = sunGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw mist layers
    mistLayers.forEach((layer, index) => {
        ctx.fillStyle = \`rgba(255, 255, 255, \${layer.opacity})\`;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        for (let x = 0; x <= canvas.width; x += 5) {
            const y = canvas.height * 0.6 + 
                      Math.sin(x * 0.002 + time * layer.speed + layer.offset) * layer.amplitude +
                      Math.cos(x * 0.003 + time * layer.speed * 1.5) * (layer.amplitude * 0.5) -
                      index * 40;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
    });
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};