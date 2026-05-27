class FlySwatter extends Weapon {
  constructor() {
    super('swatter')
    this._swatTimer = 0
    this._splashReady = false
    this._splashCooldown = 0
  }

  getHitArea() {
    var dx = this.x - this._prevX
    var dy = this.y - this._prevY
    var moved = Math.sqrt(dx * dx + dy * dy)

    // 快速挥拍：扇形攻击区
    if (moved > 8) {
      var angle = Math.atan2(dy, dx)
      return {
        type: 'sector',
        x: this._prevX,
        y: this._prevY,
        cx: this.x,
        cy: this.y,
        radius: this.range,
        angle: angle - 0.5,
        sweepAngle: 1.0,
        direction: { x: dx / moved, y: dy / moved }
      }
    }

    // 静止：小圆
    return {
      type: 'circle',
      x: this.x,
      y: this.y,
      radius: this.range * 0.35,
      isSmash: false
    }
  }

  update(dt) {
    super.update(dt)
    if (this._splashCooldown > 0) this._splashCooldown -= dt

    if (InputManager.isTouching()) {
      this._swatTimer += dt
      // 每 3 秒一次范围溅射
      if (this._swatTimer > 3000 && this._splashCooldown <= 0) {
        this._splashReady = true
        this._swatTimer = 0
        this._splashCooldown = 3000
      }
    }
  }

  render(ctx) {
    super.render(ctx)
    if (!InputManager.isTouching()) return

    var touch = InputManager.getPrimaryTouch()
    if (!touch) return

    ctx.save()
    ctx.translate(this.x, this.y)

    // 拍柄
    ctx.fillStyle = '#888'
    ctx.fillRect(-2, -this.range * 0.4, 4, this.range * 0.4)

    // 拍面
    var headW = this.range * 0.55
    var headH = this.range * 0.4
    ctx.fillStyle = '#E53935'
    ctx.fillRect(-headW / 2, -this.range * 0.4 - headH, headW, headH)

    // 拍面孔洞
    ctx.fillStyle = '#C62828'
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        ctx.beginPath()
        ctx.arc(-headW / 3 + col * headW / 3, -this.range * 0.4 - headH * 0.6 + row * headH * 0.25, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 溅射就绪指示
    if (this._splashReady) {
      ctx.strokeStyle = 'rgba(255,215,0,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, -this.range * 0.4 - headH / 2, headW * 0.8, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }
}

window.FlySwatter = FlySwatter
