class ShopScene {
  constructor() {
    this.buttons = []
    this._tab = 'weapons'
    this._tabs = [
      { id: 'weapons', name: '武器', icon: '🔨' },
      { id: 'skins', name: '皮肤', icon: '🎨' },
      { id: 'effects', name: '特效', icon: '✨' },
      { id: 'voices', name: '语音', icon: '🎤' }
    ]
    this._scrollY = 0
    this._maxScroll = 0
    this._touchStartY = 0
    this._scrolling = false
  }

  onEnter() {
    this.buttons = []
    this._tab = 'weapons'
    this._scrollY = 0
    this._buildButtons()
  }

  _buildButtons() {
    this.buttons = []
    var cx = Screen.gameWidth / 2
    var backBtnY = Screen.safeAreaTop + 36

    this.buttons.push(new Button(
      Screen.scale(48), backBtnY, Screen.scale(76), Screen.scale(30),
      '← 返回', '#9E9E9E',
      () => { SceneManager.switchTo('menu') }
    ))

    this._goldY = backBtnY

    // Tab buttons
    var tabW = Screen.scale(72)
    var tabStartX = Screen.scale(12)
    var tabY = Screen.gameHeight * 0.12
    this._tabButtons = []
    for (var i = 0; i < this._tabs.length; i++) {
      var t = this._tabs[i]
      var tx = tabStartX + i * (tabW + 4) + tabW / 2
      this._tabButtons.push({
        x: tx, y: tabY, w: tabW, h: 32,
        tab: t,
        containsPoint: function (px, py) {
          return px >= this.x - this.w / 2 && px <= this.x + this.w / 2 &&
                 py >= this.y - this.h / 2 && py <= this.y + this.h / 2
        }
      })
    }
  }

  update(dt) {
    var touch = InputManager.getPrimaryTouch()
    if (touch) {
      if (!this._scrolling) {
        this._touchStartY = touch.y - this._scrollY
        this._scrolling = true
      }
      this._scrollY = touch.y - this._touchStartY
      this._scrollY = Math.min(0, Math.max(-this._maxScroll, this._scrollY))
    } else {
      this._scrolling = false
    }

    if (InputManager.justPressed()) {
      var pt = InputManager.getPrimaryTouch()
      if (pt) {
        for (var ti = 0; ti < this._tabButtons.length; ti++) {
          if (this._tabButtons[ti].containsPoint(pt.x, pt.y)) {
            this._tab = this._tabButtons[ti].tab.id
            this._shopItems = null
            return
          }
        }
        for (var bi = 0; bi < this.buttons.length; bi++) {
          if (this.buttons[bi].containsPoint(pt.x, pt.y)) {
            this.buttons[bi].onTap(pt.x, pt.y)
            return
          }
        }
        if (this._shopItems) {
          for (var si = 0; si < this._shopItems.length; si++) {
            var item = this._shopItems[si]
            if (item.btn) {
              if (item.btn.containsPoint(pt.x, pt.y)) {
                this._handlePurchase(item)
                return
              }
            }
          }
        }
      }
    }

    for (var bj = 0; bj < this.buttons.length; bj++) {
      this.buttons[bj].update(dt)
    }
  }

  _handlePurchase(item) {
    var gold = Storage.getGold()
    if (item.cost > 0 && gold < item.cost) {
      AdManager.showRewardedVideo(function (watched) {
        if (watched) Storage.addGold(300)
      })
      return
    }

    if (item.type === 'weapon_upgrade') {
      Storage.spendGold(item.cost)
      var newLevel = Storage.getWeaponLevel(item.weaponId) + 1
      Storage.setWeaponLevel(item.weaponId, newLevel)
      var wi = WeaponSwitcher.weaponInstances[item.weaponId]
      if (wi) wi.reloadStats()
    } else if (item.type === 'weapon_special') {
      Storage.spendGold(item.cost)
      Storage.unlockWeaponSpecial(item.weaponId)
    } else if (item.type === 'skin') {
      Storage.spendGold(item.cost)
      var skins = Storage.get('skins.weaponSkins') || []
      skins.push(item.id)
      Storage.set('skins.weaponSkins', skins)
    } else if (item.type === 'effect') {
      Storage.spendGold(item.cost)
      var effects = Storage.get('skins.effects') || []
      effects.push(item.id)
      Storage.set('skins.effects', effects)
    } else if (item.type === 'voice') {
      Storage.spendGold(item.cost)
      var packs = Storage.get('skins.voicePacks') || []
      packs.push(item.id)
      Storage.set('skins.voicePacks', packs)
    }
    this._buildShopItems()
  }

  _buildShopItems() {
    this._shopItems = []
    var startY = Screen.gameHeight * 0.16
    var itemH = Screen.scale(68)

    switch (this._tab) {
      case 'weapons': this._buildWeaponItems(startY, itemH); break
      case 'skins': this._buildSkinItems(startY, itemH); break
      case 'effects': this._buildEffectItems(startY, itemH); break
      case 'voices': this._buildVoiceItems(startY, itemH); break
    }
    this._maxScroll = Math.max(0, this._shopItems.length * itemH - Screen.gameHeight * 0.68)
  }

  _buildWeaponItems(startY, itemH) {
    this._shopItems = []
    var entries = Object.entries(WeaponConfig)
    for (var i = 0; i < entries.length; i++) {
      var id = entries[i][0]
      var config = entries[i][1]
      var level = Storage.getWeaponLevel(id)
      var cy = startY + i * itemH

      if (level === 0) {
        this._shopItems.push({
          label: config.icon + ' ' + config.name,
          desc: '第 ' + config.unlockLevel + ' 关解锁',
          cost: 0, y: cy, weaponId: id, type: 'locked'
        })
      } else if (level < 5) {
        var nextUpgrade = config.upgrades[level]
        this._shopItems.push({
          label: config.icon + ' ' + config.name + ' Lv.' + level,
          desc: '→ Lv.' + (level + 1) + ' ' + nextUpgrade.desc,
          cost: nextUpgrade.cost, y: cy, weaponId: id, type: 'weapon_upgrade',
          btn: new Button(Screen.gameWidth * 0.78, 0, 72, 28, nextUpgrade.cost + '💰', '#FFB800', function () {})
        })
      } else {
        var wpData = Storage.get('weapons')[id]
        var hasSpecial = wpData && wpData.special
        if (!hasSpecial) {
          this._shopItems.push({
            label: config.icon + ' ' + config.name + ' 特殊能力',
            desc: config.special.desc,
            cost: config.special.cost, y: cy, weaponId: id, type: 'weapon_special',
            btn: new Button(Screen.gameWidth * 0.78, 0, 72, 28, config.special.cost + '💰', '#B44CF0', function () {})
          })
        } else {
          this._shopItems.push({
            label: config.icon + ' ' + config.name + ' MAX',
            desc: '已升满',
            cost: 0, y: cy, weaponId: id, type: 'max'
          })
        }
      }
    }
  }

  _buildSkinItems(startY, itemH) {
    this._shopItems = []
    var skins = ShopConfig.weaponSkins || []
    for (var i = 0; i < skins.length; i++) {
      var skin = skins[i]
      var owned = (Storage.get('skins.weaponSkins') || []).indexOf(skin.id) >= 0
      var cy = startY + i * itemH
      this._shopItems.push({
        label: skin.icon + ' ' + skin.name,
        desc: owned ? '已拥有' : skin.desc,
        cost: owned ? 0 : skin.cost, y: cy, id: skin.id, type: 'skin',
        btn: owned ? null : new Button(Screen.gameWidth * 0.78, 0, 72, 28, skin.cost + '💰', '#FFB800', function () {})
      })
    }
  }

  _buildEffectItems(startY, itemH) {
    this._shopItems = []
    var effects = ShopConfig.effects || []
    for (var i = 0; i < effects.length; i++) {
      var effect = effects[i]
      var owned = (Storage.get('skins.effects') || []).indexOf(effect.id) >= 0
      var cy = startY + i * itemH
      this._shopItems.push({
        label: effect.name,
        desc: owned ? '已拥有' : effect.desc,
        cost: owned ? 0 : effect.cost, y: cy, id: effect.id, type: 'effect',
        btn: owned ? null : new Button(Screen.gameWidth * 0.78, 0, 72, 28, effect.cost + '💰', '#FFB800', function () {})
      })
    }
  }

  _buildVoiceItems(startY, itemH) {
    this._shopItems = []
    var packs = ShopConfig.voicePacks || []
    for (var i = 0; i < packs.length; i++) {
      var vp = packs[i]
      var owned = (Storage.get('skins.voicePacks') || []).indexOf(vp.id) >= 0
      var cy = startY + i * itemH
      this._shopItems.push({
        label: vp.name,
        desc: owned ? '已拥有' : vp.desc,
        cost: owned ? 0 : vp.cost, y: cy, id: vp.id, type: 'voice',
        btn: owned ? null : new Button(Screen.gameWidth * 0.78, 0, 72, 28, vp.cost + '💰', '#FFB800', function () {})
      })
    }
  }

  render(ctx) {
    // ── Paper background ──
    Theme.drawBackground(ctx)

    // Back button
    for (var bi = 0; bi < this.buttons.length; bi++) {
      this.buttons[bi].render(ctx)
    }

    // Gold display (top right)
    var goldY = this._goldY
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(15) + 'px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('💰 ' + Storage.getGold(), Screen.gameWidth - 14, goldY + 5)

    // ── Tab bar ──
    for (var ti = 0; ti < this._tabButtons.length; ti++) {
      var tb = this._tabButtons[ti]
      var active = this._tab === tb.tab.id

      // Tab pill
      var pillBg = active ? Theme.teal : (active ? Theme.teal : Theme.paperCream)
      Theme.drawPill(ctx, tb.x - tb.w / 2, tb.y - tb.h / 2, tb.tab.icon + ' ' + tb.tab.name, {
        active: active,
        bg: active ? Theme.teal : Theme.pillBg,
        textColor: active ? Theme.paperWhite : Theme.pillText,
        border: active ? Theme.ink : Theme.pillBorder,
        centerAlign: false,
        fontSize: 10
      })
    }

    // Build items
    if (!this._shopItems) this._buildShopItems()

    // ── Shop items (clipped scroll area) ──
    ctx.save()
    var clipTop = Screen.gameHeight * 0.16 - 8
    ctx.beginPath()
    ctx.rect(0, clipTop, Screen.gameWidth, Screen.gameHeight - clipTop)
    ctx.clip()

    ctx.translate(0, this._scrollY)

    var padding = Screen.scale(10)
    var itemH = Screen.scale(68)

    for (var si = 0; si < (this._shopItems || []).length; si++) {
      var item = this._shopItems[si]
      var itemY = item.y + this._scrollY
      if (itemY < clipTop - itemH || itemY > Screen.gameHeight + itemH) continue

      var cardY = itemY
      var cardH = itemH - 6

      // Item card (paper style)
      Theme.drawPaperCard(ctx, padding, cardY, Screen.gameWidth - padding * 2, cardH, {
        fill: Theme.paperWhite,
        border: 'rgba(75, 53, 40, 0.15)',
        radius: 8,
        shadowOffset: 2
      })

      // Left accent bar
      var accentColor = item.type === 'weapon_upgrade' ? Theme.gold
        : item.type === 'weapon_special' ? Theme.ink
        : item.type === 'max' ? Theme.teal
        : item.type === 'locked' ? Theme.inkLight
        : item.cost > 0 ? Theme.gold : Theme.teal

      ctx.fillStyle = accentColor
      ctx.strokeStyle = Theme.ink
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(padding, cardY + 4, 3, cardH - 8, [2])
      ctx.fill()
      ctx.stroke()

      // Title
      ctx.fillStyle = item.type === 'locked' ? Theme.inkLight : Theme.ink
      ctx.font = 'bold ' + Screen.scale(13) + 'px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(item.label, padding + 14, cardY + 24)

      // Description
      ctx.fillStyle = Theme.inkLight
      ctx.font = Screen.scale(10) + 'px sans-serif'
      ctx.fillText(item.desc, padding + 14, cardY + 44)

      // Button or status
      if (item.btn) {
        item.btn.y = cardY + cardH / 2
        item.btn.render(ctx)
      } else if (item.type === 'max') {
        ctx.fillStyle = Theme.teal
        ctx.font = 'bold ' + Screen.scale(11) + 'px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('✦ MAX ✦', Screen.gameWidth - padding - 10, cardY + cardH / 2 + 4)
      } else if (item.type === 'locked') {
        ctx.fillStyle = Theme.inkLight
        ctx.font = Screen.scale(18) + 'px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('🔒', Screen.gameWidth - padding - 10, cardY + cardH / 2 + 4)
      }
    }

    ctx.restore()

    // ── Scroll fade edges (paper-colored) ──
    var fadeTop = ctx.createLinearGradient(0, clipTop, 0, clipTop + 30)
    fadeTop.addColorStop(0, Theme.paper)
    fadeTop.addColorStop(1, 'rgba(255,247,222,0)')
    ctx.fillStyle = fadeTop
    ctx.fillRect(0, clipTop, Screen.gameWidth, 30)

    var fadeBottom = ctx.createLinearGradient(0, Screen.gameHeight - 30, 0, Screen.gameHeight)
    fadeBottom.addColorStop(0, 'rgba(255,247,222,0)')
    fadeBottom.addColorStop(1, Theme.paper)
    ctx.fillStyle = fadeBottom
    ctx.fillRect(0, Screen.gameHeight - 30, Screen.gameWidth, 30)
  }
}

window.ShopScene = new ShopScene()
