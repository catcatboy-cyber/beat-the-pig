class Hole {
  constructor() {
    this.x = 0
    this.y = 60
    this.width = 60
    this.height = 20
    this.index = 0
    this._active = true
    this._wiggleTimer = 0
  }

  init(index, total) {
    this.index = index
    const spacing = Screen.gameWidth / (total + 1)
    this.x = spacing * (index + 1)
    this.y = Screen.scale(50)
    this.width = Screen.scale(60)
    this.height = Screen.scale(16)
    this._wiggleTimer = Math.random() * Math.PI * 2
  }

  update(dt) {
    this._wiggleTimer += dt * 0.005
  }

  getSpawnPos() {
    return {
      x: this.x,
      y: this.y + this.height / 2
    }
  }

  render(ctx) {
    const wiggle = Math.sin(this._wiggleTimer) * 3

    // 黑洞
    ctx.fillStyle = '#2c1810'
    ctx.beginPath()
    ctx.ellipse(this.x + wiggle, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // 内圈高光
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width / 2)
    gradient.addColorStop(0, '#4a2815')
    gradient.addColorStop(1, '#1a0a00')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(this.x + wiggle, this.y, this.width / 2 - 4, this.height / 2 - 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

window.Hole = Hole
