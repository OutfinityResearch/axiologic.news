export default {
    name: "Rainy Window",
    description: "Raindrops racing down a window while watching the world through tears",
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
const staticDrops = [];
let time = 0;

// Create racing raindrops
for (let i = 0; i < 15; i++) {
    raindrops.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * 200,
        length: 20 + Math.random() * 40,
        speed: 2 + Math.random() * 3,
        width: 3 + Math.random() * 4,
        opacity: 0.6 + Math.random() * 0.4
    });
}

// Create static water drops on glass
for (let i = 0; i < 25; i++) {
    staticDrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 5 + Math.random() * 15,
        opacity: 0.3 + Math.random() * 0.3,
        shimmer: Math.random() * Math.PI * 2
    });
}

function drawWindowFrame() {
    // Window frame
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.8)';
    ctx.lineWidth = 20;
    ctx.strokeRect(canvas.width * 0.1, canvas.height * 0.15, canvas.width * 0.8, canvas.height * 0.7);
    
    // Cross frame
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.5, canvas.height * 0.15);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.85);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.1, canvas.height * 0.5);
    ctx.lineTo(canvas.width * 0.9, canvas.height * 0.5);
    ctx.stroke();
}

function drawBlurryOutside() {
    // Blurry outdoor scene
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(100, 120, 140, 0.3)');
    gradient.addColorStop(0.4, 'rgba(80, 100, 120, 0.4)');
    gradient.addColorStop(1, 'rgba(60, 80, 100, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.15, canvas.width * 0.8, canvas.height * 0.7);
    
    // Blurry tree shapes
    ctx.fillStyle = 'rgba(40, 60, 40, 0.3)';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.3, canvas.height * 0.6, 50, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.7, canvas.height * 0.7, 40, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Blurry street light
    ctx.fillStyle = 'rgba(255, 248, 220, 0.2)';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.6, canvas.height * 0.4, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Light glow
    const lightGradient = ctx.createRadialGradient(
        canvas.width * 0.6, canvas.height * 0.4, 0,
        canvas.width * 0.6, canvas.height * 0.4, 40
    );
    lightGradient.addColorStop(0, 'rgba(255, 248, 220, 0.15)');
    lightGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.15, canvas.width * 0.8, canvas.height * 0.7);
}

function drawGlassEffect() {
    // Glass reflection
    const reflection = ctx.createLinearGradient(0, 0, canvas.width, 0);
    reflection.addColorStop(0, 'rgba(200, 220, 240, 0.05)');
    reflection.addColorStop(0.3, 'rgba(200, 220, 240, 0.15)');
    reflection.addColorStop(0.7, 'rgba(200, 220, 240, 0.05)');
    reflection.addColorStop(1, 'rgba(200, 220, 240, 0.1)');
    ctx.fillStyle = reflection;
    ctx.fillRect(canvas.width * 0.1, canvas.height * 0.15, canvas.width * 0.8, canvas.height * 0.7);
}

function animate() {
    // Dark, moody background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#2c3e50');
    bgGradient.addColorStop(0.5, '#34495e');
    bgGradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw blurry outside scene
    drawBlurryOutside();
    
    // Draw glass effect
    drawGlassEffect();
    
    // Update and draw racing raindrops
    raindrops.forEach(drop => {
        drop.y += drop.speed;
        
        if (drop.y > canvas.height + drop.length) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
        }
        
        // Only draw drops within window area
        if (drop.x > canvas.width * 0.1 && drop.x < canvas.width * 0.9 &&
            drop.y > canvas.height * 0.15 && drop.y < canvas.height * 0.85) {
            
            const gradient = ctx.createLinearGradient(drop.x, drop.y - drop.length, drop.x, drop.y);
            gradient.addColorStop(0, \`rgba(180, 200, 220, 0)\`);
            gradient.addColorStop(0.3, \`rgba(180, 200, 220, \${drop.opacity * 0.5})\`);
            gradient.addColorStop(1, \`rgba(180, 200, 220, \${drop.opacity})\`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = drop.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y - drop.length);
            ctx.lineTo(drop.x, drop.y);
            ctx.stroke();
        }
    });
    
    // Draw static water drops
    staticDrops.forEach(drop => {
        drop.shimmer += 0.02;
        const shimmerEffect = Math.sin(drop.shimmer) * 0.3 + 0.7;
        
        if (drop.x > canvas.width * 0.1 && drop.x < canvas.width * 0.9 &&
            drop.y > canvas.height * 0.15 && drop.y < canvas.height * 0.85) {
            
            const dropGradient = ctx.createRadialGradient(
                drop.x - drop.size * 0.3, drop.y - drop.size * 0.3, 0,
                drop.x, drop.y, drop.size
            );
            dropGradient.addColorStop(0, \`rgba(220, 230, 240, \${drop.opacity * shimmerEffect})\`);
            dropGradient.addColorStop(0.7, \`rgba(180, 200, 220, \${drop.opacity * 0.5})\`);
            dropGradient.addColorStop(1, \`rgba(140, 160, 180, \${drop.opacity * 0.2})\`);
            
            ctx.fillStyle = dropGradient;
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = \`rgba(255, 255, 255, \${drop.opacity * shimmerEffect * 0.3})\`;
            ctx.beginPath();
            ctx.arc(drop.x - drop.size * 0.4, drop.y - drop.size * 0.4, drop.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw window frame last
    drawWindowFrame();
    
    // Add emotional vignette
    const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};