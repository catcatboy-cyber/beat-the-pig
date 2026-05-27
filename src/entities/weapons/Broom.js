class Broom extends Weapon {
  constructor() {
    super('broom')
    this.sweepAngle = this.config.sweepAngle
    this._swishParticles = 0
  }

  getHitArea() {
    const dx = this.x - this._prevX
    const dy = this.y - this._prevY
    const moved = Math.sqrt(dx * dx + dy * dy)

    if (moved < 3) {
      return {
        type: 'circle',
        x: this.x,
        y: this.y,
        radius: this.range * 0.25,
        isSmash: false
      }
    }

    const angle = Math.atan2(dy, dx)
    return {
      type: 'sector',
      x: this._prevX,
      y: this._prevY,
      cx: this.x,
      cy: this.y,
      radius: this.range,
      angle: angle - this.sweepAngle / 2,
      sweepAngle: this.sweepAngle,
      direction: { x: dx / moved, y: dy / moved }
    }
  }

  update(dt) {
    super.update(dt)
    if (InputManager.isTouching()) {
      this._swishParticles++
      if (this._swishParticles % 3 === 0) {
        ParticleSystem.emit({
          x: this.x, y: this.y,
          count: 2,
          angle: Math.random() * Math.PI * 2,
          spread: 0.5,
          speed: 1.5,
          life: 250,
          size: 3,
          colors: ['#C8A96E', '#D4B896', '#F5DEB3'],
          gravity: 0
        })
      }
    }
  }

  render(ctx) {
    super.render(ctx)
    if (!InputManager.isTouching()) return

    const touch = InputManager.getPrimaryTouch()
    if (!touch) return

    // 扫帚柄（跟随手指方向旋转）
    const dx = this.x - this._prevX
    const dy = this.y - this._prevY
    const moved = Math.sqrt(dx * dx + dy * dy)
    const angle = moved > 3
      ? Math.atan2(dy, dx)
      : -Math.PI / 4

    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(angle)

    // 帚柄
    ctx.fillStyle = '#8B6914'
    ctx.fillRect(-this.range * 0.6, -4, this.range * 0.6, 8)

    // 帚头
    ctx.fillStyle = '#C8A96E'
    const headLen = this.range * 0.5
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.lineTo(headLen, -8)
    ctx.lineTo(headLen + 10, 0)
    ctx.lineTo(headLen, 8)
    ctx.lineTo(0, 10)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#8B6914'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
  }
}

window.Broom = Broom
