export default {
    name: "Plasma Energy",
    description: "Flowing plasma energy fields",
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
const imageData = ctx.createImageData(canvas.width, canvas.height);

function plasma(x, y, time) {
  const value = Math.sin(x / 32.0) +
                Math.sin(y / 16.0) +
                Math.sin((x + y) / 16.0) +
                Math.sin(Math.sqrt(x * x + y * y) / 8.0) +
                Math.sin(time);
  return Math.sin(value * Math.PI) * 0.5 + 0.5;
}

function animate() {
  const data = imageData.data;
  
  for(let y = 0; y < canvas.height; y += 2) {
    for(let x = 0; x < canvas.width; x += 2) {
      const value = plasma(x, y, time * 0.1);
      
      // Create RGB values based on plasma
      const r = Math.floor(Math.sin(value * Math.PI) * 127 + 128);
      const g = Math.floor(Math.sin(value * Math.PI + 2 * Math.PI / 3) * 127 + 128);
      const b = Math.floor(Math.sin(value * Math.PI + 4 * Math.PI / 3) * 127 + 128);
      
      const index = (y * canvas.width + x) * 4;
      data[index] = r;     // Red
      data[index + 1] = g; // Green
      data[index + 2] = b; // Blue
      data[index + 3] = 255; // Alpha
      
      // Fill adjacent pixels for performance
      if(x + 1 < canvas.width) {
        const index2 = (y * canvas.width + x + 1) * 4;
        data[index2] = r;
        data[index2 + 1] = g;
        data[index2 + 2] = b;
        data[index2 + 3] = 255;
      }
      
      if(y + 1 < canvas.height) {
        const index3 = ((y + 1) * canvas.width + x) * 4;
        data[index3] = r;
        data[index3 + 1] = g;
        data[index3 + 2] = b;
        data[index3 + 3] = 255;
        
        if(x + 1 < canvas.width) {
          const index4 = ((y + 1) * canvas.width + x + 1) * 4;
          data[index4] = r;
          data[index4 + 1] = g;
          data[index4 + 2] = b;
          data[index4 + 3] = 255;
        }
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  time += 1;
  requestAnimationFrame(animate);
}
animate();`
};