class MachineGun extends Weapon {
  constructor() {
    super('machinegun')
    this._bullets = []
    this._fireTimer = 0
  }

  getHitArea() {
    if (this._bullets.length === 0) return null
    return this._bullets.map(function (b) {
      return {
        type: 'circle',
        x: b.x,
        y: b.y,
        radius: 6,
        _bulletRef: b
      }
    })
  }

  update(dt) {
    super.update(dt)
    var dtSec = dt / 1000

    // 移动子弹
    for (var i = this._bullets.length - 1; i >= 0; i--) {
      var b = this._bullets[i]
      b.y += b.vy * dtSec
      if (b.y < -20 || !b.alive) {
        this._bullets.splice(i, 1)
      }
    }

    // 按住连射
    if (InputManager.isTouching()) {
      var hasSpecial = this.config.special && Storage.getWeaponSpecial(this.id)
      var fireRate = this.config.upgrades[this.level - 1].speed
      if (hasSpecial) fireRate *= 2 // 加特林射速翻倍
      var interval = 1000 / fireRate

      this._fireTimer += dt
      while (this._fireTimer >= interval) {
        this._fireTimer -= interval
        this._fireBullet()
      }
    } else {
      this._fireTimer = 0
    }
  }

  _fireBullet() {
    var hasSpecial = this.config.special && Storage.getWeaponSpecial(this.id)
    this._bullets.push({
      x: this.x,
      y: this.y - 16,
      vy: -this.config.bulletSpeed,
      alive: true,
      damage: this.config.upgrades[this.level - 1].damage,
      _penetrate: !!hasSpecial
    })
  }

  render(ctx) {
    // 飞行中的子弹（金色小圆点）
    for (var i = 0; i < this._bullets.length; i++) {
      var b = this._bullets[i]
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(b.x, b.y, this.config.bulletSize, 0, Math.PI * 2)
      ctx.fill()
      // 拖尾
      ctx.fillStyle = 'rgba(255, 200, 50, 0.3)'
      ctx.beginPath()
      ctx.arc(b.x, b.y + 4, this.config.bulletSize * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }

    // 手指离开时不画枪身
    if (!InputManager.isTouching()) return

    // 枪身（军绿色外壳）
    var gunW = 18
    var gunH = 32
    ctx.save()
    ctx.translate(this.x, this.y - 20)

    // 握把
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(-5, gunH * 0.3, 10, gunH * 0.5)

    // 枪体
    ctx.fillStyle = '#4A6B3A'
    ctx.fillRect(-gunW / 2, -gunH * 0.3, gunW, gunH * 0.8)
    ctx.strokeStyle = '#2E4A1E'
    ctx.lineWidth = 1.5
    ctx.strokeRect(-gunW / 2, -gunH * 0.3, gunW, gunH * 0.8)

    // 枪管
    ctx.fillStyle = '#333'
    ctx.fillRect(-3, -gunH * 0.65, 6, gunH * 0.45)

    // 枪口火焰
    var flicker = Math.random() * 4
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(0, -gunH * 0.7, 3 + flicker, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FF4500'
    ctx.beginPath()
    ctx.arc(0, -gunH * 0.7, 1.5 + flicker * 0.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  reset() {
    this._bullets = []
    this._fireTimer = 0
  }
}

window.MachineGun = MachineGun
