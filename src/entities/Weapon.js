class Weapon {
  constructor(configId) {
    this.id = configId
    this.config = WeaponConfig[configId]
    this.level = 1
    this.unlocked = false

    this.x = 0
    this.y = 0
    this.targetX = 0
    this.targetY = 0
    this.angle = 0
    this.width = 80
    this.height = 30

    this.damage = 0
    this.range = 0
    this.knockbackForce = 0

    this.hitArea = null  // { type: 'sector'|'circle', params }
    this._prevX = 0
    this._prevY = 0
    this._trail = []
    this._equipped = false
    this._initialized = false

    this._loadStats()
  }

  _loadStats() {
    const lvl = Storage.getWeaponLevel(this.id) || 1
    this.level = lvl > 0 ? lvl : 0
    this.unlocked = this.level > 0

    if (this.level > 0) {
      const upgrade = this.config.upgrades[this.level - 1]
      this.damage = upgrade.damage
      this.range = upgrade.range
    }
    this.knockbackForce = this.config.knockbackForce
  }

  reloadStats() {
    this._loadStats()
  }

  setPosition(x, y) {
    this._prevX = this.x
    this._prevY = this.y
    this.x = x
    this.y = y
    if (!this._initialized) {
      this._prevX = x
      this._prevY = y
      this._initialized = true
    }
  }

  updateTrail() {
    if (this._prevX !== this.x || this._prevY !== this.y) {
      this._trail.push({ x: this.x, y: this.y, life: 4 })
    }
    for (let i = this._trail.length - 1; i >= 0; i--) {
      this._trail[i].life--
      if (this._trail[i].life <= 0) this._trail.splice(i, 1)
    }
  }

  getHitArea() {
    // 子类覆盖
    return null
  }

  update(dt) {
    this.updateTrail()
  }

  render(ctx) {
    this._renderTrail(ctx)
    this._renderWeapon(ctx)
  }

  _renderTrail(ctx) {
    for (const t of this._trail) {
      const alpha = t.life / 4
      ctx.fillStyle = `rgba(255,200,50,${alpha * 0.4})`
      ctx.beginPath()
      ctx.arc(t.x, t.y, 8 * alpha, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  _renderWeapon(ctx) {
    // 子类覆盖
  }
}

window.Weapon = Weapon
