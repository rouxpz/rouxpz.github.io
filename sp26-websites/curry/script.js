const dock = document.getElementById("dock");
const dockItems = Array.from(dock.querySelectorAll(".dock-item:not(.dock-divider)"));
const dockShell = document.querySelector(".dock-shell");

const fileButtons = Array.from(document.querySelectorAll(".desktop-file"));
const windowLayer = document.getElementById("windowLayer");

const FILE_MARGIN = 8;
const WINDOW_MARGIN = 12;
const WINDOW_TOP_MARGIN = 40;
const WINDOW_BOTTOM_GUTTER = 120;
const WINDOW_CASCADE_X = 28;
const WINDOW_CASCADE_Y = 22;
const DOCK_RANGE = 150;
const DRAG_SLOP = 3;
const DRAG_RELEASE_DELAY = 220;
const IMPACT_FLASH_MS = 160;
const NOISE_FRAMES = 30;
const NOISE_INTERVAL_MS = 42;

const openWindows = new Map();
let zCounter = 40;
let cascadeCount = 0;
let windowDragState = null;
let fileDragState = null;
let isTransitioning = false;
let dockRaf = null;
let dockPointerX = null;
const BARRIER_TARGET = "late-stage.html";
const BARRIER_LOADING_DELAY = 2400;
const MIN_READ_MS = 1800;
const readFiles = new Set();
const fileReadTimers = new Map();
let barrierTriggered = false;

const uniqueFileIds = Array.from(
  new Set(fileButtons.map((button) => button.dataset.fileId).filter(Boolean)),
);
const REQUIRED_READ_COUNT = Math.max(1, uniqueFileIds.length - 1);

const fileContentMap = {
  "field-notes": `
    <article class="doc-content">
      <h3>Field Notes // March 2026</h3>
      <p>Daily brief logs track escalating political injustice under Trump-era governance: protest suppression, media intimidation, and legal double standards that shield power while targeting dissent.</p>
      <p>Analysts keep flagging fascist language patterns: enemies lists, loyalty demands, and normalization of state retaliation.</p>
    </article>
  `,
  "room-scan": `
    <article class="doc-content">
      <h3>Room Scan Memo</h3>
      <p>Campus and city footage shows heavily armed response to peaceful gatherings. Organizers report surveillance, detentions, and intimidation designed to exhaust civic action.</p>
      <p>Keyword trend: fear is replacing participation.</p>
    </article>
  `,
  "transit-log": `
    <article class="doc-content">
      <h3>Transit Log</h3>
      <p>Immigrant communities describe overnight raids and family separation threats. Mutual aid groups are overwhelmed and legal hotlines are at capacity.</p>
      <p>Status: rights language is being reframed as a security threat.</p>
    </article>
  `,
  redactions: `
    <article class="doc-content">
      <h3>Redactions</h3>
      <p>Documents obtained through public requests are increasingly delayed or blacked out, especially around detention policy, election administration pressure, and internal enforcement guidance.</p>
      <p>Transparency degraded. Accountability unclear.</p>
    </article>
  `,
  timeline: `
    <article class="doc-content">
      <h3>Timeline</h3>
      <ul>
        <li>Week 1: Disinformation surge labels critics as enemies.</li>
        <li>Week 2: Legal protections narrowed for targeted groups.</li>
        <li>Week 3: Protest crackdowns intensify.</li>
        <li>Week 4: Public institutions pressured to show political loyalty.</li>
      </ul>
    </article>
  `,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampWindowLeft(value, windowNode) {
  return clamp(value, WINDOW_MARGIN, window.innerWidth - windowNode.offsetWidth - WINDOW_MARGIN);
}

function clampWindowTop(value, windowNode) {
  return clamp(value, WINDOW_TOP_MARGIN, window.innerHeight - windowNode.offsetHeight - WINDOW_BOTTOM_GUTTER);
}

function bringToFront(windowNode) {
  zCounter += 1;
  windowNode.style.zIndex = String(zCounter);
}

function getFileBounds(fileButton) {
  const dockTop = dockShell ? dockShell.getBoundingClientRect().top : window.innerHeight;

  return {
    minLeft: FILE_MARGIN,
    maxLeft: Math.max(FILE_MARGIN, window.innerWidth - fileButton.offsetWidth - FILE_MARGIN),
    minTop: FILE_MARGIN,
    maxTop: Math.max(FILE_MARGIN, dockTop - fileButton.offsetHeight - FILE_MARGIN),
  };
}

function setFilePosition(fileButton, left, top) {
  const bounds = getFileBounds(fileButton);
  fileButton.style.left = `${clamp(left, bounds.minLeft, bounds.maxLeft)}px`;
  fileButton.style.top = `${clamp(top, bounds.minTop, bounds.maxTop)}px`;
}

function initializeFilePositions() {
  fileButtons.forEach((button) => {
    const rect = button.getBoundingClientRect();
    setFilePosition(button, rect.left, rect.top);
  });
}

function resetDock() {
  dockItems.forEach((item) => {
    item.style.setProperty("--scale", "1");
    item.style.setProperty("--y", "0");
    item.style.setProperty("--shadow", "0.4");
    item.style.zIndex = "1";
  });
}

function magnifyDock(pointerX) {
  dockItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const distance = Math.abs(pointerX - centerX);
    const influence = Math.max(0, 1 - distance / DOCK_RANGE);
    const eased = influence * influence * (3 - 2 * influence);

    const scale = 1 + eased * 0.58;
    const lift = eased * 13;
    const shadow = 0.38 + eased * 0.32;

    item.style.setProperty("--scale", scale.toFixed(3));
    item.style.setProperty("--y", lift.toFixed(1));
    item.style.setProperty("--shadow", shadow.toFixed(2));
    item.style.zIndex = String(1 + Math.round(eased * 10));
  });
}

function scheduleDockMagnify(pointerX) {
  dockPointerX = pointerX;
  if (dockRaf) return;
  dockRaf = window.requestAnimationFrame(() => {
    if (dockPointerX !== null) {
      magnifyDock(dockPointerX);
    }
    dockRaf = null;
  });
}

function triggerNoiseTransition(targetHref) {
  if (isTransitioning) return;
  isTransitioning = true;
  document.body.classList.add("is-breaking");

  const impact = document.createElement("div");
  impact.className = "impact-flash";
  document.body.appendChild(impact);
  window.setTimeout(() => {
    impact.remove();
  }, IMPACT_FLASH_MS);

  const overlay = document.createElement("div");
  overlay.className = "noise-flash";
  document.body.appendChild(overlay);

  let frame = 0;
  const maxFrames = NOISE_FRAMES;

  const intervalId = window.setInterval(() => {
    const noiseX = `${Math.floor(Math.random() * 100)}%`;
    const noiseY = `${Math.floor(Math.random() * 100)}%`;
    overlay.style.backgroundPosition = `${noiseX} ${noiseY}`;
    const sliceTop = 12 + Math.random() * 70;
    const sliceBottom = Math.min(96, sliceTop + 4 + Math.random() * 18);
    const warpX = -12 + Math.random() * 24;
    const warpY = -6 + Math.random() * 12;
    const flash = Math.random() < 0.22 ? 0.96 : 0.28 + Math.random() * 0.54;
    const hue = -24 + Math.random() * 48;
    const sat = 0.7 + Math.random() * 1.2;
    const contrast = 1 + Math.random() * 0.9;
    const dx = -7 + Math.random() * 14;
    const dy = -4 + Math.random() * 8;
    const skew = -1.8 + Math.random() * 3.6;

    overlay.style.setProperty("--slice-top", `${sliceTop}%`);
    overlay.style.setProperty("--slice-bottom", `${sliceBottom}%`);
    overlay.style.setProperty("--warp-x", `${warpX}px`);
    overlay.style.setProperty("--warp-y", `${warpY}px`);
    overlay.style.setProperty("--flash", String(flash));

    document.body.style.setProperty("--desktop-x", `${dx}px`);
    document.body.style.setProperty("--desktop-y", `${dy}px`);
    document.body.style.setProperty("--desktop-skew", `${skew}deg`);
    document.body.style.setProperty("--desktop-hue", `${hue}deg`);
    document.body.style.setProperty("--desktop-sat", String(sat));
    document.body.style.setProperty("--desktop-contrast", String(contrast));

    frame += 1;
    if (frame >= maxFrames) {
      window.clearInterval(intervalId);
      window.location.href = targetHref;
    }
  }, NOISE_INTERVAL_MS);
}

function shouldShowBarrier() {
  return !barrierTriggered && readFiles.size >= REQUIRED_READ_COUNT;
}

function markFileRead(fileId) {
  if (!fileId) return;
  readFiles.add(fileId);
}

function getWindowBody(fileId, showBarrier) {
  if (showBarrier) {
    return `
      <div class="barrier-screen" role="status" aria-live="polite" style="--barrier-duration: ${BARRIER_LOADING_DELAY}ms">
        <div class="barrier-hud" aria-hidden="true">
          <div class="barrier-orbit"></div>
          <div class="barrier-readout">
            <span class="barrier-label">SYNC</span>
            <span class="barrier-state">IN PROGRESS</span>
          </div>
        </div>
        <div class="barrier-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100">
          <span class="barrier-progress-bar"></span>
        </div>
        <p class="barrier-text">Calibrating Signal</p>
      </div>
    `;
  }

  return fileContentMap[fileId] || '<article class="doc-content"><p>No content loaded.</p></article>';
}

function createBlankWindow(fileButton, fileId, title, showBarrier) {
  const windowNode = document.createElement("article");
  windowNode.className = "blank-window is-opening";
  windowNode.setAttribute("aria-label", title);
  windowNode.dataset.fileId = fileId;
  const bodyContent = getWindowBody(fileId, showBarrier);
  windowNode.innerHTML = `
    <header class="blank-window-bar" data-drag-handle>
      <div class="window-controls">
        <button class="window-dot close" type="button" aria-label="Close ${title}" data-window-action="close"></button>
        <button class="window-dot min" type="button" aria-label="Minimize ${title}"></button>
        <button class="window-dot zoom" type="button" aria-label="Zoom ${title}"></button>
      </div>
      <h2 class="blank-window-title">${title}</h2>
    </header>
    <div class="blank-window-body${showBarrier ? " is-barrier" : ""}">${bodyContent}</div>
  `;

  windowLayer.appendChild(windowNode);

  const originRect = fileButton.getBoundingClientRect();
  const shiftX = WINDOW_CASCADE_X * (cascadeCount % 6);
  const shiftY = WINDOW_CASCADE_Y * (cascadeCount % 6);
  const left = clampWindowLeft(window.innerWidth * 0.5 - windowNode.offsetWidth / 2 + shiftX, windowNode);
  const top = clampWindowTop(window.innerHeight * 0.32 + shiftY, windowNode);
  const startLeft = clampWindowLeft(originRect.left + originRect.width / 2 - windowNode.offsetWidth / 2, windowNode);
  const startTop = clampWindowTop(originRect.top + originRect.height * 0.35, windowNode);

  windowNode.style.left = `${startLeft}px`;
  windowNode.style.top = `${startTop}px`;

  requestAnimationFrame(() => {
    windowNode.style.left = `${left}px`;
    windowNode.style.top = `${top}px`;
    windowNode.classList.remove("is-opening");
  });

  cascadeCount += 1;

  windowNode.addEventListener("pointerdown", () => {
    bringToFront(windowNode);
  });

  let barrierTimeoutId = null;
  if (showBarrier) {
    barrierTriggered = true;
    barrierTimeoutId = window.setTimeout(() => {
      if (!windowNode.isConnected) return;
      triggerNoiseTransition(BARRIER_TARGET);
    }, BARRIER_LOADING_DELAY);
  } else if (fileId && !fileReadTimers.has(fileId)) {
    const readTimerId = window.setTimeout(() => {
      markFileRead(fileId);
      fileReadTimers.delete(fileId);
    }, MIN_READ_MS);
    fileReadTimers.set(fileId, readTimerId);
  }

  const closeButton = windowNode.querySelector('[data-window-action="close"]');
  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (barrierTimeoutId) {
      window.clearTimeout(barrierTimeoutId);
    }
    if (fileId && fileReadTimers.has(fileId)) {
      window.clearTimeout(fileReadTimers.get(fileId));
      fileReadTimers.delete(fileId);
    }
    windowNode.remove();
    openWindows.delete(fileId);
  });

  if (!showBarrier) {
    const windowBody = windowNode.querySelector(".blank-window-body");
    windowBody.addEventListener("click", (event) => {
      const link = event.target.closest(".world-link");
      if (!link) return;

      event.preventDefault();
      triggerNoiseTransition(link.getAttribute("href"));
    });
  }

  const dragHandle = windowNode.querySelector("[data-drag-handle]");
  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".window-controls")) return;

    windowDragState = {
      windowNode,
      offsetX: event.clientX - windowNode.offsetLeft,
      offsetY: event.clientY - windowNode.offsetTop,
    };

    dragHandle.setPointerCapture(event.pointerId);
    bringToFront(windowNode);
  });

  return windowNode;
}

function openFileWindow(fileButton) {
  const fileId = fileButton.dataset.fileId;
  if (!fileId) return;

  const title = fileButton.querySelector(".file-name")?.textContent?.trim() || "untitled.txt";
  const showBarrier = shouldShowBarrier();
  const existingWindow = openWindows.get(fileId);
  if (existingWindow && !showBarrier) {
    bringToFront(existingWindow);
    return;
  }
  if (existingWindow && showBarrier) {
    existingWindow.remove();
    openWindows.delete(fileId);
  }
  const newWindow = createBlankWindow(fileButton, fileId, title, showBarrier);
  openWindows.set(fileId, newWindow);
  bringToFront(newWindow);
}

dock.addEventListener("pointermove", (event) => {
  scheduleDockMagnify(event.clientX);
});

dock.addEventListener("pointerleave", () => {
  dockPointerX = null;
  if (dockRaf) {
    window.cancelAnimationFrame(dockRaf);
    dockRaf = null;
  }
  resetDock();
});

dock.addEventListener("focusin", (event) => {
  const target = event.target.closest(".dock-item");
  if (!target) return;
  const rect = target.getBoundingClientRect();
  scheduleDockMagnify(rect.left + rect.width / 2);
});

dock.addEventListener("focusout", (event) => {
  if (!dock.contains(event.relatedTarget)) {
    resetDock();
  }
});

fileButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;

    fileDragState = {
      button,
      offsetX: event.clientX - button.offsetLeft,
      offsetY: event.clientY - button.offsetTop,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };

    button.classList.add("is-dragging");
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener("dblclick", () => {
    if (isTransitioning) return;
    if (button.dataset.dragged === "1") {
      button.dataset.dragged = "0";
      return;
    }
    openFileWindow(button);
  });
});

document.addEventListener("pointermove", (event) => {
  if (fileDragState) {
    const { button, offsetX, offsetY, startX, startY } = fileDragState;
    const movedEnough = Math.abs(event.clientX - startX) > DRAG_SLOP || Math.abs(event.clientY - startY) > DRAG_SLOP;
    if (movedEnough) {
      fileDragState.moved = true;
    }

    setFilePosition(button, event.clientX - offsetX, event.clientY - offsetY);
  }

  if (!windowDragState) return;

  const { windowNode, offsetX, offsetY } = windowDragState;
  const left = clampWindowLeft(event.clientX - offsetX, windowNode);
  const top = clampWindowTop(event.clientY - offsetY, windowNode);

  windowNode.style.left = `${left}px`;
  windowNode.style.top = `${top}px`;
});

document.addEventListener("pointerup", () => {
  if (fileDragState) {
    const { button, moved } = fileDragState;
    button.classList.remove("is-dragging");
    if (moved) {
      button.dataset.dragged = "1";
      setTimeout(() => {
        button.dataset.dragged = "0";
      }, DRAG_RELEASE_DELAY);
    }
    fileDragState = null;
  }

  windowDragState = null;
});

window.addEventListener("resize", () => {
  resetDock();

  fileButtons.forEach((button) => {
    setFilePosition(button, button.offsetLeft, button.offsetTop);
  });

  openWindows.forEach((windowNode) => {
    const left = clampWindowLeft(windowNode.offsetLeft, windowNode);
    const top = clampWindowTop(windowNode.offsetTop, windowNode);
    windowNode.style.left = `${left}px`;
    windowNode.style.top = `${top}px`;
  });
});

initializeFilePositions();
resetDock();
