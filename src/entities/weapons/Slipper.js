class Slipper extends Weapon {
  constructor() {
    super('slipper')
    this._thrown = false
    this._slipperX = 0
    this._slipperY = 0
    this._slipperVx = 0
    this._slipperVy = 0
    this._bouncesLeft = 0
    this._returning = false
    this._lastThrowTime = 0
  }

  getHitArea() {
    if (this._thrown) {
      return {
        type: 'circle',
        x: this._slipperX,
        y: this._slipperY,
        radius: this.range * 0.15,
        isSmash: false
      }
    }
    return {
      type: 'circle',
      x: this.x,
      y: this.y,
      radius: this.range * 0.25,
      isSmash: false
    }
  }

  update(dt) {
    super.update(dt)

    if (this._thrown) {
      var dtSec = dt / 1000

      if (this._returning) {
        // 飞回手指
        var rdx = this.x - this._slipperX
        var rdy = this.y - this._slipperY
        var rdist = Math.sqrt(rdx * rdx + rdy * rdy)
        if (rdist < 20) {
          this._thrown = false
          this._returning = false
        } else {
          var speed = 800
          this._slipperX += (rdx / rdist) * speed * dtSec
          this._slipperY += (rdy / rdist) * speed * dtSec
        }
      } else {
        // 飞行中
        this._slipperX += this._slipperVx * dtSec
        this._slipperY += this._slipperVy * dtSec

        // 墙壁反弹
        if (this._slipperX < 10 || this._slipperX > Screen.gameWidth - 10) {
          this._slipperVx *= -1
          this._bouncesLeft--
        }
        if (this._slipperY < 0) {
          this._slipperVy = Math.abs(this._slipperVy)
          this._bouncesLeft--
        }

        // 超出屏幕底部或弹跳次数耗尽：返回
        if (this._slipperY > Screen.gameHeight + 50 || this._bouncesLeft <= 0) {
          this._returning = true
        }
      }

      // 飞行轨迹粒子
      if (Math.random() < 0.4) {
        ParticleSystem.emit({
          x: this._slipperX, y: this._slipperY,
          count: 1,
          angle: 0, spread: Math.PI * 2,
          speed: 1, life: 200, size: 2,
          colors: ['#FFD700', '#FFA500'],
          gravity: 0
        })
      }
      return
    }

    // 检测投掷手势（快速向上滑动）
    if (InputManager.isTouching()) {
      var dy = this.y - this._prevY
      var dx = this.x - this._prevX
      var moved = Math.sqrt(dx * dx + dy * dy)

      if (moved > 25 && dy < -10) {
        var now = Date.now()
        if (now - this._lastThrowTime > 400) {
          this._thrown = true
          this._slipperX = this.x
          this._slipperY = this.y
          this._slipperVx = dx * 15
          this._slipperVy = dy * 15
          this._bouncesLeft = this.config.bounceCount + 2
          this._returning = false
          this._lastThrowTime = now
        }
      }
    }
  }

  render(ctx) {
    super.render(ctx)

    // 飞行中的拖鞋
    if (this._thrown) {
      ctx.save()
      ctx.translate(this._slipperX, this._slipperY)
      var angle = Math.atan2(this._slipperVy, this._slipperVx) + Math.PI / 2
      ctx.rotate(angle)

      ctx.fillStyle = '#FF6B35'
      ctx.beginPath()
      ctx.ellipse(0, 0, 14, 20, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#CC4400'
      ctx.lineWidth = 2
      ctx.stroke()

      // 人字带
      ctx.strokeStyle = '#FFF'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-6, 2)
      ctx.lineTo(0, -6)
      ctx.lineTo(6, 2)
      ctx.stroke()

      ctx.restore()
      return
    }

    if (!InputManager.isTouching()) return

    // 手指上的拖鞋（准备投掷）
    ctx.save()
    ctx.translate(this.x, this.y - 20)

    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    ctx.ellipse(0, 0, 12, 18, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#CC4400'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.strokeStyle = '#FFF'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-5, 2)
    ctx.lineTo(0, -4)
    ctx.lineTo(5, 2)
    ctx.stroke()

    ctx.restore()
  }
}

window.Slipper = Slipper
