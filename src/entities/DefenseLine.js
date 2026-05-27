class DefenseLine {
  constructor() {
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 6
    this.maxHp = 10
    this.hp = 10
    this._flashTimer = 0
  }

  init(maxHp) {
    this.maxHp = maxHp
    this.hp = maxHp
    this.y = Screen.gameHeight - Screen.scale(60)
    this.width = Screen.gameWidth
    this.height = Screen.scale(6)
  }

  takeDamage(amount) {
    this.hp -= amount
    this._flashTimer = 300
    if (this.hp < 0) this.hp = 0
    return this.hp <= 0
  }

  get alive() {
    return this.hp > 0
  }

  get ratio() {
    return this.hp / this.maxHp
  }

  update(dt) {
    if (this._flashTimer > 0) this._flashTimer -= dt
  }

  render(ctx) {
    const ratio = this.ratio

    // 底色
    ctx.fillStyle = '#ddd'
    ctx.fillRect(0, this.y, this.width, this.height)

    // 血量
    const color = ratio > 0.5 ? '#4CAF50' : ratio > 0.2 ? '#FF9800' : '#F44336'
    ctx.fillStyle = this._flashTimer > 0 ? '#fff' : color
    ctx.fillRect(0, this.y, this.width * ratio, this.height)

    // 闪烁效果
    if (this._flashTimer > 0) {
      ctx.globalAlpha = 0.3 + Math.sin(this._flashTimer / 30) * 0.3
      ctx.fillStyle = '#F44336'
      ctx.fillRect(0, this.y, this.width, this.height)
      ctx.globalAlpha = 1
    }

    // 文字提示
    ctx.fillStyle = '#999'
    ctx.font = `${Screen.scale(10)}px sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(`防线 ${this.hp}/${this.maxHp}`, Screen.gameWidth - 10, this.y - 6)
  }
}

window.DefenseLine = DefenseLine
