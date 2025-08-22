export default {
    name: "Matrix Rain",
    description: "Matrix-style digital rain effect",
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


const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nums = '0123456789';
const chars = katakana + latin + nums;

const fontSize = 16;
const cols = Math.floor(canvas.width / fontSize);
const drops = [];

for(let i = 0; i < cols; i++) {
  drops[i] = Math.random() * -500;
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#00ff00';
  ctx.font = fontSize + 'px monospace';
  
  for(let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillStyle = Math.random() > 0.98 ? '#ffffff' : '#00ff00';
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    
    if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i] += Math.random() * 2 + 0.5;
  }
  
  requestAnimationFrame(animate);
}
animate();`
};