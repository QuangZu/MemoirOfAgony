// about-main.js — Infinite Kinetic Grid (vanilla JS)
class GridApp {
  constructor(canvasId = 'gridCanvas') {
    // Configuration
    this.GRID_COLS = 5;
    this.GRID_ROWS = 2;
    this.CELL_WIDTH = 300; // px - decreased from 400
    this.CELL_HEIGHT = 300; // px - decreased from 500
    this.GAP = 100;

    this.TOTAL_GRID_WIDTH = this.GRID_COLS * (this.CELL_WIDTH + this.GAP);
    this.TOTAL_GRID_HEIGHT = this.GRID_ROWS * (this.CELL_HEIGHT + this.GAP);

    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Camera / physics
    this.currentCameraX = 0;
    this.currentCameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.momentumX = 0;
    this.momentumY = 0;
    
    // Boundary limits for 6×6 grid (3 grids in each direction from center)
    this.MAX_SCROLL_X = this.TOTAL_GRID_WIDTH * 3;
    this.MAX_SCROLL_Y = this.TOTAL_GRID_HEIGHT * 3;
    this.MIN_SCROLL_X = -this.TOTAL_GRID_WIDTH * 3;
    this.MIN_SCROLL_Y = -this.TOTAL_GRID_HEIGHT * 3;

    // Drag state
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    this.images = [];
    this.slots = []; // base positions for each image

    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.pointerDownSlot = null;
    this.pointerDownPos = { x: 0, y: 0 };
    this.isPotentialDrag = false;
    this.clickThreshold = 6; // px threshold to consider click vs drag

    this._boundResize = this._onResize.bind(this);
    this._boundPointerDown = this._onPointerDown.bind(this);
    this._boundPointerMove = this._onPointerMove.bind(this);
    this._boundPointerUp = this._onPointerUp.bind(this);

    this.lastFrame = performance.now();

    // Glitch effect settings
    this.glitchIntensity = 8; // Pixel offset for glitch
    this.glitchLayers = 3; // Number of glitch clones
    this.redShift = 4; // Chromatic aberration strength
    
    // Scroll velocity for glitch effect
    this.scrollVelocityX = 0;
    this.scrollVelocityY = 0;
    this.lastCameraX = 0;
    this.lastCameraY = 0;

    // Click vignette pulse
    this.vignettePulse = 0; // 0 to 1, for visual feedback on click
    this.vignetteTarget = 0;

    // Modal zoom state
    this.modalActive = false;
    this.modalSlot = null;
    this.modalScale = 0;
    this.modalTargetScale = 0;

    // Magnetic cursor effect (screen follows cursor with elastic force)
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorOffsetX = 0; // camera offset from cursor
    this.cursorOffsetY = 0;
    this.magneticStrength = 0.05; // how much screen follows cursor

    // Hover state
    this.hoveredSlotIndex = null;
  }

  async start() {
    await this._preloadImages();
    this._setupGridSlots();
    this._attachListeners();
    this._onResize();
    requestAnimationFrame(this._loop.bind(this));
  }

  // Preload assets: skip Asset 2 and Asset 3 (they don't exist), duplicate 1 and 4 to fill 10 slots
  _preloadImages() {
    const promises = [];
    const assetNumbers = [1, 4, 5, 6, 7, 8, 9, 10, 1, 4]; // 10 assets to fill 5×2 grid (duplicating 1 and 4)
    
    for (let i of assetNumbers) {
      const src = `grid/Asset ${i}.png`;
      promises.push(new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      }));
    }

    return Promise.all(promises).then(imgs => {
      this.images = imgs;
    });
  }

  _setupGridSlots() {
    this.slots = [];
    // Assign each asset to slot [col,row] — no randomness
    for (let i = 0; i < this.images.length; i++) {
      const col = i % this.GRID_COLS;
      const row = Math.floor(i / this.GRID_COLS);
      const baseX = col * (this.CELL_WIDTH + this.GAP);
      const baseY = row * (this.CELL_HEIGHT + this.GAP);
      this.slots.push({ baseX, baseY, img: this.images[i], col, row,
        scale: 1, targetScale: 1, isZooming: false, downscale: 1.0 // downscale: adjust per slot (e.g., 0.8 for smaller)
      });
    }
  }

  _attachListeners() {
    window.addEventListener('resize', this._boundResize);
    // pointer events for mouse/touch unified
    this.canvas.addEventListener('pointerdown', this._boundPointerDown);
    window.addEventListener('pointermove', this._boundPointerMove);
    window.addEventListener('pointerup', this._boundPointerUp);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _onPointerDown(e) {
    this.isPotentialDrag = true;
    this.isDragging = false;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.momentumX = 0;
    this.momentumY = 0;
    this.pointerDownTime = performance.now();
    this.prevMoveTime = this.pointerDownTime;
    this.prevPointerX = this.lastPointerX;
    this.prevPointerY = this.lastPointerY;
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.pointerDownSlot = this._hitTest(e.clientX, e.clientY);
    // capture pointer to continue receiving events
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }

  _onPointerMove(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Update mouse position for magnetic cursor effect
    this.mouseX = x;
    this.mouseY = y;

    // If potential drag, detect movement threshold to start actual drag
    if (this.isPotentialDrag && !this.isDragging) {
      const dx = x - this.pointerDownPos.x;
      const dy = y - this.pointerDownPos.y;
      if (Math.hypot(dx, dy) > this.clickThreshold) {
        this.isDragging = true;
        this.isPotentialDrag = false;
        this.canvas.classList.add('grabbing');
      }
    }

    if (this.isDragging) {
      const dx = x - this.lastPointerX;
      const dy = y - this.lastPointerY;
      // Dragging background moves the camera in same direction
      this.targetCameraX += dx;
      this.targetCameraY += dy;
      
      // Apply boundary limits to prevent scrolling outside 6×6 grid
      this.targetCameraX = Math.max(this.MIN_SCROLL_X, Math.min(this.MAX_SCROLL_X, this.targetCameraX));
      this.targetCameraY = Math.max(this.MIN_SCROLL_Y, Math.min(this.MAX_SCROLL_Y, this.targetCameraY));
      // approximate instantaneous momentum to use when release
      const now = performance.now();
      const dt = Math.max(1, now - this.prevMoveTime);
      this.momentumX = (x - this.prevPointerX) / dt * 16; // normalized per-frame estimate
      this.momentumY = (y - this.prevPointerY) / dt * 16;
      this.prevMoveTime = now;
      this.prevPointerX = x;
      this.prevPointerY = y;
      this.lastPointerX = x;
      this.lastPointerY = y;
    } else {
      // Hover state: change cursor to pointer when over an asset
      const hitIndex = this._hitTest(x, y);
      this.hoveredSlotIndex = hitIndex;
      this.canvas.style.cursor = (hitIndex !== null) ? 'pointer' : 'grab';
    }
  }

  _onPointerUp(e) {
    // release pointer capture
    if (e.target && e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    const upPos = { x: e.clientX, y: e.clientY };
    const moved = Math.hypot(upPos.x - this.pointerDownPos.x, upPos.y - this.pointerDownPos.y);

    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.classList.remove('grabbing');
      // momentum remains and will decay in the update loop
    } else {
      // Check if clicking modal to close
      if (this.modalActive && moved <= this.clickThreshold) {
        this._closeModal();
      }
      // It was a click if movement small and we had a pointerDownSlot
      else if (moved <= this.clickThreshold && this.pointerDownSlot !== null) {
        // verify slot still under pointer
        const hit = this._hitTest(e.clientX, e.clientY);
        if (hit === this.pointerDownSlot) {
          this._triggerZoomOnSlot(hit);
        }
      }
    }

    this.isPotentialDrag = false;
    this.pointerDownSlot = null;
  }

  _loop(now) {
    const dt = now - this.lastFrame;
    this.lastFrame = now;
    this.update(dt / 1000);
    this.draw();
    requestAnimationFrame(this._loop.bind(this));
  }

  // Lerp helper
  _lerp(a, b, t) { return a + (b - a) * t; }

  update(deltaSec) {
    // If not dragging, apply momentum to target camera to produce glide
    if (!this.isDragging) {
      // apply momentum one frame at a time
      this.targetCameraX += this.momentumX;
      this.targetCameraY += this.momentumY;
      
      // Apply boundary limits to momentum scrolling
      this.targetCameraX = Math.max(this.MIN_SCROLL_X, Math.min(this.MAX_SCROLL_X, this.targetCameraX));
      this.targetCameraY = Math.max(this.MIN_SCROLL_Y, Math.min(this.MAX_SCROLL_Y, this.targetCameraY));
      
      // Stop momentum if hitting boundary
      if (this.targetCameraX === this.MIN_SCROLL_X || this.targetCameraX === this.MAX_SCROLL_X) {
        this.momentumX = 0;
      }
      if (this.targetCameraY === this.MIN_SCROLL_Y || this.targetCameraY === this.MAX_SCROLL_Y) {
        this.momentumY = 0;
      }
      
      // friction
      this.momentumX *= 0.92;
      this.momentumY *= 0.92;
      if (Math.abs(this.momentumX) < 0.001) this.momentumX = 0;
      if (Math.abs(this.momentumY) < 0.001) this.momentumY = 0;
    }

    // Smooth camera using lerp
    this.currentCameraX = this._lerp(this.currentCameraX, this.targetCameraX, 0.1);
    this.currentCameraY = this._lerp(this.currentCameraY, this.targetCameraY, 0.1);
    
    // Calculate scroll velocity for glitch effect
    this.scrollVelocityX = this.currentCameraX - this.lastCameraX;
    this.scrollVelocityY = this.currentCameraY - this.lastCameraY;
    this.lastCameraX = this.currentCameraX;
    this.lastCameraY = this.currentCameraY;

    // We keep camera values unbounded (wrapping is in render)
    
    // Magnetic cursor effect: screen gently follows cursor movement
    if (!this.isDragging && !this.modalActive) {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (this.mouseX - centerX) * this.magneticStrength;
      const deltaY = (this.mouseY - centerY) * this.magneticStrength;
      const targetOffsetX = -deltaX; // invert for parallax effect
      const targetOffsetY = -deltaY;
      this.cursorOffsetX = this._lerp(this.cursorOffsetX, targetOffsetX, 0.08);
      this.cursorOffsetY = this._lerp(this.cursorOffsetY, targetOffsetY, 0.08);
    }

    // Update per-slot scaling animations
    for (let s = 0; s < this.slots.length; s++) {
      const slot = this.slots[s];
      // Hover animation
      const isHovered = (this.hoveredSlotIndex === s && !this.isDragging && !this.modalActive);
      slot.hoverScale = this._lerp(slot.hoverScale || 1, isHovered ? 1.08 : 1, 0.2);
      
      slot.scale = this._lerp(slot.scale || 1, slot.targetScale || 1, 0.15);
      // snap when close
      if (Math.abs(slot.scale - slot.targetScale) < 0.01) slot.scale = slot.targetScale;
    }

    // Animate vignette pulse
    this.vignettePulse = this._lerp(this.vignettePulse, this.vignetteTarget, 0.2);
    if (Math.abs(this.vignettePulse - this.vignetteTarget) < 0.01) this.vignettePulse = this.vignetteTarget;

    // Modal zoom animation
    this.modalScale = this._lerp(this.modalScale, this.modalTargetScale, 0.18);
  }

  // Hit test pointer (client coords) against visible slots. Returns slot index or null
  _hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cw = this.canvas.clientWidth || window.innerWidth;
    const ch = this.canvas.clientHeight || window.innerHeight;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      
      // Check all tiles in 6×6 grid (same as draw logic) for infinite scrolling
      for (let tx = -3; tx <= 3; tx++) {
        for (let ty = -3; ty <= 3; ty++) {
          const baseX = slot.baseX + (tx * this.TOTAL_GRID_WIDTH);
          const baseY = slot.baseY + (ty * this.TOTAL_GRID_HEIGHT);
          const drawX = baseX + this.currentCameraX;
          const drawY = baseY + this.currentCameraY;
          
          if (x >= drawX && x <= drawX + this.CELL_WIDTH && 
              y >= drawY && y <= drawY + this.CELL_HEIGHT) {
            return i;
          }
        }
      }
    }
    return null;
  }

  // Wrap coordinate for infinite scrolling without aggressive culling
  _wrapCoord(pos, gridSize, canvasSize) {
    // Instead of culling, just return the position for rendering
    // The 3x3 tiling in draw() handles the infinite effect
    return pos;
  }

  _triggerZoomOnSlot(index) {
    const slot = this.slots[index];
    if (!slot) return;
    
    // Open modal zoom
    this.modalActive = true;
    this.modalSlot = slot;
    this.modalScale = 0;
    this.modalTargetScale = 1;
    this.canvas.style.cursor = 'zoom-out';

    // Trigger vignette pulse
    this.vignetteTarget = 0.8;

    // Play click sound
    this._playClickSound();
  }

  _closeModal() {
    if (!this.modalActive) return;
    this.modalTargetScale = 0;
    this.vignetteTarget = 0;
    setTimeout(() => {
      this.modalActive = false;
      this.modalSlot = null;
      this.canvas.style.cursor = 'grab';
    }, 300);
  }

  _playClickSound() {
    // Quick click sound feedback (you can replace with actual audio file)
    try {
      const audio = new Audio('audio/click.mp3'); // Replace with your sound file path
      audio.volume = 0.3;
      audio.play().catch(err => {}); // ignore if audio fails
    } catch (e) {}
  }

  draw() {
    const ctx = this.ctx;
    const cw = this.canvas.clientWidth || window.innerWidth;
    const ch = this.canvas.clientHeight || window.innerHeight;
    ctx.clearRect(0, 0, cw, ch);

    // velocity used by ghost effect
    const velocityX = this.targetCameraX - this.currentCameraX;
    const velocityY = this.targetCameraY - this.currentCameraY;

    // Apply magnetic cursor offset to camera
    const effectiveCameraX = this.currentCameraX + this.cursorOffsetX;
    const effectiveCameraY = this.currentCameraY + this.cursorOffsetY;

    // Calculate glitch offset based on scroll velocity (opposite direction)
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    const glitchStrength = Math.min(speed * 0.8, 12); // Cap at 12px
    const glitchOffsetX = velocityX !== 0 ? -Math.sign(velocityX) * glitchStrength : 0;
    const glitchOffsetY = velocityY !== 0 ? -Math.sign(velocityY) * glitchStrength : 0;

    // For each slot, draw with infinite tiling
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      
      const scale = (slot.scale || 1) * (slot.hoverScale || 1) * (slot.downscale || 1);
      const allowOverflow = scale > 1.01;

      // Draw tiles in a 6×6 grid for extended infinite scrolling with boundaries
      for (let tx = -3; tx <= 3; tx++) {
        for (let ty = -3; ty <= 3; ty++) {
          const baseX = slot.baseX + (tx * this.TOTAL_GRID_WIDTH);
          const baseY = slot.baseY + (ty * this.TOTAL_GRID_HEIGHT);
          const drawX = baseX + effectiveCameraX;
          const drawY = baseY + effectiveCameraY;

          // Only draw if potentially visible (with generous margin)
          const cellSize = Math.max(this.CELL_WIDTH, this.CELL_HEIGHT) * scale;
          if (drawX + cellSize > -200 && drawX < cw + 200 &&
              drawY + cellSize > -200 && drawY < ch + 200) {
            ctx.save();
            
            // Draw red glitch layer when scrolling (opposite direction)
            if (glitchStrength > 0.5) {
              ctx.globalAlpha = Math.min(glitchStrength / 12, 0.35);
              ctx.globalCompositeOperation = 'screen';
              ctx.filter = 'brightness(150%) contrast(140%) hue-rotate(350deg) saturate(250%) blur(1px)';
              this._drawImageAt(slot.img, drawX + glitchOffsetX, drawY + glitchOffsetY, scale, allowOverflow);
            }
            
            // Draw main image
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.filter = 'none';
            this._drawImageAt(slot.img, drawX, drawY, scale, allowOverflow);
            ctx.restore();
          }
        }
      }
    }

    // Draw vignette pulse overlay
    if (this.vignettePulse > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${this.vignettePulse * 0.75})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    }

    // Draw modal zoom overlay
    if (this.modalActive && this.modalSlot && this.modalScale > 0.01) {
      ctx.save();
      
      // Calculate modal image size
      const maxSize = Math.min(cw, ch) * 1.6;
      const img = this.modalSlot.img;
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;
      const imgRatio = imgW / imgH;
      
      let modalW, modalH;
      if (imgRatio > 1) {
        modalW = maxSize;
        modalH = maxSize / imgRatio;
      } else {
        modalH = maxSize;
        modalW = maxSize * imgRatio;
      }
      
      // Scale animation
      modalW *= this.modalScale;
      modalH *= this.modalScale;
      
      // Center position
      const modalX = (cw - modalW) / 2;
      const modalY = (ch - modalH) / 2;
      
      // Draw with glitch effect (no glow)
      ctx.globalAlpha = this.modalScale;
      
      // Red glitch layer
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'brightness(160%) contrast(150%) hue-rotate(350deg) saturate(280%)';
      const redOff = 6;
      ctx.drawImage(img, modalX + redOff, modalY + redOff * 0.3, modalW, modalH);
      
      // Main image
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.drawImage(img, modalX, modalY, modalW, modalH);
      
      // Draw BACK button on modal (repositioned to left-top)
      const btnW = 80;
      const btnH = 20;
      const btnX = modalX + 20;
      const btnY = modalY + 60;
      
      ctx.globalAlpha = this.modalScale;
      ctx.fillStyle = 'rgba(222, 0, 0, 0.9)';
      ctx.fillRect(btnX, btnY, btnW, btnH);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px "TT Travels Next Trial Bold", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BACK', btnX + btnW/2, btnY + btnH/2);
      
      ctx.restore();
    }
  }

  // Draw image with aspect-ratio preservation (contain behavior - full image visible)
  // scale: extra scale multiplier (1 = normal). allowOverflow: when true allow drawing outside cell bounds (useful for zoom)
  _drawImageAt(img, x, y, scale = 1, allowOverflow = false) {
    const cellW = this.CELL_WIDTH;
    const cellH = this.CELL_HEIGHT;
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;

    // Calculate scale to fit the entire image within the cell (like CSS object-fit: contain)
    const coverX = cellW / imgW;
    const coverY = cellH / imgH;
    const coverScale = Math.min(coverX, coverY); // Changed from Math.max to Math.min for contain behavior

    const drawW = imgW * coverScale * scale;
    const drawH = imgH * coverScale * scale;

    // Center the image within the cell
    const offsetX = (cellW - drawW) / 2;
    const offsetY = (cellH - drawH) / 2;

    // Round positions to avoid sub-pixel blurring
    const rx = Math.round(x + offsetX);
    const ry = Math.round(y + offsetY);
    const rw = Math.round(drawW);
    const rh = Math.round(drawH);

    if (!allowOverflow) {
      // Clip to cell boundaries to prevent overflow
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(Math.round(x), Math.round(y), cellW, cellH);
      this.ctx.clip();
      this.ctx.drawImage(img, rx, ry, rw, rh);
      this.ctx.restore();
    } else {
      // Draw without clipping so zoom overlays neighbouring items
      this.ctx.drawImage(img, rx, ry, rw, rh);
    }
  }
}

// Instantiate and start
window.addEventListener('load', () => {
  const app = new GridApp('gridCanvas');
  app.start().catch(err => {
    console.error('GridApp failed to start', err);
    // show a minimal fallback message
    const c = document.getElementById('gridCanvas');
    if (c && c.getContext) {
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#111';
      ctx.fillRect(0,0, c.width, c.height);
      ctx.fillStyle = '#fff';
      ctx.font = '18px monospace';
      ctx.fillText('Failed to load assets. Check console.', 20, 40);
    }
  });
});
