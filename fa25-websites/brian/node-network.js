
const canvas = document.getElementById("nodeBackground");
const ctx = canvas.getContext("2d");

let w, h, nodes = [];
const NODE_COUNT = 48;  
const MAX_DISTANCE = 160;
const mouse = { x: null, y: null };


function resizeCanvas() {
  canvas.width = w = window.innerWidth;
  canvas.height = h = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


function initNodes() {
  nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 2 + Math.random() * 3
    });
  }
}
initNodes();

window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function animate() {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];

    n.x += n.vx;
    n.y += n.vy;

    if (n.x < 0) n.x = w;
    if (n.x > w) n.x = 0;
    if (n.y < 0) n.y = h;
    if (n.y > h) n.y = 0;

    if (mouse.x !== null) {
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        n.x += dx * 0.02;
        n.y += dy * 0.02;
      }
    }

    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "white";
    ctx.fill();
  }

  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];

      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAX_DISTANCE) {
        const alpha = 1 - dist / MAX_DISTANCE;

        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

animate();
