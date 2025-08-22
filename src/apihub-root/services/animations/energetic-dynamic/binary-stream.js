export default {
    name: "Binary Stream",
    description: "Streaming binary numbers",
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

const fontSize = 12;
const columns = Math.floor(canvas.width / fontSize);
const streams = [];

for (let i = 0; i < columns; i++) {
    streams.push({
        y: Math.random() * -100,
        speed: Math.random() * 4 + 2, // Faster for energy
        length: Math.floor(Math.random() * 20 + 10)
    });
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = fontSize + 'px monospace';
    
    streams.forEach((stream, i) => {
        for (let j = 0; j < stream.length; j++) {
            const y = stream.y - j * fontSize;
            if (y > 0 && y < canvas.height) {
                const opacity = 1 - (j / stream.length);
                ctx.fillStyle = \`rgba(100, 255, 100, \${opacity})\`;
                ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * fontSize, y);
            }
        }
        
        stream.y += stream.speed;
        if (stream.y - stream.length * fontSize > canvas.height) {
            stream.y = Math.random() * -100;
            stream.speed = Math.random() * 4 + 2;
            stream.length = Math.floor(Math.random() * 20 + 10);
        }
    });
    
    requestAnimationFrame(animate);
}
animate();`
};