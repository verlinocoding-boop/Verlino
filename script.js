/ Block Dash (original) - game.js
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const overlay = document.getElementById('overlay');
  const overlayText = document.getElementById('overlayText');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');

  // resize
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener('resize', resize);
  resize();

  // Audio helper (simple beeps)
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioContext ? new AudioContext() : null;
  function sfx(freq=440, time=0.06, type='sine', vol=0.04) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + time);
  }

  // Game variables
  let running = false;
  let last = 0;
  const gravity = 2400;
  let worldSpeed = 420;
  let distance = 0;
  let score = 0;
  const bestKey = 'blockdash_best';
  let best = Number(localStorage.getItem(bestKey) || 0);
  bestEl.textContent = `Terbaik: ${best}`;

  // Player
  const player = {
    x: 140,
    y: 0,
    w: 46,
    h: 46,
    vy: 0,
    onGround: true,
    jumpPower: -820,
    dashTime: 0,
    dashDuration: 0.22, // seconds
    dashCooldown: 1.1, // seconds
    lastDash: -9999,
    dashing: false,
    invulnerable: false
  };

  // Obstacles
  const obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 0.9; // seconds

  // Particles
  const particles = [];

  // Input
  const keys = {};
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === 'arrowup' || k === 'w') tryJump();
    if (k === ' ' || k === 'shift') tryDash();
  });
  addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  // Touch: tap to dash, swipe up to jump
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    if (!e.touches) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
  }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const dt = performance.now() - touchStart.time;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    if (dt < 700 && Math.max(absX, absY) > 30) {
      if (absY > absX && dy < 0) tryJump();
      else tryDash();
    } else {
      // tap => dash
      tryDash();
    }
    touchStart = null;
  }, { passive: true });

  function tryJump() {
    if (!running) return;
    if (player.onGround) {
      player.vy = player.jumpPower;
      player.onGround = false;
      sfx(880, 0.08, 'triangle', 0.06);
    }
  }

  function tryDash() {
    if (!running) return;
    const now = performance.now() / 1000;
    if (now - player.lastDash < player.dashCooldown) return;
    player.lastDash = now;
    player.dashing = true;
    player.dashTime = player.dashDuration;
    player.invulnerable = true;
    // small speed burst
    worldSpeed *= 1.45;
    sfx(1400, 0.09, 'square', 0.06);
  }

  // spawn obstacles (various heights)
  function spawnObstacle() {
    const x = canvas.width + 80;
    const r = Math.random();
    if (r < 0.55) {
      // single tall block
      const h = 50 + Math.random() * 160;
      obstacles.push({ x, w: 52, h, type: 'block' });
    } else if (r < 0.78) {
      // low thin block (jump over)
      obstacles.push({ x, w: 70, h: 28, type: 'low' });
    } else {
      // double small blocks (gap between)
      obstacles.push({ x, w: 44, h: 40, type: 'block' });
      obstacles.push({ x: x + 120, w: 44, h: 40, type: 'block' });
    }
  }

  // particle spawn
  function spawnParticles(x, y, color = '#fff', n = 8) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 420,
        vy: (Math.random() - 1.5) * 420,
        life: 0.45 + Math.random() * 0.45,
        color
      });
    }
  }

  // collision check (AABB)
  function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // reset / start / end
  function resetGame() {
    obstacles.length = 0;
    particles.length = 0;
    player.y = canvas.height * 0.68 - player.h;
    player.vy = 0;
    player.onGround = true;
    player.dashing = false;
    player.invulnerable = false;
    player.lastDash = -9999;
    worldSpeed = 420;
    distance = 0;
    score = 0;
    spawnInterval = 0.9;
    spawnTimer = 0.6;
    scoreEl.textContent = `Skor: ${score}`;
  }

  function startGame() {
    audioCtx?.resume();
    overlay.classList.add('hidden');
    resetGame();
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    overlayText.innerText = `Game Over\nSkor: ${Math.floor(score)}\nJarak: ${Math.floor(distance)} m`;
    overlay.classList.remove('hidden');
    sfx(160, 0.5, 'sawtooth', 0.08);
    if (Math.floor(score) > best) {
      best = Math.floor(score);
      localStorage.setItem(bestKey, best);
      bestEl.textContent = `Terbaik: ${best}`;
    }
  }

  // main loop
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // update player
    if (!player.onGround) {
      player.vy += gravity * dt;
      player.y += player.vy * dt;
      const ground = canvas.height * 0.68 - player.h;
      if (player.y >= ground) {
        player.y = ground;
        player.vy = 0;
        player.onGround = true;
      }
    }

    // dash timer
    if (player.dashing) {
      player.dashTime -= dt;
      if (player.dashTime <= 0) {
        player.dashing = false;
        player.invulnerable = false;
        // revert speed gently
        worldSpeed /= 1.45;
      }
    }

    // spawn obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = spawnInterval * (0.7 + Math.random() * 0.8);
      spawnInterval = Math.max(0.45, spawnInterval - 0.006); // gradually increase frequency
    }

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= worldSpeed * dt;
      if (o.x + o.w < -120) {
        obstacles.splice(i, 1);
        continue;
      }
      // collision with player
      const px = player.x, py = player.y, pw = player.w, ph = player.h;
      const ox = o.x - o.w / 2, oy = canvas.height * 0.68 - o.h, ow = o.w, oh = o.h;
      if (!player.invulnerable && rectIntersect(px, py, pw, ph, ox, oy, ow, oh)) {
        // hit
        spawnParticles(px + pw / 2, py + ph / 2, '#ff6b6b', 16);
        endGame();
        return;
      }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += gravity * 0.9 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // scoring & distance
    distance += (worldSpeed * dt) * 0.001; // meters
    score += worldSpeed * dt * 0.02;
    scoreEl.textContent = `Skor: ${Math.floor(score)}`;
    // small speed ramp by distance
    if (distance > 1) worldSpeed += 0.2 * dt;
  }

  function render() {
    const cw = canvas.width, ch = canvas.height;
    // clear
    ctx.clearRect(0, 0, cw, ch);

    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#071526');
    g.addColorStop(1, '#081723');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);

    // distant parallax bars / ground
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 7; i++) {
      const y = ch * 0.2 + i * 28 + ((performance.now() / 50) % 28);
      ctx.fillRect(0, y, cw, 2);
    }

    // ground
    const groundY = ch * 0.68;
    ctx.fillStyle = '#0f1720';
    ctx.fillRect(0, groundY, cw, ch - groundY);
    // horizon line
    ctx.fillStyle = '#0b1b2a';
    ctx.fillRect(0, groundY - 6, cw, 6);

    // obstacles
    for (const o of obstacles) {
      const ox = o.x - o.w / 2;
      const oy = groundY - o.h;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(ox + 8, groundY - 6, o.w, 6);
      // block
      ctx.fillStyle = '#ef4444';
      if (o.type === 'low') ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox, oy, o.w, o.h);
      // bevel
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeRect(ox + 1, oy + 1, o.w - 2, o.h - 2);
    }

    // player (block)
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    // dash glow
    if (player.dashing) {
      ctx.shadowColor = 'rgba(34,197,94,0.9)';
      ctx.shadowBlur = 22;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = player.invulnerable ? '#22c55e' : '#60a5fa';
    ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
    ctx.restore();

    // particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.globalAlpha = 1;
    }

    // HUD: distance
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '14px Inter, Arial';
    ctx.fillText(`Jarak: ${Math.floor(distance)} m`, 16, 34);
  }

  // UI handlers
  startBtn.addEventListener('click', () => startGame());
  restartBtn.addEventListener('click', () => startGame());

  overlayText.innerText = `Block Dash\nTekan Mulai untuk bermain.\nKontrol: ↑ / W lompat, Space / Shift untuk dash. Sentuh: tap= dash, swipe up = lompat.`;
  overlay.classList.remove('hidden');

  // expose for debug
  window._blockDash = { start: () => startBtn.click() };
})();
