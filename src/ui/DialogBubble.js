class DialogBubbleClass {
  constructor() {
    this._bubbles = []
  }

  show(text, x, y) {
    this._bubbles.push({
      text, x, y,
      life: 1200,
      maxLife: 1200
    })
    if (this._bubbles.length > 10) {
      this._bubbles.shift()
    }
  }

  update(dt) {
    for (let i = this._bubbles.length - 1; i >= 0; i--) {
      this._bubbles[i].life -= dt
      this._bubbles[i].y -= dt * 0.02
      if (this._bubbles[i].life <= 0) {
        this._bubbles.splice(i, 1)
      }
    }
  }

  render(ctx) {
    for (const bubble of this._bubbles) {
      const alpha = Math.min(1, bubble.life / 300) * Math.max(0, bubble.life / bubble.maxLife)
      ctx.save()
      ctx.globalAlpha = alpha

      ctx.font = Screen.scale(11) + 'px sans-serif'
      var textW = ctx.measureText(bubble.text).width + 16
      var textH = 22
      var bx = bubble.x - textW / 2
      var by = bubble.y

      // Paper card bubble
      Theme.drawPaperCard(ctx, bx, by, textW, textH, {
        fill: Theme.paperWhite,
        border: Theme.ink,
        radius: 8,
        shadowOffset: 3
      })

      // Small speech tail (triangle at bottom center)
      ctx.fillStyle = Theme.paperWhite
      ctx.strokeStyle = Theme.ink
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bubble.x - 4, by + textH)
      ctx.lineTo(bubble.x, by + textH + 6)
      ctx.lineTo(bubble.x + 4, by + textH)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Text
      ctx.fillStyle = Theme.ink
      ctx.font = Screen.scale(11) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(bubble.text, bubble.x, by + textH / 2 + 1)

      ctx.restore()
    }
  }
}

window.DialogBubble = new DialogBubbleClass()
