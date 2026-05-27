class Hammer extends Weapon {
  constructor() {
    super('hammer')
    this._swingPhase = 0
    this._swinging = false
  }

  getHitArea() {
    const touch = InputManager.getPrimaryTouch()
    if (!touch) return null

    // 锤头是一个圆，在手指位置上方偏移
    const hammerHeadX = this.x
    const hammerHeadY = this.y - 30

    // 检测手指向下快速移动时的大锤范围
    const dy = this.y - this._prevY
    const isSmashing = dy > 10  // 向下砸

    if (isSmashing) {
      this._swinging = true
      this._swingPhase = 6
    }

    return {
      type: 'circle',
      x: hammerHeadX,
      y: hammerHeadY,
      radius: isSmashing ? this.range * 0.8 : this.range * 0.4,
      isSmash: isSmashing
    }
  }

  update(dt) {
    super.update(dt)
    if (this._swingPhase > 0) {
      this._swingPhase--
      if (this._swingPhase === 0) {
        this._swinging = false
      }
    }
  }

  render(ctx) {
    super.render(ctx)
    if (!InputManager.isTouching()) return

    const touch = InputManager.getPrimaryTouch()
    if (!touch) return

    const hammerHeadX = this.x
    const hammerHeadY = this.y - 30
    const swingOffset = this._swinging
      ? Math.sin(this._swingPhase / 6 * Math.PI) * 15
      : 0

    ctx.save()

    // 锤柄
    ctx.fillStyle = '#654321'
    ctx.fillRect(this.x - 4, this.y - 20 + swingOffset, 8, 40)

    // 锤头（在手指上方）
    ctx.fillStyle = '#555'
    const headR = this.range * 0.3
    ctx.fillRect(
      hammerHeadX - headR,
      hammerHeadY - headR * 1.4 + swingOffset,
      headR * 2,
      headR * 1.8
    )

    // 锤头高光
    ctx.fillStyle = '#777'
    ctx.fillRect(
      hammerHeadX - headR * 0.7,
      hammerHeadY - headR * 1.2 + swingOffset,
      headR * 0.8,
      headR * 0.6
    )

    // 砸地冲击波
    if (this._swinging && this._swingPhase < 3) {
      const alpha = this._swingPhase / 3
      ctx.strokeStyle = `rgba(255,200,50,${alpha})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(hammerHeadX, hammerHeadY + headR * 0.9, this.range * alpha, 0, Math.PI, false)
      ctx.stroke()
    }

    ctx.restore()
  }
}

window.Hammer = Hammer
