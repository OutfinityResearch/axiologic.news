export default {
    name: "Old Diary",
    description: "Pages of an old diary turning in the wind, memories scattered like leaves",
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

const pages = [];
const ink = [];
let time = 0;
let windForce = 0;

// Create floating pages
for (let i = 0; i < 8; i++) {
    pages.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        size: 0.8 + Math.random() * 0.4,
        opacity: 0.6 + Math.random() * 0.3,
        drift: {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.2
        },
        flutter: Math.random() * Math.PI * 2
    });
}

// Create ink spots/stains
for (let i = 0; i < 15; i++) {
    ink.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 5 + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.2,
        color: Math.random() > 0.5 ? [0, 0, 50] : [50, 30, 0],
        spread: Math.random() * Math.PI * 2
    });
}

function drawPage(x, y, rotation, size, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(size, size);
    
    // Page shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(5, 5, 80, 110);
    
    // Page background
    const pageGradient = ctx.createLinearGradient(0, 0, 80, 110);
    pageGradient.addColorStop(0, \`rgba(255, 248, 220, \${opacity})\`);
    pageGradient.addColorStop(0.5, \`rgba(250, 240, 200, \${opacity * 0.9})\`);
    pageGradient.addColorStop(1, \`rgba(240, 230, 180, \${opacity * 0.8})\`);
    ctx.fillStyle = pageGradient;
    ctx.fillRect(0, 0, 80, 110);
    
    // Page edge wear
    ctx.strokeStyle = \`rgba(200, 180, 140, \${opacity * 0.5})\`;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 80, 110);
    
    // Ruled lines
    ctx.strokeStyle = \`rgba(180, 160, 120, \${opacity * 0.3})\`;
    ctx.lineWidth = 0.5;
    for (let i = 15; i < 100; i += 8) {
        ctx.beginPath();
        ctx.moveTo(5, i);
        ctx.lineTo(75, i);
        ctx.stroke();
    }
    
    // Margin line
    ctx.strokeStyle = \`rgba(220, 100, 100, \${opacity * 0.4})\`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(15, 10);
    ctx.lineTo(15, 100);
    ctx.stroke();
    
    // Faded handwriting
    ctx.fillStyle = \`rgba(40, 40, 80, \${opacity * 0.4})\`;
    ctx.font = '6px serif';
    const lines = [
        'Dear diary...',
        'Today I remembered',
        'the way things used',
        'to be...',
        '',
        'I miss those days',
        'when everything',
        'seemed possible.',
        '',
        'The world felt',
        'different then...'
    ];
    
    lines.forEach((line, index) => {
        ctx.fillText(line, 18, 20 + index * 8);
    });
    
    // Tear stains
    for (let i = 0; i < 3; i++) {
        const tearX = 20 + Math.random() * 40;
        const tearY = 30 + Math.random() * 60;
        const tearSize = 3 + Math.random() * 5;
        
        ctx.fillStyle = \`rgba(180, 200, 220, \${opacity * 0.2})\`;
        ctx.beginPath();
        ctx.arc(tearX, tearY, tearSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

function drawDiary() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.7;
    
    // Diary shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(centerX - 62, centerY + 8, 124, 84);
    
    // Diary cover
    const coverGradient = ctx.createLinearGradient(centerX - 60, centerY, centerX + 60, centerY + 80);
    coverGradient.addColorStop(0, 'rgba(101, 67, 33, 0.9)');
    coverGradient.addColorStop(0.5, 'rgba(139, 115, 85, 0.8)');
    coverGradient.addColorStop(1, 'rgba(101, 67, 33, 0.9)');
    ctx.fillStyle = coverGradient;
    ctx.fillRect(centerX - 60, centerY, 120, 80);
    
    // Diary binding
    ctx.fillStyle = 'rgba(80, 50, 20, 0.8)';
    ctx.fillRect(centerX - 5, centerY, 10, 80);
    
    // Diary title (embossed)
    ctx.fillStyle = 'rgba(180, 160, 120, 0.6)';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Memories', centerX, centerY + 25);
    
    // Wear marks
    ctx.strokeStyle = 'rgba(60, 40, 10, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - 50 + Math.random() * 100, centerY + 10 + Math.random() * 60);
        ctx.lineTo(centerX - 40 + Math.random() * 80, centerY + 20 + Math.random() * 40);
        ctx.stroke();
    }
}

function animate() {
    // Sepia-toned background
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.8
    );
    gradient.addColorStop(0, '#f4e4c1');
    gradient.addColorStop(0.5, '#e8d5b7');
    gradient.addColorStop(1, '#d4c4a8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update wind
    windForce = Math.sin(time * 0.003) * 0.5 + Math.sin(time * 0.007) * 0.3;
    
    // Draw ink stains first (background)
    ink.forEach(stain => {
        stain.spread += 0.01;
        const spreadEffect = Math.sin(stain.spread) * 2 + 3;
        
        ctx.fillStyle = \`rgba(\${stain.color[0]}, \${stain.color[1]}, \${stain.color[2]}, \${stain.opacity})\`;
        ctx.beginPath();
        ctx.ellipse(stain.x, stain.y, stain.size + spreadEffect, stain.size, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw the diary
    drawDiary();
    
    // Update and draw floating pages
    pages.forEach(page => {
        page.x += page.drift.x + windForce;
        page.y += page.drift.y;
        page.rotation += page.rotSpeed;
        page.flutter += 0.02;
        
        // Add flutter effect
        page.y += Math.sin(page.flutter) * 0.3;
        page.x += Math.cos(page.flutter * 0.7) * 0.2;
        
        // Wrap around screen
        if (page.x > canvas.width + 100) page.x = -100;
        if (page.x < -100) page.x = canvas.width + 100;
        if (page.y > canvas.height + 100) page.y = -100;
        if (page.y < -100) page.y = canvas.height + 100;
        
        drawPage(page.x, page.y, page.rotation, page.size, page.opacity);
    });
    
    // Add nostalgic lighting
    const light = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.2, 0,
        canvas.width * 0.8, canvas.height * 0.2, canvas.width * 0.5
    );
    light.addColorStop(0, 'rgba(255, 248, 220, 0.1)');
    light.addColorStop(0.5, 'rgba(255, 240, 200, 0.05)');
    light.addColorStop(1, 'rgba(255, 240, 200, 0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};