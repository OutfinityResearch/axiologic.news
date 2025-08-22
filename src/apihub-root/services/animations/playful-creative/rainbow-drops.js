export default {
    name: "Rainbow Drops",
    description: "Colorful water drops creating ripples of pure joy and positivity",
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

const drops = [];
const ripples = [];
let time = 0;

function createDrop() {
    return {
        x: Math.random() * canvas.width,
        y: -20,
        size: 3 + Math.random() * 8,
        speed: 2 + Math.random() * 4,
        hue: Math.random() * 360,
        opacity: 0.7 + Math.random() * 0.3,
        wobble: Math.random() * Math.PI * 2
    };
}

function createRipple(x, y, hue) {
    ripples.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: 30 + Math.random() * 50,
        hue: hue,
        opacity: 0.8,
        speed: 1 + Math.random() * 0.5
    });
}

// Initialize drops
for (let i = 0; i < 12; i++) {
    drops.push(createDrop());
}

function drawDrop(drop) {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(2, 2, drop.size * 0.8, drop.size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main drop with gradient
    const dropGradient = ctx.createRadialGradient(
        -drop.size * 0.3, -drop.size * 0.3, 0,
        0, 0, drop.size
    );
    dropGradient.addColorStop(0, \`hsla(\${drop.hue}, 80%, 80%, \${drop.opacity})\`);
    dropGradient.addColorStop(0.4, \`hsla(\${drop.hue}, 70%, 60%, \${drop.opacity * 0.8})\`);
    dropGradient.addColorStop(1, \`hsla(\${drop.hue}, 60%, 40%, \${drop.opacity * 0.6})\`);
    
    ctx.fillStyle = dropGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, drop.size * 0.7, drop.size, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = \`hsla(\${drop.hue}, 50%, 90%, \${drop.opacity * 0.6})\`;
    ctx.beginPath();
    ctx.ellipse(-drop.size * 0.4, -drop.size * 0.4, drop.size * 0.3, drop.size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawRipple(ripple) {
    const progress = ripple.radius / ripple.maxRadius;
    const currentOpacity = ripple.opacity * (1 - progress);
    
    if (currentOpacity > 0.05) {
        // Outer ripple
        ctx.strokeStyle = \`hsla(\${ripple.hue}, 70%, 60%, \${currentOpacity})\`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ripple
        ctx.strokeStyle = \`hsla(\${ripple.hue}, 80%, 80%, \${currentOpacity * 0.7})\`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sparkle effect at ripple edge
        if (progress > 0.3) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const sparkX = ripple.x + Math.cos(angle) * ripple.radius;
                const sparkY = ripple.y + Math.sin(angle) * ripple.radius;
                
                ctx.fillStyle = \`hsla(\${ripple.hue + 30}, 90%, 80%, \${currentOpacity * 0.5})\`;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function animate() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e6f3ff');
    gradient.addColorStop(0.5, '#b3d9ff');
    gradient.addColorStop(1, '#80bfff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Water surface
    const waterGradient = ctx.createLinearGradient(0, canvas.height * 0.8, 0, canvas.height);
    waterGradient.addColorStop(0, 'rgba(64, 164, 223, 0.3)');
    waterGradient.addColorStop(1, 'rgba(32, 132, 192, 0.5)');
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);
    
    // Update and draw drops
    drops.forEach((drop, index) => {
        drop.y += drop.speed;
        drop.wobble += 0.1;
        drop.x += Math.sin(drop.wobble) * 0.5;
        
        // Change color slightly over time for rainbow effect
        drop.hue = (drop.hue + 0.5) % 360;
        
        if (drop.y > canvas.height * 0.8) {
            // Drop hits water surface
            createRipple(drop.x, canvas.height * 0.8, drop.hue);
            
            // Reset drop
            drops[index] = createDrop();
        }
        
        drawDrop(drop);
    });
    
    // Update and draw ripples
    ripples.forEach((ripple, index) => {
        ripple.radius += ripple.speed;
        
        if (ripple.radius >= ripple.maxRadius) {
            ripples.splice(index, 1);
        } else {
            drawRipple(ripple);
        }
    });
    
    // Add floating rainbow particles
    for (let i = 0; i < 20; i++) {
        const particleX = (time * 0.3 + i * 40) % (canvas.width + 80) - 40;
        const particleY = canvas.height * 0.3 + Math.sin(time * 0.02 + i * 0.5) * 150;
        const particleSize = 1 + Math.sin(time * 0.05 + i) * 1;
        const hue = (time * 3 + i * 18) % 360;
        
        ctx.fillStyle = \`hsla(\${hue}, 80%, 70%, 0.6)\`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle glow
        ctx.fillStyle = \`hsla(\${hue}, 90%, 80%, 0.2)\`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize * 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Water surface reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 5) {
        const waveHeight = Math.sin(time * 0.01 + x * 0.01) * 3;
        if (x === 0) {
            ctx.moveTo(x, canvas.height * 0.8 + waveHeight);
        } else {
            ctx.lineTo(x, canvas.height * 0.8 + waveHeight);
        }
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Occasionally create random drops for variety
    if (Math.random() < 0.02) {
        drops.push(createDrop());
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};