(() => {
  'use strict';

  const container = document.querySelector('#veloptix-canvas');
  if (!container) return;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const palette = ['#00C5D5', '#005669'];
  const targetCellSize = 20;
  const textScaleFactor = 1;
  const mouseRadius = 150;
  const maxSpeed = 0.25;
  const minSpeed = 0.01;
  const baseOpacityMin = 30;
  const baseOpacityMax = 255;

  let width = 1;
  let height = 1;
  let cols = 5;
  let rows = 5;
  let cellWidth = 1;
  let cellHeight = 1;
  let animationFrame = 0;
  let pointerActive = false;
  let pointerX = -Infinity;
  let pointerY = -Infinity;

  let digits = [];
  let originalDigits = [];
  let morphTarget = [];
  let opacity = [];
  let speed = [];

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const map = (value, inMin, inMax, outMin, outMax) => {
    const amount = clamp((value - inMin) / (inMax - inMin), 0, 1);
    return outMin + (outMax - outMin) * amount;
  };
  const lerp = (start, end, amount) => start + (end - start) * amount;

  function initialiseGrid() {
    cols = Math.max(Math.floor(width / targetCellSize), 5);
    rows = Math.max(Math.floor(height / targetCellSize), 5);
    cellWidth = width / cols;
    cellHeight = height / rows;

    digits = [];
    originalDigits = [];
    morphTarget = [];
    opacity = [];
    speed = [];

    for (let column = 0; column < cols; column += 1) {
      digits[column] = [];
      originalDigits[column] = [];
      morphTarget[column] = [];
      opacity[column] = [];
      speed[column] = [];

      for (let row = 0; row < rows; row += 1) {
        const digit = Math.floor(Math.random() * 10);
        digits[column][row] = digit;
        originalDigits[column][row] = digit;
        morphTarget[column][row] = digit;
        opacity[column][row] = Math.random() * 100;
        speed[column][row] = (Math.random() * 0.5 + 0.5) * (Math.random() < 0.5 ? -1 : 1);
      }
    }
  }

  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    if (nextWidth === width && nextHeight === height && canvas.width > 1) return;

    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    initialiseGrid();
  }

  function updatePointer(event) {
    const point = event.touches?.[0] || event;
    const rect = canvas.getBoundingClientRect();
    pointerX = point.clientX - rect.left;
    pointerY = point.clientY - rect.top;
    pointerActive = pointerX >= 0 && pointerX <= rect.width && pointerY >= 0 && pointerY <= rect.height;
  }

  function deactivatePointer() {
    pointerActive = false;
    pointerX = -Infinity;
    pointerY = -Infinity;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `${Math.min(cellWidth, cellHeight) * textScaleFactor}px "IBM Plex Mono", monospace`;

    for (let column = 0; column < cols; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        opacity[column][row] += speed[column][row];
        if (opacity[column][row] > 100) {
          opacity[column][row] = 100;
          speed[column][row] *= -1;
        } else if (opacity[column][row] < 0) {
          opacity[column][row] = 0;
          speed[column][row] *= -1;
        }

        const x = column * cellWidth + cellWidth / 2;
        const y = row * cellHeight + cellHeight / 2;
        const distance = pointerActive ? Math.hypot(pointerX - x, pointerY - y) : Infinity;
        const baseOpacity = map(opacity[column][row], 0, 100, baseOpacityMin, baseOpacityMax);
        let renderedOpacity = baseOpacity;

        if (distance < mouseRadius) {
          const amount = map(distance, 0, mouseRadius, maxSpeed, minSpeed);
          digits[column][row] = lerp(digits[column][row], morphTarget[column][row], amount);

          if (Math.abs(digits[column][row] - morphTarget[column][row]) < 0.5) {
            morphTarget[column][row] = Math.floor(Math.random() * 10);
          }

          const boostedOpacity = map(distance, 0, mouseRadius, 400, baseOpacityMin);
          const mixFactor = map(distance, 0, mouseRadius, 1, 0);
          renderedOpacity = lerp(50, boostedOpacity, mixFactor);
        } else {
          digits[column][row] = lerp(digits[column][row], originalDigits[column][row], 0.3);
        }

        const colour = palette[(column + row) % palette.length];
        const red = Number.parseInt(colour.slice(1, 3), 16);
        const green = Number.parseInt(colour.slice(3, 5), 16);
        const blue = Number.parseInt(colour.slice(5, 7), 16);
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${clamp(renderedOpacity / 255, 0, 1)})`;
        context.fillText(String(Math.trunc(digits[column][row])), x, y);
      }
    }

    animationFrame = window.requestAnimationFrame(draw);
  }

  container.addEventListener('pointermove', updatePointer, { passive: true });
  container.addEventListener('pointerenter', updatePointer, { passive: true });
  container.addEventListener('pointerleave', deactivatePointer, { passive: true });
  container.addEventListener('touchstart', updatePointer, { passive: true });
  container.addEventListener('touchmove', updatePointer, { passive: true });
  container.addEventListener('touchend', deactivatePointer, { passive: true });

  const resizeObserver = new ResizeObserver(() => window.requestAnimationFrame(resizeCanvas));
  resizeObserver.observe(container);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
    } else {
      animationFrame = window.requestAnimationFrame(draw);
    }
  });

  resizeCanvas();
  draw();
})();
