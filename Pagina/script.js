const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;

const ON_MOBILE = window.innerWidth < 768;
const PARTICLE_COUNT = ON_MOBILE ? 110 : 220;
const CONNECTION_DISTANCE = 90;
const COLORS = ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#f472b6', '#fb923c', '#facc15'];

const mouse = { x: W / 2, y: H / 2, active: false };
const orb   = { x: W / 2, y: H / 2 };
const orbTrail = [];
const ORB_TRAIL_LENGTH = 48;

const NEBULA_BLOBS = [
  { x: W * 0.3, y: H * 0.4, radius: 300, color: 'rgba(109,40,217,' },
  { x: W * 0.7, y: H * 0.6, radius: 260, color: 'rgba(29,78,216,'  },
  { x: W * 0.5, y: H * 0.5, radius: 200, color: 'rgba(219,39,119,' },
  { x: W * 0.6, y: H * 0.3, radius: 180, color: 'rgba(5,150,105,'  },
];


class Particle {
  constructor() {
    this.respawn();
  }

  respawn() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.15 + Math.random() * 0.4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.radius       = 1 + Math.random() * 2.5;
    this.color        = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha        = 0.2 + Math.random() * 0.7;
    this.age          = 0;
    this.lifespan     = 400 + Math.random() * 600;
    this.twinkleSpeed = 0.01 + Math.random() * 0.03;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }

  update(t) {
    this.age++;

    if (mouse.active) {
      const dx   = mouse.x - this.x;
      const dy   = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const pull = (200 - dist) / 200 * 0.012;
        this.vx += (dx / dist) * pull;
        this.vy += (dy / dist) * pull;
      }
    }

    this.vx += (W / 2 - this.x) * 0.00003;
    this.vy += (H / 2 - this.y) * 0.00003;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1.8) {
      this.vx = this.vx / speed * 1.8;
      this.vy = this.vy / speed * 1.8;
    }

    this.x += this.vx;
    this.y += this.vy;

    this.alpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * this.twinkleSpeed + this.twinklePhase));

    const progress = this.age / this.lifespan;
    if (progress < 0.1)  this.alpha *= progress / 0.1;
    if (progress > 0.85) this.alpha *= (1 - progress) / 0.15;

    if (this.age >= this.lifespan) this.respawn();
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 4);
    glow.addColorStop(0, this.color);
    glow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.restore();
  }
}


class ShootingStar {
  constructor() {
    this.active = true;
    this.x      = Math.random() * W;
    this.y      = Math.random() * H * 0.5;
    const angle = Math.PI / 6 + Math.random() * Math.PI / 6;
    const speed = 12 + Math.random() * 10;
    this.vx     = Math.cos(angle) * speed;
    this.vy     = Math.sin(angle) * speed;
    this.alpha  = 1;
  }

  update() {
    this.x     += this.vx;
    this.y     += this.vy;
    this.alpha -= 0.018;
    if (this.alpha <= 0 || this.x > W + 50 || this.y > H + 50) this.active = false;
  }

  draw() {
    const tailX = this.x - this.vx * 4;
    const tailY = this.y - this.vy * 4;
    const grad  = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, '#fff');

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.restore();
  }
}


function updateOrb() {
  orb.x += (mouse.x - orb.x) * 0.12;
  orb.y += (mouse.y - orb.y) * 0.12;

  if (mouse.active) {
    orbTrail.push({ x: orb.x, y: orb.y });
    if (orbTrail.length > ORB_TRAIL_LENGTH) orbTrail.shift();
  }
}

function drawOrb(t) {
  for (let i = 0; i < orbTrail.length; i++) {
    const point  = orbTrail[i];
    const ratio  = i / orbTrail.length;
    const hue    = (t * 0.04 + i * 5) % 360;
    const radius = ratio * 12;

    const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
    grad.addColorStop(0, `hsla(${hue},100%,75%,1)`);
    grad.addColorStop(1, 'transparent');

    ctx.save();
    ctx.globalAlpha = ratio * 0.55;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  if (!mouse.active) return;

  const hue = (t * 0.04) % 360;

  const outerGlow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 38);
  outerGlow.addColorStop(0, `hsla(${hue},100%,70%,1)`);
  outerGlow.addColorStop(1, 'transparent');

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, 38, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();
  ctx.restore();

  const innerGlow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 10);
  innerGlow.addColorStop(0,   '#fff');
  innerGlow.addColorStop(0.4, `hsla(${hue},100%,75%,0.9)`);
  innerGlow.addColorStop(1,   'transparent');

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
}


function drawNebula(t) {
  for (const blob of NEBULA_BLOBS) {
    const scale = 1 + 0.05 * Math.sin(t * 0.0008 + blob.x);
    const r     = blob.radius * scale;
    const grad  = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
    grad.addColorStop(0, blob.color + '0.07)');
    grad.addColorStop(1, blob.color + '0)');
    ctx.beginPath();
    ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawConnections(particles) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a    = particles[i];
      const b    = particles[j];
      const dx   = a.x - b.x;
      const dy   = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECTION_DISTANCE) {
        ctx.save();
        ctx.globalAlpha = (1 - dist / CONNECTION_DISTANCE) * 0.18;
        ctx.strokeStyle = a.color;
        ctx.lineWidth   = 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function spawnBurst(x, y) {
  for (let i = 0; i < 12; i++) {
    const p     = new Particle();
    p.x         = x + (Math.random() - 0.5) * 20;
    p.y         = y + (Math.random() - 0.5) * 20;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    p.vx        = Math.cos(angle) * speed;
    p.vy        = Math.sin(angle) * speed;
    p.age       = 0;
    p.lifespan  = 200 + Math.random() * 200;
    particles.push(p);
  }
  if (particles.length > PARTICLE_COUNT + 100) particles.splice(0, 12);
}


const particles    = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
const shootingStars = [];
let lastShotTime   = 0;

function loop(t) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 0, W, H);

  updateOrb();
  drawNebula(t);
  drawConnections(particles);
  for (const p of particles) { p.update(t); p.draw(); }

  if (t - lastShotTime > 2800 + Math.random() * 3000) {
    shootingStars.push(new ShootingStar());
    lastShotTime = t;
  }
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    shootingStars[i].update();
    shootingStars[i].draw();
    if (!shootingStars[i].active) shootingStars.splice(i, 1);
  }

  drawOrb(t);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);


window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
});
window.addEventListener('mouseleave', () => { mouse.active = false; });
canvas.addEventListener('click', e => spawnBurst(e.clientX, e.clientY));

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
  mouse.active = true;
}, { passive: false });

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
  mouse.active = true;
  spawnBurst(mouse.x, mouse.y);
}, { passive: false });

canvas.addEventListener('touchend', () => { mouse.active = false; });

window.addEventListener('resize', () => {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
});
