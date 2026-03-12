let stage = 1;
let t = 0;
let showDNA = false;
let dnaAlpha = 0;
let originParticles = [];
let stars = [];
let starGroups = [];
let currentGroup;
let dnaRungs = [];
let draggedRung = null;
let pgCanvas; 

function setup() {
  pgCanvas = createCanvas(windowWidth * 0.5, windowHeight);
  pgCanvas.id('p5canvas');
  // position it on the right half
  pgCanvas.position(windowWidth * 0.5, 0);
  pgCanvas.style('z-index', '3'); // above nodeBackground but behind text left column?
  pgCanvas.style('display', 'block');

  textFont('Helvetica');
  textAlign(CENTER, CENTER);
  cursor(ARROW);

  currentGroup = { stars: [], locked: false, active: false, color: color(255) };

  setupOriginParticles();
  setupStars();
}

function setupOriginParticles() {
  originParticles = [];
  for (let i = 0; i < 12; i++) {
    originParticles.push({
      x: random(0.2, 0.8),
      y: random(0.2, 0.8),
      vx: random(-0.001, 0.001),
      vy: random(-0.001, 0.001),
      r: random(5, 10)
    });
  }
}

function setupStars() {
  stars = [];
  for (let i = 0; i < 25; i++) {
    stars.push({
      x: random(width * 0.15, width * 0.85),
      y: random(height * 0.2, height * 0.8),
      vx: 0,
      vy: 0
    });
  }
}

function draw() {
  background(0, 0); // use transparent background so nodeBackground can subtly show through
  clear();
  push();
  noStroke();
  fill(0, 180);
  rect(0, 0, width, height); // faint panel dim to contrast with text over it
  pop();

  t += 0.01;

  if (stage === 1) drawOriginAndGenetics();

  drawCRTScanlines();
}

function drawOriginAndGenetics() {
  let margin = width * 0.05;
  let gutter = width * 0.05;
  let panelW = (width - margin * 2 - gutter) / 2;
  let panelH = height - margin * 2;

  drawPanel(margin, margin, panelW, panelH, "01", "Origin of Life");
  drawOriginOfLife(margin, margin, panelW, panelH);

  drawPanel(margin + panelW + gutter, margin, panelW, panelH, "02", "Genetics");
  drawGenetics(margin + panelW + gutter, margin, panelW, panelH, panelH);

}

function drawPanel(x, y, w, h, num, title) {
  push();
  stroke(255, 100);
  noFill();
  rect(x, y, w, h);

  let headerH = h * 0.08;
  let sideW = w * 0.18;

  line(x, y + headerH, x + w, y + headerH);
  line(x + sideW, y, x + sideW, y + h);

  noStroke();
  fill(255);
  textSize(headerH * 0.6);
  text(num, x + sideW / 2, y + headerH / 2);

  textAlign(LEFT, CENTER);
  textSize(headerH * 0.45);
  textStyle(BOLD);
  text(title, x + sideW + 10, y + headerH / 2);
  pop();
}

function drawOriginOfLife(x, y, w, h) {
  push();
  let sideW = w * 0.18;
  let headerH = h * 0.08;
  translate(x + sideW, y + headerH);
  let boxW = w - sideW;
  let boxH = h - headerH;

  for (let p of originParticles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0.05 || p.x > 0.95) p.vx *= -1;
    if (p.y < 0.05 || p.y > 0.95) p.vy *= -1;
    p.vx += random(-0.0002, 0.0002);
    p.vy += random(-0.0002, 0.0002);
    p.vx = constrain(p.vx, -0.002, 0.002);
    p.vy = constrain(p.vy, -0.002, 0.002);
  }

  for (let i = 0; i < originParticles.length; i++) {
    let p = originParticles[i];
    for (let j = i + 1; j < originParticles.length; j++) {
      let q = originParticles[j];
      let d = dist(p.x, p.y, q.x, q.y);
      if (d < 0.12) {
        stroke(50 + sin(t * 5 + i) * 205, 200, 255, map(d, 0, 0.12, 255, 0));
        strokeWeight(map(d, 0, 0.12, 3.5, 1));
        let segments = 8;
        let prevX = p.x * boxW;
        let prevY = p.y * boxH;
        for (let k = 1; k <= segments; k++) {
          let lerpX = lerp(p.x, q.x, k / segments) * boxW + sin(t * 10 + k) * 2;
          let lerpY = lerp(p.y, q.y, k / segments) * boxH + cos(t * 10 + k) * 2;
          line(prevX, prevY, lerpX, lerpY);
          prevX = lerpX;
          prevY = lerpY;
        }
      }
    }
  }

  noStroke();
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(100, 200, 255, 150);
  for (let i = 0; i < originParticles.length; i++) {
    let p = originParticles[i];
    let pulse = sin(t * 2 + i) * 0.3 + 1;
    fill(255, 200);
    circle(p.x * boxW, p.y * boxH, p.r * pulse + noise(t + i) * 1.5);
  }
  drawingContext.shadowBlur = 0;

  let p = originParticles[0]; 
  fill(0, 255, 255, 120);
  textSize(12);
  text("DATA: X=" + nf(p.x,1,2) + " Y=" + nf(p.y,1,2), p.x * boxW + 20, p.y * boxH - 10);

  pop();
}

function drawGenetics(x, y, w, h, panelH) {
  push();
  let sideW = w * 0.18;
  let headerH = h * 0.08;
  translate(x + sideW, y + headerH);
  let dnaH = h * 0.75;
  let dnaW = w * 0.6;
  let rows = 28;
  let freq = 0.25;

  if (showDNA && dnaAlpha < 255) dnaAlpha += 4;

  if (dnaRungs.length === 0) {
    for (let i = 0; i < rows; i++) {
      let yRow = map(i, 0, rows - 1, 80, dnaH);
      let phase = t * 2 + i * freq;
      let wave = sin(phase) * 70;
      dnaRungs.push({
        x1: dnaW / 2 - wave,
        x2: dnaW / 2 + wave,
        y: yRow,
        baseX1: dnaW / 2 - wave,
        baseX2: dnaW / 2 + wave,
        baseY: yRow,
        originalX1: dnaW / 2 - wave,
        originalX2: dnaW / 2 + wave,
        originalY: yRow,
        trail: [],
        removed: false
      });
    }
  }

  let panelX = x + sideW;
  let panelY = y + headerH;
  let panelW = w - sideW;
  let panelH2 = h - headerH;

  let insidePanel = mouseX >= panelX && mouseX <= panelX + panelW &&
                    mouseY >= panelY && mouseY <= panelY + panelH2;

  for (let i = 0; i < dnaRungs.length; i++) {
    let r = dnaRungs[i];

    if (draggedRung !== r && !draggedRung && !r.removed) {
      let phase = t * 2 + i * freq;
      let wave = sin(phase) * 70;
      r.x1 = dnaW / 2 - wave;
      r.x2 = dnaW / 2 + wave;
      r.y = map(i, 0, dnaRungs.length - 1, 80, dnaH);
    }

    let mx = mouseX - (x + sideW);
    let my = mouseY - (y + headerH);
    let glow = 0;

    if (insidePanel && !r.removed) {
      if (abs(my - r.y) < 20) glow = 200;
      if (draggedRung === r) {
        r.x1 = mx - 30;
        r.x2 = mx + 30;
        r.y = my;
      }
    }

    if (glow > 0 || draggedRung === r) {
      r.trail.push({ x1: r.x1, x2: r.x2, y: r.y });
      if (r.trail.length > 15) r.trail.shift();
    } else if (r.trail.length > 0) {
      r.trail.shift();
    }

    for (let j = 0; j < r.trail.length; j++) {
      let alpha = map(j, 0, r.trail.length, 0, 80);
      stroke(0, 200, 255, alpha);
      strokeWeight(2);
      line(r.trail[j].x1, r.trail[j].y, r.trail[j].x2, r.trail[j].y);
    }

    stroke(r.removed ? color(255, 150, 0, 200) : color(255, glow + 55));
    strokeWeight(2);
    line(r.x1, r.y, r.x2, r.y);

    noStroke();
    fill(r.removed ? color(255, 150, 0, 200) : color(255, glow + 55));
    circle(r.x1, r.y, 5);
    circle(r.x2, r.y, 5);
  }

  drawingContext.shadowBlur = 0;
  pop();
}


function drawCRTScanlines() {
  stroke(255, 10);
  for (let y = 0; y < height; y += 2) {
    line(0, y, width, y);
  }
}

function mousePressed() {
  if (stage === 0) stage = 1;
  else if (stage === 1) {
    let margin = width * 0.05;
    let gutter = width * 0.05;
    let panelW = (width - margin * 2 - gutter) / 2;
    let panelH = height - margin * 2;

    if (mouseX > margin + panelW + gutter) showDNA = true;

    if (showDNA) {
      let sideW = panelW * 0.18;
      let headerH = panelH * 0.08;
      let dx = mouseX - (margin + panelW + gutter + sideW);
      let dy = mouseY - (margin + headerH);
      for (let r of dnaRungs) {
        if (!r.removed && abs(dy - r.y) < 20) {
          draggedRung = r;
          break;
        }
      }
    }
  } else if (stage === 2) {
    let nearest = null;
    let minD = 20;
    for (let s of stars) {
      let d = dist(mouseX, mouseY, s.x, s.y);
      if (d < minD) {
        nearest = s;
        minD = d;
      }
    }
    if (nearest && !currentGroup.stars.includes(nearest)) {
      currentGroup.stars.push(nearest);
    }
  }
}

function mouseReleased() {
  if (draggedRung) draggedRung = null;
}

function keyPressed() {
  

  if (stage === 2 && (key === "Enter" || key === "Return")) {
    if (currentGroup.stars.length > 1) {
      currentGroup.locked = true;
      currentGroup.active = true;
      currentGroup.color = color(random(100, 255), random(100, 255), random(100, 255), 180);

      for (let s of currentGroup.stars) {
        s.vx = random(-0.2, 0.2);
        s.vy = random(-0.2, 0.2);
      }

      starGroups.push(currentGroup);
      currentGroup = { stars: [], locked: false, active: false, color: color(255) };
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth * 0.5, windowHeight);
  pgCanvas.position(windowWidth * 0.5, 0);
}
