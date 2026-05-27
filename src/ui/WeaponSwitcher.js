class WeaponSwitcherClass {
  constructor() {
    this.currentWeaponId = 'broom'
    this.weapons = []
    this.weaponInstances = {}
    this.visible = true
    this._y = 0
    this._iconSize = 48
  }

  init() {
    this._y = Screen.gameHeight - Screen.scale(80)
    this._iconSize = Screen.scale(48)

    // 自动解锁已达到等级的武器
    var maxLevel = Storage.get('user.maxLevel') || 1
    for (const [id, config] of Object.entries(WeaponConfig)) {
      if (config.unlockLevel <= maxLevel) {
        var lv = Storage.getWeaponLevel(id)
        if (lv === 0) Storage.setWeaponLevel(id, 1)
      }
    }

    this.weapons = []
    this.weaponInstances = {}
    for (const [id, config] of Object.entries(WeaponConfig)) {
      const level = Storage.getWeaponLevel(id)
      if (level > 0) {
        this.weapons.push(id)
        if (id === 'broom') {
          this.weaponInstances[id] = new Broom()
        } else if (id === 'hammer') {
          this.weaponInstances[id] = new Hammer()
        } else if (id === 'swatter') {
          this.weaponInstances[id] = new FlySwatter()
        } else if (id === 'taser') {
          this.weaponInstances[id] = new Taser()
        } else if (id === 'slipper') {
          this.weaponInstances[id] = new Slipper()
        } else if (id === 'rocket') {
          this.weaponInstances[id] = new Rocket()
        }
      }
    }
    if (this.weapons.length === 0) {
      this.weapons.push('broom')
      this.weaponInstances['broom'] = new Broom()
      Storage.setWeaponLevel('broom', 1)
    }
    this.currentWeaponId = this.weapons[0]
  }

  getCurrentWeapon() {
    return this.weaponInstances[this.currentWeaponId]
  }

  switchTo(weaponId) {
    if (this.weaponInstances[weaponId]) {
      this.currentWeaponId = weaponId
      this.weaponInstances[weaponId]._initialized = false
    }
  }

  handleTap(px, py) {
    if (!this.visible) return false
    const iconW = this._iconSize + 8
    const startX = Screen.gameWidth - Screen.scale(16) - iconW * this.weapons.length
    for (let i = 0; i < this.weapons.length; i++) {
      const ix = startX + i * iconW
      if (px >= ix && px <= ix + iconW && py >= this._y - this._iconSize / 2 && py <= this._y + this._iconSize / 2) {
        this.switchTo(this.weapons[i])
        return true
      }
    }
    return false
  }

  update(dt) {
    const weapon = this.getCurrentWeapon()
    if (weapon) {
      const touch = InputManager.getPrimaryTouch()
      if (touch) {
        if (InputManager.justPressed()) {
          // 检查是否点击了武器切换图标
          if (this.handleTap(touch.x, touch.y)) return
        }
        weapon.setPosition(touch.x, touch.y)
      }
      weapon.update(dt)
    }
  }

  render(ctx) {
    if (!this.visible) return

    const iconW = this._iconSize + 8
    const startX = Screen.gameWidth - Screen.scale(16) - iconW * this.weapons.length

    for (let i = 0; i < this.weapons.length; i++) {
      const wid = this.weapons[i]
      const config = WeaponConfig[wid]
      const ix = startX + i * iconW
      const isActive = wid === this.currentWeaponId

      var cardW = iconW - 4
      var cardH = this._iconSize
      var cx = ix
      var cy = this._y - cardH / 2

      // Paper card style icon
      if (isActive) {
        Theme.drawPaperCard(ctx, cx, cy, cardW, cardH, {
          fill: Theme.gold,
          border: Theme.ink,
          radius: 10,
          shadowOffset: 3
        })
      } else {
        Theme.drawPaperCard(ctx, cx, cy, cardW, cardH, {
          fill: Theme.paperCream,
          border: 'rgba(75, 53, 40, 0.2)',
          radius: 10,
          shadowOffset: 2
        })
      }

      // Icon emoji
      ctx.font = Screen.scale(22) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(config.icon, cx + cardW / 2, this._y)
    }

    // Current weapon render
    const weapon = this.getCurrentWeapon()
    if (weapon && InputManager.isTouching()) {
      weapon.render(ctx)
    }
  }
}

window.WeaponSwitcher = new WeaponSwitcherClass()
