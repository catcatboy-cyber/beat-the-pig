class Particle {
  constructor() {
    this.x = 0; this.y = 0
    this.vx = 0; this.vy = 0
    this.life = 0; this.maxLife = 0
    this.size = 0; this.startSize = 0
    this.color = '#fff'
    this.gravity = 0
    this._active = false
  }

  init(x, y, vx, vy, life, size, color, gravity) {
    this.x = x; this.y = y
    this.vx = vx; this.vy = vy
    this.life = life; this.maxLife = life
    this.size = size; this.startSize = size
    this.color = color
    this.gravity = gravity || 0
    this._active = true
  }

  update(dt) {
    if (!this._active) return
    const dtSec = dt / 1000
    this.x += this.vx * dtSec * 60
    this.y += this.vy * dtSec * 60
    this.vy += this.gravity * dtSec * 60
    this.life -= dt
    this.size = this.startSize * Math.max(0, this.life / this.maxLife)
  }

  get alive() {
    return this.life > 0
  }
}

class ParticleSystemClass {
  constructor() {
    this.pool = new ObjectPool(
      () => new Particle(),
      (p) => { p.life = 0; p._active = false },
      200
    )
  }

  emit(config) {
    const count = config.count || 10
    for (let i = 0; i < count; i++) {
      const p = this.pool.acquire()
      const angle = (config.angle || 0) + (config.spread || Math.PI * 2) * (Math.random() - 0.5)
      const speed = (config.speed || 5) * (0.5 + Math.random())
      const life = (config.life || 500) * (0.5 + Math.random() * 0.5)
      const size = config.size || 4
      const colors = config.colors || ['#fff']
      const color = colors[Math.floor(Math.random() * colors.length)]
      const gravity = config.gravity || 0

      p.init(
        config.x, config.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        life, size, color, gravity
      )
    }
    if (this.pool.getActiveCount() > 150) {
      this._cullOldest()
    }
  }

  emitHit(x, y, weaponType) {
    if (weaponType === 'hammer') {
      this.emit({
        x, y, count: 15, angle: -Math.PI / 2, spread: Math.PI,
        speed: 8, life: 400, size: 5,
        colors: ['#FFD700', '#FF6600', '#FF4400', '#FFFFFF'],
        gravity: 2
      })
    } else {
      this.emit({
        x, y, count: 8, angle: -Math.PI / 4, spread: Math.PI * 0.6,
        speed: 4, life: 350, size: 4,
        colors: ['#FFD700', '#FFCC00', '#FFFFFF'],
        gravity: 1
      })
    }
  }

  emitGold(x, y, amount) {
    this.emit({
      x, y, count: Math.min(amount, 15),
      angle: -Math.PI / 2, spread: Math.PI * 0.5,
      speed: 3, life: 600, size: 6,
      colors: ['#FFD700', '#FFC107'],
      gravity: 0.5
    })
  }

  emitExplosion(x, y) {
    this.emit({
      x, y, count: 25, angle: 0, spread: Math.PI * 2,
      speed: 12, life: 500, size: 6,
      colors: ['#FF4500', '#FF6600', '#FFD700', '#FFFFFF', '#FF0000'],
      gravity: 0.3
    })
  }

  emitStars(x, y) {
    this.emit({
      x, y, count: 6, angle: -Math.PI / 2, spread: Math.PI,
      speed: 2, life: 800, size: 5,
      colors: ['#FFD700', '#FFFFFF', '#FFE082'],
      gravity: -0.5
    })
  }

  _cullOldest() {
    let oldest = null
    this.pool.forEachActive((p) => {
      if (!oldest || p.life < oldest.life) oldest = p
    })
    if (oldest) this.pool.release(oldest)
  }

  update(dt) {
    this.pool.forEachActive((p) => p.update(dt))
    // 回收死粒子
    this.pool.forEachActive((p) => {
      if (!p.alive) this.pool.release(p)
    })
  }

  render(ctx) {
    this.pool.forEachActive((p) => {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }
}

window.ParticleSystem = new ParticleSystemClass()
