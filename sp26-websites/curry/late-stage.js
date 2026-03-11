(function initLateStage() {
  "use strict";

  const wordField = document.getElementById("wordField");
  const endFragment = document.getElementById("endFragment");
  const impactFlash = document.getElementById("impactFlash");
  const sceneWords = document.getElementById("sceneWords");
  const sceneProse = document.getElementById("sceneProse");
  const sceneEnd = document.getElementById("sceneEnd");
  const proseShell = document.getElementById("proseShell");
  const proseParticleCanvas = document.getElementById("proseParticles");
  const proseNodes = Array.from(document.querySelectorAll("[data-prose]"));

  if (
    !(wordField instanceof HTMLElement) ||
    !(endFragment instanceof HTMLElement) ||
    !(impactFlash instanceof HTMLElement) ||
    !(sceneWords instanceof HTMLElement) ||
    !(sceneProse instanceof HTMLElement) ||
    !(sceneEnd instanceof HTMLElement) ||
    !(proseShell instanceof HTMLElement) ||
    !(proseParticleCanvas instanceof HTMLCanvasElement) ||
    proseNodes.length === 0
  ) {
    return;
  }

  const proseCtx = proseParticleCanvas.getContext("2d");
  if (!proseCtx) return;

  const BASE_END = "no stable author";
  const SCRAMBLE_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]<>:/";
  const REDACT_POOL = "█▓▒■▮";
  const APPEND_TRIGGER_CHANCE = 0.0025;
  const APPEND_COOLDOWN_FRAMES = 180;
  const APPEND_CHAR_DELAY_MIN = 32;
  const APPEND_CHAR_DELAY_MAX = 90;
  const APPEND_PROGRESS_MIN = 0.12;
  const APPEND_PROGRESS_MAX = 0.92;
  const SHIFT_WORD_POOL = [
    "PROTOCOL",
    "PAYLOAD",
    "CLEARANCE",
    "SEQUENCE",
    "ARCHIVE",
    "REVISION",
    "DISCLOSURE",
    "CONTAINMENT",
    "WITNESS",
    "OBSERVER",
    "INTERCEPT",
    "HANDSHAKE",
    "REDIRECT",
    "SANITIZE",
    "NORMALIZE",
    "EVIDENCE",
    "METADATA",
    "FOOTPRINT",
    "SIGNATURE",
    "CONFLICT",
    "ANOMALY",
    "FALSEPOS",
    "OVERRIDE",
    "BACKFILL",
    "RETENTION",
    "LATENCY",
    "THROTTLE",
    "SUBSYSTEM",
    "CHANNEL",
    "UPLINK",
    "DOWNLINK",
    "INTERNAL",
    "EXTERNAL",
    "PUBLIC",
    "PRIVATE",
    "MASKING",
    "SCRUBBED",
    "CORRUPT",
    "RECOVER",
    "SIMULATE",
    "ENCRYPT",
    "DECRYPT",
    "REDACT",
    "REWRITE",
    "REROUTE",
    "SUSPEND",
    "RESUME",
    "MIRROR",
    "GHOST",
    "VECTOR",
    "DRIFT",
    "NOISE",
    "SILENT",
    "ERROR",
    "STABLE",
    "UNSTABLE",
    "PERSIST",
  ];
  const symbolPool = [
    "echo",
    "trace",
    "null",
    "drift",
    "vessel",
    "index",
    "after",
    "noise",
    "split",
    "borrowed",
    "phase",
    "mute",
    "signal",
    "faint",
    "shape",
    "hollow",
    "residue",
    "vector",
    "sleep",
    "orbital",
  ];

  const state = {
    pointer: {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      down: false,
      speed: 0,
      lastTime: 0,
    },
    frameId: 0,
    words: [],
    textFx: [],
    scrambleClock: 0,
    impact: {
      armed: true,
      burst: 0,
      lastWordProgress: 0,
    },
    prose: {
      chars: [],
      particles: [],
      flares: [],
      flareCooldown: 0,
      flareWasInRange: false,
      mutateCooldown: 0,
      flareMutateCooldown: 0,
      appenders: [],
      appendCooldown: 0,
      nodes: [],
      wordsAll: [],
      shift: {
        poolsByLen: new Map(),
        secondIndex: 1,
        cooldown: 0,
      },
      width: 0,
      height: 0,
      dpr: 1,
    },
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomFloat(min, max) {
    return min + Math.random() * (max - min);
  }

  function isWordSymbol(ch) {
    return /[A-Z0-9-]/.test(ch);
  }

  function markDisturbed(charState, frames) {
    const word = charState.word || null;
    const healFactor = word ? word.healFactor : 1;
    const jitter = frames * randomFloat(0.05, 0.42);
    const boosted = Math.floor(frames * healFactor + jitter);
    charState.healFrames = Math.max(charState.healFrames || 0, boosted);
    charState.healStep = 0;
    if (word) {
      word.settleFrames = Math.max(word.settleFrames || 0, boosted);
      word.driftArmed = true;
    }
  }

  function randomDigit() {
    return String(Math.floor(Math.random() * 10));
  }

  function settleChar(charState) {
    const word = charState.word || null;
    const steps = word ? word.healSteps : 0;

    // Optional "landing" behavior: a few digit ticks before restoring.
    if (steps > 0 && charState.healStep < steps) {
      charState.healStep += 1;
      charState.base = randomDigit();
      charState.span.textContent = charState.base;
      const pace = word ? word.healPace : 1;
      // Add a small pause so it doesn't snap through steps too quickly.
      charState.healFrames = Math.max(charState.healFrames, Math.floor((10 + randomFloat(0, 26)) * pace));
      return;
    }

    charState.base = charState.original;
    charState.healStep = 0;
    if (charState.scrambleFrames <= 1) charState.span.textContent = charState.base;
  }

  function applyWordVariant(word) {
    const len = word.end - word.start;
    if (len <= 2) return;
    const replacement = pickShiftWord(len);
    const repl = replacement.length === len ? replacement : replacement.slice(0, len).padEnd(len, "X");
    word.variant = repl;
    word.variantFrames = 280 + Math.floor(randomFloat(0, 520));
    word.driftArmed = false;

    for (let i = 0; i < len; i += 1) {
      const charState = state.prose.chars[word.start + i];
      if (!charState || charState.base === "\u00A0") continue;
      const next = repl[i];
      charState.base = next;
      charState.span.textContent = next;
      charState.scrambleFrames = Math.max(charState.scrambleFrames, 1);
      charState.healFrames = Math.max(charState.healFrames, 90 + Math.floor(randomFloat(0, 90)));
      charState.healStep = 0;
    }
  }

  function buildShiftPools() {
    state.prose.shift.poolsByLen.clear();
    SHIFT_WORD_POOL.forEach((word) => {
      const w = String(word || "").toUpperCase();
      const len = w.length;
      if (!len) return;
      const list = state.prose.shift.poolsByLen.get(len) || [];
      list.push(w);
      state.prose.shift.poolsByLen.set(len, list);
    });
  }

  function pickShiftWord(targetLen) {
    const poolExact = state.prose.shift.poolsByLen.get(targetLen);
    if (poolExact && poolExact.length) {
      return poolExact[Math.floor(Math.random() * poolExact.length)];
    }
    // Fallback to a nearby length (keeps boundaries stable-ish).
    for (let d = 1; d <= 3; d += 1) {
      const poolUp = state.prose.shift.poolsByLen.get(targetLen + d);
      if (poolUp && poolUp.length) return poolUp[Math.floor(Math.random() * poolUp.length)];
      const poolDown = state.prose.shift.poolsByLen.get(targetLen - d);
      if (poolDown && poolDown.length) return poolDown[Math.floor(Math.random() * poolDown.length)];
    }
    return "NULL";
  }

  function shiftSecondProseWord(nearChars, allowFlares) {
    const meta = state.prose.nodes[state.prose.shift.secondIndex];
    if (!meta || !meta.words || meta.words.length === 0) return;

    // Global throttle so it feels like sentence drift, not constant rewrites.
    state.prose.shift.cooldown = Math.max(0, state.prose.shift.cooldown - 1);
    if (state.prose.shift.cooldown > 0) return;

    // Prefer words near the cursor, but keep it resilient if we can't find one.
    let chosen = null;
    for (let attempts = 0; attempts < 14; attempts += 1) {
      const pick = nearChars[Math.floor(Math.random() * nearChars.length)];
      if (!pick) continue;
      const idx = state.prose.chars.indexOf(pick);
      if (idx < meta.start || idx >= meta.end) continue;
      // Find a word that contains this index.
      for (let w = 0; w < meta.words.length; w += 1) {
        const word = meta.words[w];
        if (idx >= word.start && idx < word.end) {
          chosen = word;
          break;
        }
      }
      if (chosen) break;
    }
    if (!chosen) {
      chosen = meta.words[Math.floor(Math.random() * meta.words.length)];
    }

    const len = chosen.end - chosen.start;
    if (len <= 2) return;

    // Only drift "word-like" spans (avoid punctuation runs).
    let wordLikeCount = 0;
    for (let i = chosen.start; i < chosen.end; i += 1) {
      const ch = state.prose.chars[i]?.base || "";
      if (isWordSymbol(ch)) wordLikeCount += 1;
    }
    if (wordLikeCount < Math.max(2, Math.floor(len * 0.45))) return;

    const replacement = pickShiftWord(len);
    const repl = replacement.length === len ? replacement : replacement.slice(0, len).padEnd(len, "X");

    for (let i = 0; i < len; i += 1) {
      const charState = state.prose.chars[chosen.start + i];
      if (!charState || charState.base === "\u00A0") continue;
      const next = repl[i];
      charState.base = next;
      charState.span.textContent = next;
      charState.scrambleFrames = Math.max(charState.scrambleFrames, allowFlares ? 2 : 1);
      markDisturbed(charState, allowFlares ? 220 : 170);
    }

    // Cooldown keeps it from rewriting too quickly; flares rewrite a bit less often.
    state.prose.shift.cooldown = allowFlares
      ? 160 + Math.floor(randomFloat(0, 220))
      : 110 + Math.floor(randomFloat(0, 180));
  }

  function sceneProgress(section) {
    const rect = section.getBoundingClientRect();
    const start = window.innerHeight;
    const end = -rect.height;
    return clamp((start - rect.top) / (start - end), 0, 1);
  }

  function scrambleText(text) {
    const chars = text.split("");
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }
    return chars.join("");
  }

  function mutateBaseChar(base) {
    if (base === "\u00A0") return base;
    if (Math.random() < 0.24) {
      return REDACT_POOL[Math.floor(Math.random() * REDACT_POOL.length)];
    }
    return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
  }

  function buildTextFx(element, text, radius, strength, scrambleChance) {
    const fx = {
      element,
      chars: [],
      radius,
      strength,
      scrambleChance,
      raw: "",
    };
    setTextFxText(fx, text);
    return fx;
  }

  function setTextFxText(fx, text) {
    if (fx.raw === text) return;
    fx.raw = text;
    fx.element.textContent = "";
    fx.chars = [];
    for (let i = 0; i < text.length; i += 1) {
      const span = document.createElement("span");
      span.className = "mess-char";
      span.textContent = text[i];
      fx.element.appendChild(span);
      fx.chars.push({
        span,
        base: text[i],
        seed: Math.random() * 1000,
      });
    }
  }

  function updateTextFx(timestamp) {
    state.textFx.forEach((fx) => {
      fx.chars.forEach((charObj) => {
        const rect = charObj.span.getBoundingClientRect();
        const cx = rect.left + rect.width * 0.5;
        const cy = rect.top + rect.height * 0.5;
        const dx = cx - state.pointer.x;
        const dy = cy - state.pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const influence = clamp(1 - distance / fx.radius, 0, 1);
        const repel = influence * influence * fx.strength;
        const nx = dx / distance;
        const ny = dy / distance;
        const jitterX = Math.sin(timestamp * 0.02 + charObj.seed) * influence * 5;
        const jitterY = Math.cos(timestamp * 0.019 + charObj.seed) * influence * 5;
        const tx = nx * repel + jitterX;
        const ty = ny * repel + jitterY;
        const rot = influence * 34 * Math.sin(charObj.seed);
        const opacity = clamp(0.35 + influence * 0.9, 0.2, 1);

        if (influence > 0.35 && Math.random() < fx.scrambleChance) {
          charObj.span.textContent = SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
        } else if (Math.random() < 0.09) {
          charObj.span.textContent = charObj.base;
        }

        charObj.span.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
        charObj.span.style.opacity = `${opacity}`;
      });
    });
  }

  function initWords() {
    wordField.innerHTML = "";
    state.words = [];
    for (let i = 0; i < 130; i += 1) {
      const el = document.createElement("span");
      el.className = "word";
      const text = symbolPool[i % symbolPool.length];
      el.textContent = text;
      wordField.appendChild(el);
      state.words.push({
        el,
        base: text,
        x: Math.random(),
        y: Math.random(),
        tx: Math.random(),
        ty: Math.random(),
        o: 0,
        to: 0,
      });
    }
  }

  function refreshWordTargets(progress, timestamp) {
    const centerX = 0.5;
    const centerY = 0.5;
    const spiralTurns = 4.6;

    state.words.forEach((word, i) => {
      if (progress < 0.2) {
        word.tx = centerX + (Math.random() - 0.5) * 0.06;
        word.ty = centerY + (Math.random() - 0.5) * 0.06;
        word.to = 0;
        return;
      }

      if (progress < 0.78) {
        const t = i / state.words.length;
        const angle = t * Math.PI * 2 * spiralTurns + timestamp * 0.00045;
        const radius = 0.06 + t * 0.44 + Math.sin(timestamp * 0.001 + i) * 0.02;
        word.tx = centerX + Math.cos(angle) * radius;
        word.ty = centerY + Math.sin(angle) * radius * 0.72;
        word.to = clamp(0.22 + progress * 0.9 - t * 0.18, 0, 1);
        return;
      }

      word.tx = Math.random();
      word.ty = Math.random();
      word.to = clamp(1 - (progress - 0.78) * 4.2, 0, 1);
    });
  }

  function updateWords(progress, timestamp) {
    state.scrambleClock += 1;
    if (state.scrambleClock % 16 === 0) {
      refreshWordTargets(progress, timestamp);
    }

    const width = wordField.clientWidth;
    const height = wordField.clientHeight;
    const fieldRect = wordField.getBoundingClientRect();
    const influenceRadius = 180;
    const centerPxX = width * 0.5;
    const centerPxY = height * 0.5;

    const burst = state.impact.burst;
    if (burst > 0.001) {
      // Fast decay; reads as a single "impact" frame, not a sustained effect.
      state.impact.burst *= 0.84;
    } else {
      state.impact.burst = 0;
    }

    state.words.forEach((word, i) => {
      word.x += (word.tx - word.x) * 0.08;
      word.y += (word.ty - word.y) * 0.08;
      word.o += (word.to - word.o) * 0.09;

      const px = word.x * width;
      const py = word.y * height;
      const wobbleX = Math.sin(timestamp * 0.001 + i * 0.3) * 8;
      const wobbleY = Math.cos(timestamp * 0.0012 + i * 0.27) * 8;
      const screenX = fieldRect.left + px + wobbleX;
      const screenY = fieldRect.top + py + wobbleY;

      const dx = screenX - state.pointer.x;
      const dy = screenY - state.pointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const influence = clamp(1 - dist / influenceRadius, 0, 1);
      const repel = influence * influence * 54;
      const repelX = (dx / dist) * repel;
      const repelY = (dy / dist) * repel;

      if (influence > 0.28 && Math.random() < 0.055) {
        word.el.textContent = scrambleText(word.base);
      } else if (Math.random() < 0.02) {
        word.el.textContent = word.base;
      }

      let extraX = 0;
      let extraY = 0;
      let extraO = 0;
      let extraS = 0;
      if (burst > 0) {
        const ox = px - centerPxX;
        const oy = py - centerPxY;
        const od = Math.sqrt(ox * ox + oy * oy) || 1;
        const nx = ox / od;
        const ny = oy / od;
        const kick = (18 + (i % 9) * 2.2) * burst;
        extraX = nx * kick;
        extraY = ny * kick;
        extraO = 0.55 * burst;
        extraS = 0.35 * burst;
        if (Math.random() < 0.22 * burst) {
          word.el.textContent = scrambleText(word.base);
        }
      }

      const scale = 0.7 + word.o * 0.6 + influence * 0.3 + extraS;
      const opacity = clamp(word.o + influence * 0.4 + extraO, 0, 1);
      word.el.style.transform = `translate3d(${px + wobbleX + repelX + extraX}px, ${py + wobbleY + repelY + extraY}px, 0) scale(${scale})`;
      word.el.style.opacity = `${opacity}`;
    });
  }

  function triggerImpactFlash() {
    impactFlash.classList.remove("impact-flash--fire");
    // Force reflow so restarting the animation is reliable.
    // eslint-disable-next-line no-unused-expressions
    impactFlash.offsetHeight;
    impactFlash.classList.add("impact-flash--fire");
    state.impact.burst = 1;
  }

  function splitProseIntoChars() {
    state.prose.chars = [];
    state.prose.nodes = [];
    state.prose.wordsAll = [];
    state.prose.appenders = [];
    state.prose.appendCooldown = 0;
    proseNodes.forEach((node) => {
      const text = (node.textContent || "").replace(/\s+/g, " ").trim();
      node.textContent = "";
      const startIndex = state.prose.chars.length;
      const words = [];
      let currentWordStart = -1;
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i] === " " ? "\u00A0" : text[i];
        const span = document.createElement("span");
        span.className = "prose-char";
        span.textContent = ch;
        node.appendChild(span);
        state.prose.chars.push({
          span,
          base: ch,
          original: ch,
          lx: 0,
          ly: 0,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          scrambleFrames: 0,
          influence: 0,
          sizeJitter: randomFloat(-0.06, 0.06),
          healFrames: 0,
          healStep: 0,
          word: null,
        });

        // Track word boundaries for later semantic substitutions.
        const isWord = ch !== "\u00A0" && isWordSymbol(ch);
        if (isWord) {
          if (currentWordStart === -1) currentWordStart = startIndex + i;
        } else if (currentWordStart !== -1) {
          const endIndex = startIndex + i;
          if (endIndex - currentWordStart >= 3) {
            words.push({ start: currentWordStart, end: endIndex });
          }
          currentWordStart = -1;
        }
      }
      if (currentWordStart !== -1) {
        const endIndex = startIndex + text.length;
        if (endIndex - currentWordStart >= 3) {
          words.push({ start: currentWordStart, end: endIndex });
        }
      }

      state.prose.nodes.push({
        node,
        start: startIndex,
        end: startIndex + text.length,
        words,
      });

      const appendText = node.dataset.append;
      if (appendText) {
        state.prose.appenders.push({
          node,
          text: String(appendText).trim(),
          index: 0,
          active: false,
          done: false,
          nextAt: 0,
          container: null,
        });
      }
    });

    // Assign per-word heal profiles so some heal quickly and a handful linger (or drift).
    state.prose.nodes.forEach((meta) => {
      meta.words.forEach((word) => {
        const roll = Math.random();
        // Majority slow: most text takes time to settle back.
        const mode = roll < 0.1 ? "drift" : roll < 0.75 ? "slow" : "fast";
        word.mode = mode;
        word.settleFrames = 0;
        word.driftArmed = false;
        word.variant = null;
        word.variantFrames = 0;
        word.healFactor =
          mode === "fast"
            ? randomFloat(0.55, 1.05)
            : mode === "slow"
              ? randomFloat(2.1, 4.1)
              : randomFloat(1.8, 3.2);
        word.healChance =
          mode === "fast"
            ? randomFloat(0.09, 0.18)
            : mode === "slow"
              ? randomFloat(0.012, 0.04)
              : randomFloat(0.02, 0.06);
        word.driftChance = mode === "drift" ? randomFloat(0.09, 0.16) : 0;

        // "Landing" behavior: some words tick through digits before restoring.
        // Slow words do this more often, fast words rarely.
        const wantsSteps = mode === "slow" ? Math.random() < 0.78 : mode === "drift" ? Math.random() < 0.62 : Math.random() < 0.22;
        word.healSteps = wantsSteps ? (mode === "slow" ? 2 + Math.floor(randomFloat(0, 4)) : 1 + Math.floor(randomFloat(0, 3))) : 0;
        word.healPace = mode === "slow" ? randomFloat(1.2, 2.4) : mode === "drift" ? randomFloat(1.1, 2.0) : randomFloat(0.85, 1.2);

        state.prose.wordsAll.push(word);
        for (let idx = word.start; idx < word.end; idx += 1) {
          const charState = state.prose.chars[idx];
          if (!charState || charState.base === "\u00A0") continue;
          charState.word = word;
        }
      });
    });

    cacheProseCenters();
  }

  function cacheProseCenters() {
    state.prose.chars.forEach((charState) => {
      charState.x = 0;
      charState.y = 0;
      charState.vx = 0;
      charState.vy = 0;
      charState.scrambleFrames = 0;
      charState.base = charState.original;
      charState.healFrames = 0;
      charState.healStep = 0;
      charState.span.textContent = charState.base;
      charState.span.style.transform = "translate(0px, 0px)";
      charState.span.style.opacity = "0.9";
    });

    state.prose.wordsAll.forEach((word) => {
      word.settleFrames = 0;
      word.driftArmed = false;
      word.variant = null;
      word.variantFrames = 0;
    });

    const shellRect = proseShell.getBoundingClientRect();
    state.prose.chars.forEach((charState) => {
      const rect = charState.span.getBoundingClientRect();
      charState.lx = rect.left - shellRect.left + rect.width * 0.5;
      charState.ly = rect.top - shellRect.top + rect.height * 0.5;
    });

    resizeProseCanvas();
  }

  function resizeProseCanvas() {
    const rect = proseShell.getBoundingClientRect();
    state.prose.dpr = window.devicePixelRatio || 1;
    state.prose.width = Math.max(1, Math.floor(rect.width * state.prose.dpr));
    state.prose.height = Math.max(1, Math.floor(rect.height * state.prose.dpr));
    proseParticleCanvas.width = state.prose.width;
    proseParticleCanvas.height = state.prose.height;
    proseParticleCanvas.style.width = `${rect.width}px`;
    proseParticleCanvas.style.height = `${rect.height}px`;
  }

  function startAppender(appender, now) {
    if (!appender || appender.active || appender.done || !appender.text) return;
    const container = document.createElement("span");
    container.className = "prose-append";
    container.setAttribute("aria-hidden", "true");
    appender.container = container;
    appender.node.appendChild(container);
    appender.active = true;
    appender.nextAt = now + randomFloat(180, 520);
  }

  function updateProseAppends(progress) {
    if (state.prose.appenders.length === 0) return;
    if (progress < APPEND_PROGRESS_MIN || progress > APPEND_PROGRESS_MAX) return;

    if (state.prose.appendCooldown > 0) {
      state.prose.appendCooldown -= 1;
    }

    const activeAppender = state.prose.appenders.find((appender) => appender.active);
    if (!activeAppender && state.prose.appendCooldown <= 0 && Math.random() < APPEND_TRIGGER_CHANCE) {
      const candidates = state.prose.appenders.filter((appender) => !appender.done && !appender.active && appender.text);
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        startAppender(pick, performance.now());
        state.prose.appendCooldown = APPEND_COOLDOWN_FRAMES;
      }
    }

    const now = performance.now();
    state.prose.appenders.forEach((appender) => {
      if (!appender.active || !appender.container) return;
      if (now < appender.nextAt) return;
      if (appender.index >= appender.text.length) {
        appender.active = false;
        appender.done = true;
        return;
      }
      appender.container.textContent += appender.text[appender.index];
      appender.index += 1;
      appender.nextAt = now + randomFloat(APPEND_CHAR_DELAY_MIN, APPEND_CHAR_DELAY_MAX);
    });
  }

  function emitProseParticles(localX, localY, nx, ny, intensity) {
    const burst = 1 + Math.floor(intensity * 3);
    for (let i = 0; i < burst; i += 1) {
      state.prose.particles.push({
        x: localX * state.prose.dpr,
        y: localY * state.prose.dpr,
        vx: (nx * intensity * randomFloat(2.5, 7.5) + randomFloat(-1.3, 1.3)) * state.prose.dpr,
        vy: (ny * intensity * randomFloat(2.5, 7.5) + randomFloat(-1.3, 1.3)) * state.prose.dpr,
        life: randomFloat(16, 38),
        maxLife: randomFloat(16, 38),
      });
    }

    if (state.prose.particles.length > 520) {
      state.prose.particles.splice(0, state.prose.particles.length - 520);
    }
  }

  function spawnSolarFlares(progress) {
    const inRange = progress >= 0.12 && progress <= 0.98;
    if (!inRange) {
      state.prose.flareWasInRange = false;
      state.prose.flareCooldown = 0;
      return;
    }

    // Ensure the viewer actually sees flares: schedule the first one shortly after
    // entering the prose region, then use longer random intervals.
    if (!state.prose.flareWasInRange) {
      state.prose.flareWasInRange = true;
      state.prose.flareCooldown = 45 + Math.floor(randomFloat(0, 120)); // ~0.75s..2.75s
    }

    state.prose.flareCooldown -= 1;
    if (state.prose.flareCooldown > 0) return;

    const count = Math.random() < 0.09 ? 2 : 1;
    for (let i = 0; i < count; i += 1) {
      const vx = randomFloat(-0.09, 0.09);
      const vy = randomFloat(-0.09, 0.09);
      const life = randomFloat(320, 560);
      state.prose.flares.push({
        x: randomFloat(0.08, 0.92) * state.prose.width / state.prose.dpr,
        y: randomFloat(0.05, 0.94) * state.prose.height / state.prose.dpr,
        radius: randomFloat(20, 34),
        targetRadius: randomFloat(86, 148),
        power: randomFloat(0.4, 0.9),
        peakPower: randomFloat(1.4, 2.5),
        life,
        lifeMax: life,
        age: 0,
        warmup: randomFloat(220, 360),
        vx,
        vy,
        phase: randomFloat(0, Math.PI * 2),
      });
    }

    // Space out subsequent bursts (still rare, but not "wait forever").
    state.prose.flareCooldown = state.pointer.down
      ? 300 + Math.floor(randomFloat(0, 520)) // ~5s..14s
      : 380 + Math.floor(randomFloat(0, 740)); // ~6s..19s

    if (state.prose.flares.length > 10) {
      state.prose.flares.splice(0, state.prose.flares.length - 10);
    }
  }

  function updateProseParticles() {
    proseCtx.clearRect(0, 0, state.prose.width, state.prose.height);

    for (let i = state.prose.particles.length - 1; i >= 0; i -= 1) {
      const p = state.prose.particles[i];
      p.life -= 1;
      if (p.life <= 0) {
        state.prose.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;

      const alpha = clamp(p.life / p.maxLife, 0, 1);
      proseCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      proseCtx.fillRect(p.x, p.y, state.prose.dpr * 1.4, state.prose.dpr * 1.4);
    }
  }

  function updateProse(progress) {
    const shellRect = proseShell.getBoundingClientRect();
    const activeField =
      state.pointer.x >= shellRect.left &&
      state.pointer.x <= shellRect.right &&
      state.pointer.y >= shellRect.top &&
      state.pointer.y <= shellRect.bottom;

    const radius = 108 + progress * 86 + (state.pointer.down ? 40 : 0);
    const force =
      0.18 +
      clamp(state.pointer.speed / 1500, 0, 0.75) +
      progress * 0.22 +
      (state.pointer.down ? 0.35 : 0.04);
    const nearChars = [];
    const nearFlareChars = [];

    state.prose.mutateCooldown = Math.max(0, state.prose.mutateCooldown - 1);
    state.prose.flareMutateCooldown = Math.max(0, state.prose.flareMutateCooldown - 1);

    spawnSolarFlares(progress);

    // Advance word-level settle/drift timers once per frame.
    for (let w = 0; w < state.prose.wordsAll.length; w += 1) {
      const word = state.prose.wordsAll[w];
      if (word.settleFrames > 0) word.settleFrames -= 1;
      if (word.variantFrames > 0) {
        word.variantFrames -= 1;
        if (word.variantFrames <= 0) {
          word.variantFrames = 0;
          word.variant = null;
        }
      }
      if (word.mode === "drift" && word.driftArmed && word.settleFrames <= 0 && !word.variant) {
        // One-shot drift after a disturbance settles.
        if (Math.random() < word.driftChance) {
          applyWordVariant(word);
        } else {
          word.driftArmed = false;
        }
      }
    }

    state.prose.chars.forEach((charState) => {
      charState.vx += -charState.x * 0.046;
      charState.vy += -charState.y * 0.046;
      charState.influence = 0;

      if (charState.healFrames > 0) charState.healFrames -= 1;

      if (activeField) {
        const currentX = shellRect.left + charState.lx + charState.x;
        const currentY = shellRect.top + charState.ly + charState.y;
        const dx = currentX - state.pointer.x;
        const dy = currentY - state.pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < radius) {
          const influence = 1 - dist / radius;
          charState.influence = influence;
          const nx = dx / dist;
          const ny = dy / dist;
          const impulse = influence * influence * (state.pointer.down ? 8.4 : 3.9) * force;
          charState.vx += nx * impulse;
          charState.vy += ny * impulse;
          markDisturbed(charState, (state.pointer.down ? 150 : 95) + Math.floor(influence * 55));

          if (charState.base !== "\u00A0" && influence > 0.22) {
            nearChars.push(charState);
          }

          if (charState.base !== "\u00A0" && Math.random() < (state.pointer.down ? 0.11 : 0.06) * influence) {
            charState.scrambleFrames = Math.max(charState.scrambleFrames, 4 + Math.floor(influence * 11));
            markDisturbed(charState, 130 + Math.floor(influence * 80));
          }

          if (Math.random() < (state.pointer.down ? 0.3 : 0.13) * influence) {
            emitProseParticles(
              charState.lx + charState.x,
              charState.ly + charState.y,
              nx,
              ny,
              impulse * 0.15
            );
          }
        }
      }

      // Autonomous "solar flare" interference events.
      if (state.prose.flares.length > 0) {
        const localX = charState.lx + charState.x;
        const localY = charState.ly + charState.y;
        for (let f = 0; f < state.prose.flares.length; f += 1) {
          const flare = state.prose.flares[f];
          const fdx = localX - flare.x;
          const fdy = localY - flare.y;
          const fdist = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
          if (fdist >= flare.radius) continue;

          const finf = 1 - fdist / flare.radius;
          const fnx = fdx / fdist;
          const fny = fdy / fdist;
          const rampRaw = clamp(flare.age / flare.warmup, 0, 1);
          const ramp = rampRaw * rampRaw * rampRaw;
          const fImpulse = finf * finf * flare.power * ramp;
          charState.vx += fnx * fImpulse;
          charState.vy += fny * fImpulse;
          charState.influence = Math.max(charState.influence, finf * 0.9);
          markDisturbed(charState, 170 + Math.floor(ramp * 120));

          if (charState.base !== "\u00A0" && finf > 0.28 && ramp > 0.08) {
            nearFlareChars.push(charState);
            if (Math.random() < 0.07 * finf * ramp) {
              charState.scrambleFrames = Math.max(charState.scrambleFrames, 3 + Math.floor(finf * 7));
            }
          }
        }
      }

      charState.vx *= 0.78;
      charState.vy *= 0.78;
      charState.x += charState.vx;
      charState.y += charState.vy;

      charState.x = clamp(charState.x, -32, 32);
      charState.y = clamp(charState.y, -32, 32);

      if (charState.scrambleFrames > 0 && charState.base !== "\u00A0") {
        charState.scrambleFrames -= 1;
        if (Math.random() < 0.55) {
          if (Math.random() < 0.46) {
            charState.span.textContent = REDACT_POOL[Math.floor(Math.random() * REDACT_POOL.length)];
          } else {
            charState.span.textContent = SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
          }
        }
      } else if (charState.span.textContent !== charState.base) {
        charState.span.textContent = charState.base;
      }

      // Universal healing: after disturbed text "sits" for a moment, it drifts back to original.
      if (
        charState.base !== charState.original &&
        charState.base !== "\u00A0" &&
        charState.healFrames <= 0 &&
        (!charState.word || charState.word.variantFrames <= 0) &&
        charState.influence < 0.06 &&
        !state.pointer.down
      ) {
        const chance = charState.word ? charState.word.healChance : 0.12;
        if (Math.random() < chance) {
          settleChar(charState);
        }
      }

      const intensity = (Math.abs(charState.x) + Math.abs(charState.y)) / 68 + charState.influence * 0.7;
      const scale = 1 + charState.influence * 0.16 + charState.sizeJitter * 0.18;
      charState.span.style.transform = `translate(${charState.x}px, ${charState.y}px) rotate(${charState.x * 0.22}deg) scale(${scale})`;
      charState.span.style.opacity = `${clamp(0.5 + intensity, 0.35, 1)}`;
    });

    if (activeField && nearChars.length > 8 && Math.random() < (state.pointer.down ? 0.34 : 0.12)) {
      const picks = [];
      const pickCount = Math.min(8, 3 + Math.floor(randomFloat(0, 5)));
      for (let i = 0; i < pickCount; i += 1) {
        const candidate = nearChars[Math.floor(Math.random() * nearChars.length)];
        if (!candidate || candidate.base === "\u00A0") continue;
        picks.push(candidate);
      }

      if (picks.length > 2) {
        const lastChar = picks[picks.length - 1].span.textContent;
        for (let i = picks.length - 1; i > 0; i -= 1) {
          picks[i].span.textContent = picks[i - 1].span.textContent;
          picks[i].scrambleFrames = Math.max(picks[i].scrambleFrames, 2);
        }
        picks[0].span.textContent = lastChar;
      }
    }

    if (activeField && Math.random() < 0.045) {
      state.prose.chars.forEach((charState) => {
        if (charState.base === "\u00A0") return;
        if (charState.influence > 0.72 && Math.random() < 0.02) {
          charState.span.textContent = REDACT_POOL[Math.floor(Math.random() * REDACT_POOL.length)];
          charState.scrambleFrames = Math.max(charState.scrambleFrames, 4);
        }
      });
    }

    // Persistent low-rate mutation: hovered text can remain subtly altered.
    if (
      activeField &&
      state.prose.mutateCooldown === 0 &&
      nearChars.length > 10 &&
      Math.random() < (state.pointer.down ? 0.12 : 0.06)
    ) {
      const count = state.pointer.down ? 2 : 1;
      for (let i = 0; i < count; i += 1) {
        const candidate = nearChars[Math.floor(Math.random() * nearChars.length)];
        if (!candidate || candidate.base === "\u00A0") continue;
        candidate.base = mutateBaseChar(candidate.base);
        candidate.span.textContent = candidate.base;
        markDisturbed(candidate, 160 + Math.floor(randomFloat(0, 140)));
      }
      state.prose.mutateCooldown = state.pointer.down ? 16 : 26;
    }

    // Word-level drift (readable substitutions) for the second prose block.
    if (activeField && nearChars.length > 14) {
      const chance =
        (state.pointer.down ? 0.22 : 0.14) *
        clamp(state.pointer.speed / 1200, 0.1, 1) *
        clamp(progress * 1.1, 0.25, 1);
      if (Math.random() < chance) {
        shiftSecondProseWord(nearChars, false);
      }
    }

    if (nearFlareChars.length > 6 && state.prose.flareMutateCooldown === 0 && Math.random() < 0.06) {
      const count = 1 + Math.floor(randomFloat(0, 3));
      for (let i = 0; i < count; i += 1) {
        const candidate = nearFlareChars[Math.floor(Math.random() * nearFlareChars.length)];
        if (!candidate || candidate.base === "\u00A0") continue;
        candidate.base = mutateBaseChar(candidate.base);
        candidate.span.textContent = candidate.base;
        markDisturbed(candidate, 220 + Math.floor(randomFloat(0, 160)));
      }
      state.prose.flareMutateCooldown = 68 + Math.floor(randomFloat(0, 90));
    }

    for (let i = state.prose.flares.length - 1; i >= 0; i -= 1) {
      const flare = state.prose.flares[i];
      flare.age += 1;
      flare.life -= 1;
      const warm = clamp(flare.age / flare.warmup, 0, 1);
      const warmCurve = warm * warm * warm;
      const lifeRatio = clamp(flare.age / flare.lifeMax, 0, 1);
      const slyDrift = 0.08 + warmCurve * 0.92;
      const driftX = Math.sin(flare.phase + flare.age * 0.015) * 0.022;
      const driftY = Math.cos(flare.phase * 1.3 + flare.age * 0.013) * 0.022;
      flare.x += (flare.vx + driftX) * slyDrift;
      flare.y += (flare.vy + driftY) * slyDrift;
      flare.x = clamp(flare.x, 8, state.prose.width / state.prose.dpr - 8);
      flare.y = clamp(flare.y, 8, state.prose.height / state.prose.dpr - 8);
      flare.radius += (flare.targetRadius - flare.radius) * (0.0026 + warmCurve * 0.0074);
      flare.power += (flare.peakPower - flare.power) * (0.002 + warmCurve * 0.006);
      if (lifeRatio > 0.76) {
        flare.power *= 0.992 - (lifeRatio - 0.76) * 0.01;
      }

      if (warmCurve > 0.24 && Math.random() < 0.045 * warmCurve) {
        emitProseParticles(
          flare.x + randomFloat(-4, 4),
          flare.y + randomFloat(-4, 4),
          randomFloat(-1, 1),
          randomFloat(-1, 1),
          randomFloat(0.3, 0.72)
        );
      }

      if (flare.life <= 0 || flare.power < 0.2) {
        state.prose.flares.splice(i, 1);
      }
    }

    // Occasional semantic drift during flares (feels like an external authoring hand).
    if (nearFlareChars.length > 18 && Math.random() < 0.06) {
      shiftSecondProseWord(nearFlareChars, true);
    }

    updateProseAppends(progress);
    updateProseParticles();
  }

  function updateEnd(progress) {
    const fadeIn = clamp((progress - 0.12) * 2.8, 0, 1);
    const fadeOut = clamp((progress - 0.72) * 3.8, 0, 1);
    const opacity = fadeIn * (1 - fadeOut);
    endFragment.style.opacity = `${opacity}`;

    if (Math.random() < 0.018 && opacity > 0.22) {
      setTextFxText(state.textFx[0], scrambleText(BASE_END));
    } else if (Math.random() < 0.024) {
      setTextFxText(state.textFx[0], BASE_END);
    }
  }

  function animate(timestamp) {
    const wordProgress = sceneProgress(sceneWords);
    const proseProgress = sceneProgress(sceneProse);
    const endProgress = sceneProgress(sceneEnd);

    // Impact frame: fire at the glitch transition (center-cluster -> spiral).
    // This is the same boundary used in refreshWordTargets().
    // Rearm when the user scrolls back up.
    const impactAt = 0.205;
    if (wordProgress < 0.08) state.impact.armed = true;
    if (
      state.impact.armed &&
      state.impact.lastWordProgress < impactAt &&
      wordProgress >= impactAt
    ) {
      triggerImpactFlash();
      state.impact.armed = false;
    }
    state.impact.lastWordProgress = wordProgress;

    updateWords(wordProgress, timestamp);
    updateProse(proseProgress);
    updateEnd(endProgress);
    updateTextFx(timestamp);

    state.frameId = requestAnimationFrame(animate);
  }

  window.addEventListener("pointerdown", () => {
    state.pointer.down = true;
  });

  window.addEventListener("pointerup", () => {
    state.pointer.down = false;
  });

  window.addEventListener("pointermove", (event) => {
    const now = performance.now();
    const dt = Math.max(8, now - state.pointer.lastTime);
    const dx = event.clientX - state.pointer.x;
    const dy = event.clientY - state.pointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    state.pointer.speed = (dist / dt) * 1000;
    state.pointer.lastTime = now;
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
  });

  window.addEventListener("resize", cacheProseCenters);
  initWords();
  refreshWordTargets(sceneProgress(sceneWords), performance.now());
  buildShiftPools();
  splitProseIntoChars();
  state.textFx = [buildTextFx(endFragment, BASE_END, 160, 30, 0.06)];
  state.frameId = requestAnimationFrame(animate);
})();
