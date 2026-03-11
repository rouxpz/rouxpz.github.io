const dockItems = [
  { type: "app", color: "#64c4ff", running: true },
  { type: "app", color: "#b88dff", running: false },
  { type: "app", color: "#f8cb5e", running: false },
  { type: "app", color: "#ff8da1", running: false },
  { type: "app", color: "#7ddf9f", running: true },
  { type: "app", color: "#8de8f8", running: false },
  { type: "app", color: "#ffa86a", running: true },
  { type: "app", color: "#9fb2ff", running: false },
  { type: "app", color: "#ee9cff", running: false },
  { type: "divider" },
  { type: "app", color: "#7ec3ff", running: false },
  { type: "app", color: "#94f1d0", running: false },
  { type: "app", color: "#c3ccd9", running: false },
];

let iconSize = 58;
let iconGap = 8;
let dividerWidth = 1;
let dockPaddingX = 10;
let dockPaddingTop = 6;
let dockPaddingBottom = 7;
let dockBottomMargin = 12;

let positions = [];
let dockRect = { x: 0, y: 0, w: 0, h: 0 };

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("Helvetica");
  noStroke();
  updateDockLayout();
}

function draw() {
  background(0);

  const pointerActive = isPointerInDockZone();
  const pointerX = pointerActive ? mouseX : null;

  drawDockShell();
  drawDockItems(pointerX);
}

function drawDockShell() {
  push();
  fill(240, 246, 255, 58);
  stroke(255, 255, 255, 95);
  strokeWeight(1);
  drawingContext.shadowBlur = 22;
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.48)";
  rect(dockRect.x, dockRect.y, dockRect.w, dockRect.h, 22);
  pop();
}

function drawDockItems(pointerX) {
  const range = 150;
  const maxScaleBoost = 0.58;
  const maxLift = 13;

  const iconsBottom = dockRect.y + dockRect.h - dockPaddingBottom;

  for (const item of positions) {
    if (item.type === "divider") {
      push();
      stroke(255, 255, 255, 120);
      strokeWeight(1);
      line(item.x + dividerWidth / 2, iconsBottom - iconSize + 8, item.x + dividerWidth / 2, iconsBottom - 8);
      pop();
      continue;
    }

    let scaleAmount = 1;
    let lift = 0;

    if (pointerX !== null) {
      const distance = Math.abs(pointerX - item.centerX);
      const influence = Math.max(0, 1 - distance / range);
      const eased = influence * influence * (3 - 2 * influence);
      scaleAmount = 1 + eased * maxScaleBoost;
      lift = eased * maxLift;
    }

    const size = iconSize * scaleAmount;
    const x = item.centerX - size / 2;
    const y = iconsBottom - size - lift;

    push();
    fill(item.color);
    drawingContext.shadowBlur = 12;
    drawingContext.shadowColor = "rgba(0, 0, 0, 0.42)";
    rect(x, y, size, size, size * 0.24);
    pop();

    if (item.running) {
      push();
      fill(255, 255, 255, 230);
      circle(item.centerX, iconsBottom + 4, 5);
      pop();
    }
  }
}

function isPointerInDockZone() {
  const verticalPad = 36;
  const horizontalPad = 80;
  const inX = mouseX >= dockRect.x - horizontalPad && mouseX <= dockRect.x + dockRect.w + horizontalPad;
  const inY = mouseY >= dockRect.y - verticalPad && mouseY <= dockRect.y + dockRect.h + verticalPad;
  return inX && inY;
}

function updateDockLayout() {
  iconSize = clamp(windowWidth * 0.052, 44, 66);
  iconGap = clamp(windowWidth * 0.008, 5, 10);

  dividerWidth = 1;

  let contentWidth = 0;
  let iconCount = 0;

  for (const item of dockItems) {
    if (item.type === "divider") {
      contentWidth += dividerWidth + 12;
    } else {
      contentWidth += iconSize;
      iconCount += 1;
    }
  }

  contentWidth += (iconCount - 1) * iconGap;

  dockRect.w = contentWidth + dockPaddingX * 2;
  dockRect.h = iconSize + dockPaddingTop + dockPaddingBottom + 4;
  dockRect.x = (width - dockRect.w) / 2;
  dockRect.y = height - dockBottomMargin - dockRect.h;

  positions = [];
  let xCursor = dockRect.x + dockPaddingX;

  let pendingGap = false;

  for (const item of dockItems) {
    if (item.type === "divider") {
      if (pendingGap) xCursor += iconGap;
      positions.push({ type: "divider", x: xCursor, centerX: xCursor + dividerWidth / 2 });
      xCursor += dividerWidth + 12;
      pendingGap = false;
      continue;
    }

    if (pendingGap) xCursor += iconGap;

    positions.push({
      type: "app",
      color: item.color,
      running: item.running,
      centerX: xCursor + iconSize / 2,
    });

    xCursor += iconSize;
    pendingGap = true;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateDockLayout();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
