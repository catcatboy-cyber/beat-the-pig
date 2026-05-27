class Taser extends Weapon {
  constructor() {
    super('taser')
    this._chargeLevel = 0
    this._discharging = false
    this._dischargeTimer = 0
    this._arcTargets = []
    this._zapTimer = 0
  }

  getHitArea() {
    // 放电时：大范围圆形
    if (this._discharging) {
      return {
        type: 'circle',
        x: this.x,
        y: this.y,
        radius: this.range * 1.2,
        isSmash: false
      }
    }

    // 正常：小范围电击
    return {
      type: 'circle',
      x: this.x,
      y: this.y,
      radius: this.range * 0.3,
      isSmash: false
    }
  }

  update(dt) {
    super.update(dt)

    if (this._discharging) {
      this._dischargeTimer -= dt
      if (this._dischargeTimer <= 0) {
        this._discharging = false
        this._chargeLevel = 0
      }
      return
    }

    if (InputManager.isTouching()) {
      this._chargeLevel = Math.min(this.config.maxCharge, this._chargeLevel + dt * this.config.upgrades[this.level - 1].speed * 0.1)
      this._zapTimer += dt

      // 满蓄力自动放电
      if (this._chargeLevel >= this.config.maxCharge) {
        this._discharging = true
        this._dischargeTimer = 600
        this._zapTimer = 0
      }

      // 充电粒子
      if (Math.floor(this._zapTimer / 80) !== Math.floor((this._zapTimer - dt) / 80)) {
        ParticleSystem.emit({
          x: this.x + (Math.random() - 0.5) * 40,
          y: this.y + (Math.random() - 0.5) * 40,
          count: 1,
          angle: 0, spread: Math.PI * 2,
          speed: 2, life: 300, size: 3,
          colors: ['#00BFFF', '#7DF9FF', '#FFFFFF'],
          gravity: 0
        })
      }
    } else {
      // 松手：释放当前蓄力
      if (this._chargeLevel > 15) {
        this._discharging = true
        this._dischargeTimer = 300 + this._chargeLevel * 3
      }
      this._chargeLevel = Math.max(0, this._chargeLevel - dt * 0.08)
    }
  }

  render(ctx) {
    super.render(ctx)
    if (!InputManager.isTouching() && !this._discharging) return

    ctx.save()
    ctx.translate(this.x, this.y)

    // 电击棒主体
    var barLen = this.range * 0.5
    ctx.fillStyle = '#444'
    ctx.fillRect(-3, -barLen, 6, barLen)

    // 电击头
    var headR = this.range * 0.15
    ctx.fillStyle = '#00BFFF'
    ctx.beginPath()
    ctx.arc(0, -barLen, headR, 0, Math.PI * 2)
    ctx.fill()

    // 蓄力指示器
    if (this._chargeLevel > 0) {
      var chargeRatio = this._chargeLevel / this.config.maxCharge
      ctx.strokeStyle = 'rgba(0,191,255,0.6)'
      ctx.lineWidth = 2 + chargeRatio * 3
      ctx.beginPath()
      ctx.arc(0, -barLen, headR + 6 + chargeRatio * 12, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 放电电弧
    if (this._discharging) {
      var arcAlpha = Math.min(1, this._dischargeTimer / 150)
      ctx.strokeStyle = 'rgba(135,206,250,' + arcAlpha + ')'
      ctx.lineWidth = 2
      for (var i = 0; i < 6; i++) {
        var angle = (i / 6) * Math.PI * 2 + Date.now() / 200
        var arcR = this.range * 1.2 * arcAlpha
        ctx.beginPath()
        ctx.moveTo(0, -barLen)
        var ex = Math.cos(angle) * arcR
        var ey = Math.sin(angle) * arcR - barLen
        ctx.lineTo(ex + (Math.random() - 0.5) * 30, ey + (Math.random() - 0.5) * 30)
        ctx.stroke()
      }
    }

    ctx.restore()
  }
}

window.Taser = Taser
