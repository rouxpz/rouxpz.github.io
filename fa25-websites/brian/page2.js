let geneticsSketch = (p) => {
  let particles = [];

  p.setup = () => {
    let c = p.createCanvas(400, 300);
    c.parent("geneticsCanvas");

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: p.random(p.width),
        y: p.random(p.height),
        vx: p.random(-1, 1),
        vy: p.random(-1, 1),
        allele: p.random(["A", "a"])
      });
    }
  };

  p.draw = () => {
    p.background(15, 15, 20);

    for (let pt of particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;

      if (pt.x < 0 || pt.x > p.width) pt.vx *= -1;
      if (pt.y < 0 || pt.y > p.height) pt.vy *= -1;

      p.fill(pt.allele === "A" ? "hotpink" : "yellow");
      p.noStroke();
      p.circle(pt.x, pt.y, 8);
    }
  };
};


let dnaSketch = (p) => {
  let rungs = [];
  let dragging = null;

  p.setup = () => {
    let c = p.createCanvas(400, 300);
    c.parent("dnaCanvas");

    for (let i = 0; i < 12; i++) {
      rungs.push({
        y: 20 + i * 20,
        dx: p.random(-10, 10)
      });
    }
  };

  p.draw = () => {
    p.background(10, 10, 15);

    p.stroke(255, 255, 200);
    p.strokeWeight(3);

    p.line(120, 20, 120, 260);
    p.line(280, 20, 280, 260);

    for (let r of rungs) {
      p.line(120, r.y, 280 + r.dx, r.y);
    }
  };

  p.mousePressed = () => {
    for (let r of rungs) {
      if (p.abs(p.mouseY - r.y) < 8) dragging = r;
    }
  };

  p.mouseDragged = () => {
    if (dragging) dragging.dx = p.mouseX - 280;
  };

  p.mouseReleased = () => dragging = null;
};

new p5(geneticsSketch);
new p5(dnaSketch);
