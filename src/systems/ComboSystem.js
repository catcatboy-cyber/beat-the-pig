class ComboSystemClass {
  constructor() {
    this.combo = 0
    this.maxCombo = 0
    this.lastHitTime = 0
    this.comboWindow = 800  // 800ms 内连击有效
    this.multiplier = 1
    this._milestone = 0
  }

  reset() {
    this.combo = 0
    this.maxCombo = 0
    this.lastHitTime = 0
    this.multiplier = 1
  }

  onHit() {
    const now = Date.now()
    if (now - this.lastHitTime < this.comboWindow) {
      this.combo++
    } else {
      this.combo = 1
    }
    this.lastHitTime = now
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo
    }
    this._updateMultiplier()

    // 连击里程碑
    this._milestone = 0
    if (this.combo === 10 || this.combo === 30 || this.combo === 50 || this.combo === 100) {
      this._milestone = this.combo
      ParticleSystem.emitGold(Screen.gameWidth / 2, Screen.gameHeight / 2, Math.floor(this.combo / 5))
    }
  }

  getMilestone() {
    return this._milestone || 0
  }

  _updateMultiplier() {
    if (this.combo >= 100) this.multiplier = 5
    else if (this.combo >= 50) this.multiplier = 3
    else if (this.combo >= 25) this.multiplier = 2
    else if (this.combo >= 10) this.multiplier = 1.5
    else this.multiplier = 1
  }

  getGoldBonus(baseGold) {
    return Math.floor(baseGold * (this.multiplier - 1))
  }

  getCombo() {
    return this.combo
  }

  getMaxCombo() {
    return this.maxCombo
  }

  getMultiplier() {
    return this.multiplier
  }

  isComboActive() {
    return Date.now() - this.lastHitTime < this.comboWindow
  }

  update(dt) {
    if (!this.isComboActive() && this.combo > 0) {
      this.combo = 0
      this.multiplier = 1
    }
  }
}

window.ComboSystem = new ComboSystemClass()
