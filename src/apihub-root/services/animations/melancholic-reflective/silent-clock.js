export default {
    name: "Silent Clock",
    description: "A broken clock frozen in time, surrounded by the weight of passing moments",
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
const clockRadius = 80;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const dustMotes = [];
for (let i = 0; i < 30; i++) {
    dustMotes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.2,
        drift: Math.random() * Math.PI * 2,
        opacity: 0.2 + Math.random() * 0.3
    });
}

function drawClockFace() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Clock shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX + 5, centerY + 5, clockRadius + 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Clock face background
    const faceGradient = ctx.createRadialGradient(
        centerX - 20, centerY - 20, 0,
        centerX, centerY, clockRadius
    );
    faceGradient.addColorStop(0, 'rgba(250, 248, 240, 0.9)');
    faceGradient.addColorStop(0.7, 'rgba(240, 235, 220, 0.8)');
    faceGradient.addColorStop(1, 'rgba(220, 210, 190, 0.7)');
    ctx.fillStyle = faceGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Clock rim
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.8)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner rim
    ctx.strokeStyle = 'rgba(101, 67, 33, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius - 10, 0, Math.PI * 2);
    ctx.stroke();
    
    // Hour markers
    ctx.strokeStyle = 'rgba(80, 60, 40, 0.8)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
        const x1 = centerX + Math.cos(angle) * (clockRadius - 15);
        const y1 = centerY + Math.sin(angle) * (clockRadius - 15);
        const x2 = centerX + Math.cos(angle) * (clockRadius - 25);
        const y2 = centerY + Math.sin(angle) * (clockRadius - 25);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Numbers
    ctx.fillStyle = 'rgba(80, 60, 40, 0.8)';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 1; i <= 12; i++) {
        const angle = (Math.PI * 2 / 12) * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (clockRadius - 35);
        const y = centerY + Math.sin(angle) * (clockRadius - 35);
        ctx.fillText(i.toString(), x, y);
    }
    
    // Clock hands frozen at a melancholic time (around 3:17)
    const frozenHour = 3.28; // 3:17
    const frozenMinute = 17;
    
    // Hour hand
    const hourAngle = (Math.PI * 2 / 12) * frozenHour - Math.PI / 2;
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(hourAngle) * (clockRadius - 40),
        centerY + Math.sin(hourAngle) * (clockRadius - 40)
    );
    ctx.stroke();
    
    // Minute hand
    const minuteAngle = (Math.PI * 2 / 60) * frozenMinute - Math.PI / 2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + Math.cos(minuteAngle) * (clockRadius - 20),
        centerY + Math.sin(minuteAngle) * (clockRadius - 20)
    );
    ctx.stroke();
    
    // Center dot
    ctx.fillStyle = 'rgba(80, 60, 40, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Crack in the glass
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 30, centerY - 20);
    ctx.quadraticCurveTo(centerX - 10, centerY - 40, centerX + 20, centerY - 30);
    ctx.quadraticCurveTo(centerX + 40, centerY - 10, centerX + 35, centerY + 15);
    ctx.stroke();
    
    // Secondary crack
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY - 40);
    ctx.lineTo(centerX + 5, centerY - 50);
    ctx.stroke();
}

function animate() {
    // Dark, contemplative background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(0.4, '#34495e');
    gradient.addColorStop(0.8, '#2c3e50');
    gradient.addColorStop(1, '#1a252f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw dust motes
    dustMotes.forEach(mote => {
        mote.drift += 0.01;
        mote.x += Math.sin(mote.drift) * 0.3;
        mote.y += mote.speed;
        
        if (mote.y > canvas.height) {
            mote.y = 0;
            mote.x = Math.random() * canvas.width;
        }
        
        const flickerOpacity = mote.opacity + Math.sin(time * 0.05 + mote.x * 0.01) * 0.1;
        ctx.fillStyle = \`rgba(200, 180, 160, \${flickerOpacity})\`;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw the clock
    drawClockFace();
    
    // Add a dim light source
    const lightGradient = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.2, 0,
        canvas.width * 0.3, canvas.height * 0.2, canvas.width * 0.6
    );
    lightGradient.addColorStop(0, 'rgba(255, 248, 220, 0.08)');
    lightGradient.addColorStop(0.5, 'rgba(255, 248, 220, 0.04)');
    lightGradient.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pendulum stopped at bottom
    const pendulumX = canvas.width * 0.5;
    const pendulumY = canvas.height * 0.7;
    const pendulumLength = 60;
    
    // Pendulum rod
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pendulumX, pendulumY);
    ctx.lineTo(pendulumX, pendulumY + pendulumLength);
    ctx.stroke();
    
    // Pendulum weight
    ctx.fillStyle = 'rgba(101, 67, 33, 0.7)';
    ctx.beginPath();
    ctx.arc(pendulumX, pendulumY + pendulumLength, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Weight reflection
    ctx.fillStyle = 'rgba(180, 160, 120, 0.3)';
    ctx.beginPath();
    ctx.arc(pendulumX - 4, pendulumY + pendulumLength - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Weight shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(pendulumX, canvas.height - 20, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add melancholic vignette
    const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};