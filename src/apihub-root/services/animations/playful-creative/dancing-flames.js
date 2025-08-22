export default {
    name: "Dancing Flames",
    description: "Colorful flames dancing with life and creative energy",
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

const flames = [];
const sparks = [];
let time = 0;

// Create flame segments
for (let i = 0; i < 5; i++) {
    flames.push({
        baseX: canvas.width * (0.15 + i * 0.15),
        baseY: canvas.height * 0.9,
        segments: [],
        hue: i * 60 + 30, // Different colors for each flame
        intensity: 0.8 + Math.random() * 0.4,
        sway: Math.random() * Math.PI * 2
    });
    
    // Create segments for each flame
    for (let j = 0; j < 12; j++) {
        flames[i].segments.push({
            x: 0,
            y: j * -15,
            width: Math.max(2, 20 - j * 1.5),
            height: 15,
            wobble: Math.random() * Math.PI * 2,
            opacity: 1 - j * 0.08
        });
    }
}

// Create sparks
for (let i = 0; i < 30; i++) {
    sparks.push({
        x: Math.random() * canvas.width,
        y: canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        size: 1 + Math.random() * 3,
        life: 1,
        hue: Math.random() * 360,
        decay: 0.01 + Math.random() * 0.02
    });
}

function drawFlame(flame) {
    ctx.save();
    ctx.translate(flame.baseX, flame.baseY);
    
    flame.sway += 0.02;
    const swayOffset = Math.sin(flame.sway) * 10;
    
    flame.segments.forEach((segment, index) => {
        segment.wobble += 0.1 + index * 0.01;
        
        const wobbleX = Math.sin(segment.wobble) * (5 + index * 0.5);
        const wobbleY = Math.cos(segment.wobble * 0.8) * 2;
        
        const segmentX = segment.x + wobbleX + swayOffset * (index / 12);
        const segmentY = segment.y + wobbleY;
        
        // Main flame body
        const flameGradient = ctx.createRadialGradient(
            segmentX, segmentY, 0,
            segmentX, segmentY, segment.width
        );
        
        const baseHue = flame.hue + Math.sin(time * 0.05 + index) * 30;
        flameGradient.addColorStop(0, \`hsla(\${baseHue + 20}, 100%, 80%, \${segment.opacity * flame.intensity})\`);
        flameGradient.addColorStop(0.4, \`hsla(\${baseHue}, 90%, 60%, \${segment.opacity * flame.intensity * 0.8})\`);
        flameGradient.addColorStop(0.8, \`hsla(\${baseHue - 20}, 80%, 40%, \${segment.opacity * flame.intensity * 0.6})\`);
        flameGradient.addColorStop(1, \`hsla(\${baseHue - 40}, 70%, 20%, \${segment.opacity * flame.intensity * 0.3})\`);
        
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.ellipse(
            segmentX, segmentY,
            segment.width, segment.height,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Flame core (brighter center)
        if (index < 8) {
            const coreGradient = ctx.createRadialGradient(
                segmentX, segmentY, 0,
                segmentX, segmentY, segment.width * 0.5
            );
            coreGradient.addColorStop(0, \`hsla(\${baseHue + 40}, 100%, 90%, \${segment.opacity * 0.6})\`);
            coreGradient.addColorStop(1, \`hsla(\${baseHue + 20}, 90%, 70%, 0)\`);
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.ellipse(
                segmentX, segmentY,
                segment.width * 0.5, segment.height * 0.8,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        }
    });
    
    ctx.restore();
}

function updateSparks() {
    sparks.forEach((spark, index) => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.05; // gravity
        spark.life -= spark.decay;
        
        // Spark interaction with flames
        flames.forEach(flame => {
            const distance = Math.sqrt(
                Math.pow(spark.x - flame.baseX, 2) + 
                Math.pow(spark.y - flame.baseY, 2)
            );
            if (distance < 50 && spark.y > flame.baseY - 100) {
                spark.vy -= 0.1; // lift from flame
                spark.hue = (spark.hue + 2) % 360; // color change
            }
        });
        
        if (spark.life <= 0 || spark.y > canvas.height + 50) {
            // Respawn spark
            sparks[index] = {
                x: Math.random() * canvas.width,
                y: canvas.height + Math.random() * 50,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                size: 1 + Math.random() * 3,
                life: 1,
                hue: Math.random() * 360,
                decay: 0.01 + Math.random() * 0.02
            };
        }
    });
}

function drawSparks() {
    sparks.forEach(spark => {
        if (spark.life > 0) {
            const sparkGradient = ctx.createRadialGradient(
                spark.x, spark.y, 0,
                spark.x, spark.y, spark.size * 3
            );
            sparkGradient.addColorStop(0, \`hsla(\${spark.hue}, 100%, 80%, \${spark.life * 0.8})\`);
            sparkGradient.addColorStop(0.5, \`hsla(\${spark.hue}, 90%, 60%, \${spark.life * 0.4})\`);
            sparkGradient.addColorStop(1, \`hsla(\${spark.hue}, 80%, 40%, 0)\`);
            
            ctx.fillStyle = sparkGradient;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Bright spark center
            ctx.fillStyle = \`hsla(\${spark.hue}, 100%, 90%, \${spark.life})\`;
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function animate() {
    // Dark background to make flames pop
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground glow from flames
    const glowGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
    glowGradient.addColorStop(0, 'rgba(255, 100, 50, 0.1)');
    glowGradient.addColorStop(1, 'rgba(255, 150, 100, 0.3)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Update flame intensities
    flames.forEach(flame => {
        flame.intensity = 0.6 + Math.sin(time * 0.03 + flame.baseX * 0.01) * 0.3;
        flame.hue = (flame.hue + 0.2) % 360; // Slowly cycle through colors
    });
    
    // Draw flames
    flames.forEach(drawFlame);
    
    // Update and draw sparks
    updateSparks();
    drawSparks();
    
    // Add ambient light rays
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i + time * 0.01;
        const startX = canvas.width / 2;
        const startY = canvas.height / 2;
        const length = 200 + Math.sin(time * 0.02 + i) * 50;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + Math.cos(angle) * length,
            startY + Math.sin(angle) * length
        );
        ctx.stroke();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};