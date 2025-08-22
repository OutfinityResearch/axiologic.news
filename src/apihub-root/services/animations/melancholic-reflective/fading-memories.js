export default {
    name: "Fading Memories",
    description: "Old photographs slowly fading in and out like distant memories",
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

const memories = [];
for (let i = 0; i < 8; i++) {
    memories.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 80 + Math.random() * 120,
        rotation: (Math.random() - 0.5) * 0.3,
        opacity: 0,
        fadeSpeed: 0.003 + Math.random() * 0.002,
        phase: Math.random() * Math.PI * 2,
        drift: {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.1
        }
    });
}

let time = 0;

function animate() {
    // Sepia-toned background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#3a3433');
    gradient.addColorStop(0.5, '#2e2625');
    gradient.addColorStop(1, '#1f1817');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw memories as fading photo frames
    memories.forEach(memory => {
        // Update opacity for fade in/out effect
        memory.opacity = Math.sin(time * memory.fadeSpeed + memory.phase) * 0.5 + 0.5;
        memory.opacity *= 0.6; // Keep overall opacity lower for melancholic mood
        
        // Gentle drift
        memory.x += memory.drift.x;
        memory.y += memory.drift.y;
        
        // Wrap around edges
        if (memory.x < -memory.size) memory.x = canvas.width + memory.size;
        if (memory.x > canvas.width + memory.size) memory.x = -memory.size;
        if (memory.y < -memory.size) memory.y = canvas.height + memory.size;
        if (memory.y > canvas.height + memory.size) memory.y = -memory.size;
        
        ctx.save();
        ctx.translate(memory.x, memory.y);
        ctx.rotate(memory.rotation);
        ctx.globalAlpha = memory.opacity;
        
        // Draw photo frame
        ctx.strokeStyle = '#8b7869';
        ctx.lineWidth = 3;
        ctx.strokeRect(-memory.size/2, -memory.size/2, memory.size, memory.size);
        
        // Inner photo area with sepia gradient
        const photoGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, memory.size/2);
        photoGradient.addColorStop(0, 'rgba(139, 120, 105, 0.3)');
        photoGradient.addColorStop(0.7, 'rgba(101, 87, 76, 0.2)');
        photoGradient.addColorStop(1, 'rgba(59, 51, 44, 0.1)');
        
        ctx.fillStyle = photoGradient;
        ctx.fillRect(-memory.size/2, -memory.size/2, memory.size, memory.size);
        
        // Add vintage texture lines
        ctx.strokeStyle = 'rgba(70, 60, 50, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = -memory.size/2 + (memory.size / 5) * i;
            ctx.beginPath();
            ctx.moveTo(-memory.size/2, y);
            ctx.lineTo(memory.size/2, y);
            ctx.stroke();
        }
        
        ctx.restore();
    });
    
    // Add film grain effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};