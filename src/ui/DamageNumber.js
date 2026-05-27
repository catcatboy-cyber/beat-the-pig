class DamageNumberClass {
  constructor() {
    this._numbers = []
  }

  spawn(value, x, y, isCrit) {
    this._numbers.push({
      value: Math.round(value),
      x,
      y,
      isCrit: isCrit || false,
      life: 800,
      maxLife: 800,
      vy: -3
    })
    if (this._numbers.length > 30) {
      this._numbers.shift()
    }
  }

  update(dt) {
    for (let i = this._numbers.length - 1; i >= 0; i--) {
      const n = this._numbers[i]
      n.life -= dt
      n.y += n.vy * (dt / 16)
      n.vy *= 0.98
      if (n.life <= 0) {
        this._numbers.splice(i, 1)
      }
    }
  }

  render(ctx) {
    for (const n of this._numbers) {
      const alpha = Math.min(1, n.life / 200)
      const progress = 1 - n.life / n.maxLife
      const scale = 1 + progress * 0.3

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(n.x, n.y)
      ctx.scale(scale, scale)

      const fontSize = n.isCrit ? Screen.scale(22) : Screen.scale(15)
      ctx.font = 'bold ' + fontSize + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (n.isCrit) {
        // Gold text with ink outline
        ctx.strokeStyle = Theme.ink
        ctx.lineWidth = 3
        ctx.strokeText('-' + n.value, 0, 0)
        ctx.fillStyle = Theme.gold
        ctx.fillText('-' + n.value, 0, 0)
      } else {
        // Ink text with paper outline
        ctx.strokeStyle = Theme.paperWhite
        ctx.lineWidth = 2
        ctx.strokeText('-' + n.value, 0, 0)
        ctx.fillStyle = Theme.ink
        ctx.fillText('-' + n.value, 0, 0)
      }

      ctx.restore()
    }
  }
}

window.DamageNumber = new DamageNumberClass()
