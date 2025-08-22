export default {
    name: "Cosmic Playground",
    description: "Playful planets and stars dancing in a colorful cosmic playground",
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

const planets = [];
const stars = [];
const comets = [];
let time = 0;

// Create playful planets
for (let i = 0; i < 6; i++) {
    planets.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20 + Math.random() * 40,
        orbitRadius: 50 + Math.random() * 150,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: 0.005 + Math.random() * 0.01,
        rotation: 0,
        rotationSpeed: 0.02 + Math.random() * 0.03,
        hue: Math.random() * 360,
        centerX: Math.random() * canvas.width,
        centerY: Math.random() * canvas.height,
        bounce: Math.random() * Math.PI * 2,
        pattern: Math.floor(Math.random() * 4) // Different planet patterns
    });
}

// Create twinkling stars
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 3,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.05 + Math.random() * 0.05,
        hue: Math.random() * 360,
        brightness: 0.5 + Math.random() * 0.5
    });
}

// Create playful comets
for (let i = 0; i < 3; i++) {
    comets.push({
        x: -50,
        y: Math.random() * canvas.height,
        vx: 2 + Math.random() * 3,
        vy: (Math.random() - 0.5) * 1,
        size: 5 + Math.random() * 10,
        hue: Math.random() * 360,
        trail: [],
        reset: false
    });
}

function drawPlanet(planet) {
    ctx.save();
    ctx.translate(planet.x, planet.y);
    ctx.rotate(planet.rotation);
    
    // Planet glow
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, planet.size * 2);
    glowGradient.addColorStop(0, \`hsla(\${planet.hue}, 80%, 60%, 0.3)\`);
    glowGradient.addColorStop(1, \`hsla(\${planet.hue}, 70%, 50%, 0)\`);
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, planet.size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Main planet body
    const planetGradient = ctx.createRadialGradient(
        -planet.size * 0.3, -planet.size * 0.3, 0,
        0, 0, planet.size
    );
    planetGradient.addColorStop(0, \`hsla(\${planet.hue + 20}, 80%, 80%, 1)\`);
    planetGradient.addColorStop(0.7, \`hsla(\${planet.hue}, 70%, 60%, 1)\`);
    planetGradient.addColorStop(1, \`hsla(\${planet.hue - 20}, 60%, 40%, 1)\`);
    
    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(0, 0, planet.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Planet patterns
    ctx.fillStyle = \`hsla(\${planet.hue + 40}, 60%, 70%, 0.6)\`;
    
    if (planet.pattern === 0) {
        // Spots pattern
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i;
            const spotX = Math.cos(angle) * planet.size * 0.4;
            const spotY = Math.sin(angle) * planet.size * 0.4;
            ctx.beginPath();
            ctx.arc(spotX, spotY, planet.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (planet.pattern === 1) {
        // Stripes pattern
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-planet.size, -planet.size * 0.8 + i * planet.size * 0.6, planet.size * 2, planet.size * 0.2);
        }
    } else if (planet.pattern === 2) {
        // Ring pattern
        ctx.strokeStyle = \`hsla(\${planet.hue + 60}, 70%, 70%, 0.8)\`;
        ctx.lineWidth = planet.size * 0.1;
        ctx.beginPath();
        ctx.arc(0, 0, planet.size * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    } else if (planet.pattern === 3) {
        // Swirl pattern
        ctx.strokeStyle = \`hsla(\${planet.hue + 40}, 70%, 70%, 0.7)\`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.1) {
            const r = (planet.size * 0.7) * (a / (Math.PI * 4));
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (a === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Planet highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-planet.size * 0.3, -planet.size * 0.3, planet.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawStar(star) {
    const twinkleIntensity = Math.sin(star.twinkle) * 0.5 + 0.5;
    const starSize = star.size * (0.5 + twinkleIntensity * 0.5);
    
    // Star glow
    const starGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, starSize * 3);
    starGradient.addColorStop(0, \`hsla(\${star.hue}, 80%, 80%, \${star.brightness * twinkleIntensity})\`);
    starGradient.addColorStop(1, \`hsla(\${star.hue}, 70%, 60%, 0)\`);
    
    ctx.fillStyle = starGradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, starSize * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Star core
    ctx.fillStyle = \`hsla(\${star.hue}, 90%, 90%, \${star.brightness * twinkleIntensity})\`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, starSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Star rays
    if (twinkleIntensity > 0.7) {
        ctx.strokeStyle = \`hsla(\${star.hue}, 80%, 80%, \${(twinkleIntensity - 0.7) * 2})\`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const rayLength = starSize * 4;
            ctx.beginPath();
            ctx.moveTo(star.x + Math.cos(angle) * starSize, star.y + Math.sin(angle) * starSize);
            ctx.lineTo(star.x + Math.cos(angle) * rayLength, star.y + Math.sin(angle) * rayLength);
            ctx.stroke();
        }
    }
}

function drawComet(comet) {
    // Draw trail
    comet.trail.forEach((point, index) => {
        const opacity = (index / comet.trail.length) * 0.8;
        ctx.fillStyle = \`hsla(\${comet.hue}, 70%, 70%, \${opacity})\`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, comet.size * (index / comet.trail.length), 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Comet head glow
    const cometGradient = ctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, comet.size * 2);
    cometGradient.addColorStop(0, \`hsla(\${comet.hue}, 90%, 80%, 0.9)\`);
    cometGradient.addColorStop(1, \`hsla(\${comet.hue}, 80%, 60%, 0)\`);
    
    ctx.fillStyle = cometGradient;
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, comet.size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Comet head
    ctx.fillStyle = \`hsla(\${comet.hue}, 100%, 90%, 1)\`;
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
    ctx.fill();
}

function animate() {
    // Deep space gradient
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw stars
    stars.forEach(star => {
        star.twinkle += star.twinkleSpeed;
        star.hue = (star.hue + 0.1) % 360; // Slowly cycle colors
        drawStar(star);
    });
    
    // Update and draw planets
    planets.forEach(planet => {
        planet.orbitAngle += planet.orbitSpeed;
        planet.rotation += planet.rotationSpeed;
        planet.bounce += 0.02;
        
        // Orbital motion with playful bounce
        planet.x = planet.centerX + Math.cos(planet.orbitAngle) * planet.orbitRadius;
        planet.y = planet.centerY + Math.sin(planet.orbitAngle) * planet.orbitRadius * 0.6 + Math.sin(planet.bounce) * 10;
        
        // Color cycling
        planet.hue = (planet.hue + 0.2) % 360;
        
        // Keep planet centers on screen
        if (planet.centerX < 0 || planet.centerX > canvas.width) {
            planet.centerX = Math.random() * canvas.width;
        }
        if (planet.centerY < 0 || planet.centerY > canvas.height) {
            planet.centerY = Math.random() * canvas.height;
        }
        
        drawPlanet(planet);
    });
    
    // Update and draw comets
    comets.forEach(comet => {
        comet.x += comet.vx;
        comet.y += comet.vy;
        
        // Add to trail
        comet.trail.push({ x: comet.x, y: comet.y });
        if (comet.trail.length > 20) {
            comet.trail.shift();
        }
        
        // Reset comet when it goes off screen
        if (comet.x > canvas.width + 50) {
            comet.x = -50;
            comet.y = Math.random() * canvas.height;
            comet.vx = 2 + Math.random() * 3;
            comet.vy = (Math.random() - 0.5) * 1;
            comet.hue = Math.random() * 360;
            comet.trail = [];
        }
        
        drawComet(comet);
    });
    
    // Add sparkly space dust
    for (let i = 0; i < 15; i++) {
        const dustX = (time * 0.1 + i * 50) % (canvas.width + 100) - 50;
        const dustY = canvas.height * 0.2 + Math.sin(time * 0.005 + i * 0.5) * 200;
        const dustSize = 0.5 + Math.sin(time * 0.02 + i) * 0.5;
        const dustHue = (time + i * 30) % 360;
        
        ctx.fillStyle = \`hsla(\${dustHue}, 70%, 80%, 0.4)\`;
        ctx.beginPath();
        ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    time++;
    requestAnimationFrame(animate);
}
animate();`
};