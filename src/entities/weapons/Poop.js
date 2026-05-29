class Poop extends Weapon {
  constructor() {
    super('poop')
    this._thrown = false
    this._poopX = 0
    this._poopY = 0
    this._poopVx = 0
    this._poopVy = 0
    this._splashing = false
    this._splashTimer = 0
    this._splashX = 0
    this._splashY = 0
    this._cooldown = 0
    this._aiming = false
    this._targetX = 0
    this._targetY = 0
  }

  getHitArea() {
    if (this._splashing) {
      return {
        type: 'circle',
        x: this._splashX,
        y: this._splashY,
        radius: this.config.splashRadius + this.config.upgrades[this.level - 1].range * 0.6,
        isSmash: false,
        isPoison: true
      }
    }
    if (this._thrown) {
      return {
        type: 'circle',
        x: this._poopX,
        y: this._poopY,
        radius: 10,
        isSmash: false,
        _splashOnHit: true,
        _poopRef: this
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

    if (this._splashing) {
      this._splashTimer -= dt
      if (this._splashTimer <= 0) {
        this._splashing = false
      }
      // 毒雾粒子
      if (Math.random() < 0.3) {
        ParticleSystem.emit({
          x: this._splashX + (Math.random() - 0.5) * 60,
          y: this._splashY + (Math.random() - 0.5) * 40,
          count: 1,
          angle: 0, spread: Math.PI * 2,
          speed: 2, life: 500, size: 4,
          colors: ['#4CAF50', '#8BC34A', '#CDDC39'],
          gravity: -10
        })
      }
      return
    }

    if (this._thrown) {
      // 重力加速度
      this._poopVy += this.config.gravity * dtSec
      this._poopX += this._poopVx * dtSec
      this._poopY += this._poopVy * dtSec

      // 飞越屏幕上方 → 出界
      if (this._poopY < -50 || this._poopY > Screen.gameHeight + 50 ||
          this._poopX < -20 || this._poopX > Screen.gameWidth + 20) {
        this._thrown = false
        return
      }

      // 落地（到达目标 Y 附近且向下运动）
      if (this._poopVy > 0 && this._poopY >= this._targetY) {
        this._splash(this._poopX, this._poopY)
        return
      }

      // 尾迹粒子
      if (Math.random() < 0.5) {
        ParticleSystem.emit({
          x: this._poopX, y: this._poopY,
          count: 1,
          angle: 0, spread: Math.PI * 2,
          speed: 1, life: 150, size: 2,
          colors: ['#795548', '#8D6E63'],
          gravity: 0
        })
      }
      return
    }

    // 按住瞄准
    if (InputManager.isTouching() && this._cooldown <= 0) {
      this._aiming = true
      this._targetX = this.x
      this._targetY = this.y
    }

    // 松手投掷
    if (this._aiming && !InputManager.isTouching()) {
      this._aiming = false
      if (this._cooldown <= 0) {
        this._launch()
      }
    }
  }

  _launch() {
    this._thrown = true
    this._poopX = this.x
    this._poopY = this.y - 20
    this._targetX = this.x
    this._targetY = this.y

    var dx = this._targetX - this._poopX
    // 向上弧线抛射
    this._poopVx = dx * 2.5
    this._poopVy = -320
    this._cooldown = (1 / this.config.upgrades[this.level - 1].speed) * 1000
  }

  _splash(x, y) {
    this._splashing = true
    this._splashTimer = 500
    this._splashX = x
    this._splashY = y
    this._thrown = false
    ParticleSystem.emitExplosion(x, y)
  }

  render(ctx) {
    // 毒雾
    if (this._splashing) {
      var progress = 1 - this._splashTimer / 500
      var radius = (this.config.splashRadius + this.config.upgrades[this.level - 1].range * 0.6) * (0.5 + progress * 0.5)
      var alpha = 1 - progress

      ctx.save()
      ctx.globalAlpha = alpha * 0.4
      ctx.fillStyle = '#4CAF50'
      ctx.beginPath()
      ctx.arc(this._splashX, this._splashY, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = alpha * 0.2
      ctx.fillStyle = '#8BC34A'
      ctx.beginPath()
      ctx.arc(this._splashX, this._splashY, radius * 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      return
    }

    // 飞行中的臭弹
    if (this._thrown) {
      ctx.save()
      ctx.translate(this._poopX, this._poopY)
      ctx.rotate((this._poopVy * 0.02 + this._poopVx * 0.01))

      // 主体
      ctx.fillStyle = '#795548'
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()
      // 螺旋纹理
      ctx.fillStyle = '#5D4037'
      ctx.beginPath()
      ctx.arc(0, -3, 5, 0, Math.PI)
      ctx.fill()
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      ctx.arc(-2, -3, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
      return
    }

    // 手指离开时不画，冷却时不画
    if (!InputManager.isTouching() || this._cooldown > 0) return

    // 瞄准时的抛物线预览
    ctx.save()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(121, 85, 72, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()

    var startX = this.x
    var startY = this.y - 20
    var targetX = this.x
    var targetY = this.y
    var steps = 12
    var flightTime = 0.5
    var grav = this.config.gravity
    var vx = 0
    var vy = -320

    ctx.moveTo(startX, startY)
    for (var i = 1; i <= steps; i++) {
      var t = (i / steps) * flightTime
      var px = startX + vx * t
      var py = startY + vy * t + 0.5 * grav * t * t
      ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // 落点圈
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(targetX, targetY, this.config.splashRadius * 0.5, 0, Math.PI * 2)
    ctx.stroke()

    // 武器图标在手指位置
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💩', this.x, this.y - 20)

    ctx.restore()
  }

  reset() {
    this._thrown = false
    this._splashing = false
    this._splashTimer = 0
    this._aiming = false
    this._cooldown = 0
  }
}

window.Poop = Poop
