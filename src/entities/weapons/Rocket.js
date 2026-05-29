class Rocket extends Weapon {
  constructor() {
    super('rocket')
    this._launched = false
    this._rocketX = 0
    this._rocketY = 0
    this._rocketVx = 0
    this._rocketVy = 0
    this._exploding = false
    this._explodeTimer = 0
    this._explodeX = 0
    this._explodeY = 0
    this._cooldown = 0
    this._targetX = 0
    this._targetY = 0
  }

  getHitArea() {
    if (this._exploding) {
      return {
        type: 'circle',
        x: this._explodeX,
        y: this._explodeY,
        radius: this.config.explosionRadius,
        isSmash: true,
        isExplosion: true
      }
    }
    if (this._launched) {
      return {
        type: 'circle',
        x: this._rocketX,
        y: this._rocketY,
        radius: 12,
        isSmash: false,
        _explodeOnHit: true,
        _rocketRef: this
      }
    }
    return null
  }

  update(dt) {
    super.update(dt)
    var dtSec = dt / 1000

    if (this._cooldown > 0) {
      this._cooldown -= dt
    }

    if (this._exploding) {
      this._explodeTimer -= dt
      if (this._explodeTimer <= 0) {
        this._exploding = false
      }
      if (this._explodeTimer < 200) {
        return
      }
    }

    if (this._launched && !this._exploding) {
      this._rocketX += this._rocketVx * dtSec
      this._rocketY += this._rocketVy * dtSec

      // 尾焰粒子
      ParticleSystem.emit({
        x: this._rocketX, y: this._rocketY + 8,
        count: 2,
        angle: Math.PI / 2, spread: 0.3,
        speed: 6, life: 200, size: 3,
        colors: ['#FF4500', '#FFA500', '#FFD700'],
        gravity: 0
      })

      // 到达目标或出界 → 爆炸
      var tdx = this._targetX - this._rocketX
      var tdy = this._targetY - this._rocketY
      var tdist = Math.sqrt(tdx * tdx + tdy * tdy)
      if (tdist < 30 || this._rocketY < -20 ||
          this._rocketX < 0 || this._rocketX > Screen.gameWidth) {
        this._explode()
      }
      return
    }

    // 检测发射（快速点击）
    if (InputManager.justPressed()) {
      if (this._cooldown <= 0 && !this._launched) {
        this._launch()
      }
    }
  }

  _launch() {
    // 从手指位置向上发射
    this._rocketX = this.x
    this._rocketY = this.y - 20
    this._rocketVx = 0
    this._rocketVy = -900
    this._targetX = this.x
    this._targetY = this.y - 300
    this._launched = true
    this._cooldown = (1 / this.config.upgrades[this.level - 1].speed) * 1000
  }

  _explode() {
    this._exploding = true
    this._explodeTimer = 400
    this._explodeX = this._rocketX
    this._explodeY = this._rocketY
    this._launched = false
    ParticleSystem.emitExplosion(this._explodeX, this._explodeY)
  }

  render(ctx) {
    super.render(ctx)

    // 爆炸效果
    if (this._exploding) {
      var alpha = this._explodeTimer / 400
      var radius = this.config.explosionRadius * (1.5 - alpha * 0.5)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#FF4500'
      ctx.beginPath()
      ctx.arc(this._explodeX, this._explodeY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFA500'
      ctx.beginPath()
      ctx.arc(this._explodeX, this._explodeY, radius * 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(this._explodeX, this._explodeY, radius * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      return
    }

    // 飞行中的火箭
    if (this._launched) {
      ctx.save()
      ctx.translate(this._rocketX, this._rocketY)
      var angle = Math.atan2(this._rocketVy, this._rocketVx) + Math.PI / 2
      ctx.rotate(angle)

      // 火箭体
      ctx.fillStyle = '#E53935'
      ctx.fillRect(-6, -4, 12, 20)
      // 弹头
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.moveTo(-6, -4)
      ctx.lineTo(0, -12)
      ctx.lineTo(6, -4)
      ctx.closePath()
      ctx.fill()
      // 尾翼
      ctx.fillStyle = '#B71C1C'
      ctx.beginPath()
      ctx.moveTo(-6, 16)
      ctx.lineTo(-12, 22)
      ctx.lineTo(-6, 18)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(6, 16)
      ctx.lineTo(12, 22)
      ctx.lineTo(6, 18)
      ctx.closePath()
      ctx.fill()

      ctx.restore()
      return
    }

    // 冷却指示（在手指位置显示准星）
    if (InputManager.isTouching() && this._cooldown > 0) {
      var cdCooldown = (1 / this.config.upgrades[this.level - 1].speed) * 1000
      var cdRatio = this._cooldown / cdCooldown
      ctx.save()
      ctx.strokeStyle = 'rgba(255,0,0,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(this.x, this.y, 20, 0, Math.PI * 2 * (1 - cdRatio))
      ctx.stroke()
      ctx.restore()
    } else if (InputManager.isTouching() && this._cooldown <= 0) {
      // 就绪准星
      ctx.save()
      ctx.strokeStyle = '#FF4500'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(this.x, this.y, 15, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(this.x - 18, this.y)
      ctx.lineTo(this.x - 8, this.y)
      ctx.moveTo(this.x + 8, this.y)
      ctx.lineTo(this.x + 18, this.y)
      ctx.moveTo(this.x, this.y - 18)
      ctx.lineTo(this.x, this.y - 8)
      ctx.moveTo(this.x, this.y + 8)
      ctx.lineTo(this.x, this.y + 18)
      ctx.stroke()
      ctx.restore()
    }
  }
}

window.Rocket = Rocket
