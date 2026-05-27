class SettlementScene {
  constructor() {
    this.data = null
    this.buttons = []
    this._animTime = 0
  }

  onEnter(data) {
    this.data = data || {}
    this.buttons = []
    this._animTime = 0
    this._doubleGoldClaimed = false

    const cx = Screen.gameWidth / 2
    const gap = Screen.scale(10)

    if (this.data.victory) {
      const baseGold = this.data.gold || 0

      // Row 1: Double gold (full width)
      this.buttons.push(new Button(
        cx, Screen.gameHeight * 0.55, Screen.scale(240), Screen.scale(48),
        '📺 双倍金币 (' + baseGold + ' → ' + (baseGold * 2) + '💰)', '#FFB800',
        () => {
          AdManager.showRewardedVideo((watched) => {
            if (watched) {
              Storage.addGold(baseGold)
              this.data.gold = baseGold * 2
              this._doubleGoldClaimed = true
            }
          })
        }
      ))

      // Row 2: Next level + Back (paired)
      var r2w = Screen.scale(115)
      var r2h = Screen.scale(42)
      var r2y = Screen.gameHeight * 0.65
      this.buttons.push(new Button(
        cx - r2w / 2 - gap / 2, r2y, r2w, r2h,
        '下一关 →', '#39FF14',
        () => {
          var nextLevel = (this.data.level || 1) + 1
          SceneManager.switchTo('battle', { level: nextLevel })
        }
      ))
      this.buttons.push(new Button(
        cx + r2w / 2 + gap / 2, r2y, r2w, r2h,
        '返回菜单', '#9E9E9E',
        () => { SceneManager.switchTo('menu') }
      ))
    } else {
      // Row 1: Revive (full width)
      this.buttons.push(new Button(
        cx, Screen.gameHeight * 0.55, Screen.scale(240), Screen.scale(48),
        '📺 复活并继续', '#FF3860',
        () => {
          AdManager.showRewardedVideo((watched) => {
            if (watched) {
              SceneManager.switchTo('battle', { level: this.data.level })
            }
          })
        }
      ))
      // Row 2: Back
      this.buttons.push(new Button(
        cx, Screen.gameHeight * 0.65, Screen.scale(180), Screen.scale(42),
        '返回菜单', '#9E9E9E',
        () => { SceneManager.switchTo('menu') }
      ))
    }

    // Share button (top-right)
    this.buttons.push(new Button(
      Screen.gameWidth - Screen.scale(48), Screen.safeAreaTop + 30, Screen.scale(70), Screen.scale(30),
      '📤 分享', '#00D4FF',
      () => { this._share() }
    ))
  }

  _share() {
    var d = this.data
    var nickname = Storage.getNickname()
    wx.shareAppMessage({
      title: '我把「' + nickname + '」揍飞了！得分 ' + (d.gold || 0) + '💰 ' + (d.maxCombo || 0) + '连击',
      imageUrl: '',
      query: 'from=share&level=' + (d.level || 1)
    })
  }

  update(dt) {
    this._animTime += dt
    for (const btn of this.buttons) {
      btn.update(dt)
    }

    const touch = InputManager.getPrimaryTouch()
    if (touch && InputManager.justPressed()) {
      for (const btn of this.buttons) {
        if (btn.containsPoint(touch.x, touch.y)) {
          btn.onTap(touch.x, touch.y)
          break
        }
      }
    }
  }

  render(ctx) {
    var d = this.data
    var cx = Screen.gameWidth / 2
    var victory = d.victory
    var time = this._animTime

    // ── Paper background ──
    Theme.drawBackground(ctx)

    // ── Icon ──
    var iconY = Screen.gameHeight * 0.10
    var iconScale = 1 + Math.sin(time / 450) * 0.06
    ctx.save()
    ctx.translate(cx, iconY)
    ctx.scale(iconScale, iconScale)
    ctx.font = Screen.scale(56) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(victory ? '🎉' : '💀', 0, 0)
    ctx.restore()

    // ── Title ──
    var titleY = iconY + Screen.scale(52)
    var title = victory ? '通关成功!' : '防线被突破!'
    var accentColor = victory ? Theme.gold : Theme.red

    ctx.fillStyle = accentColor
    ctx.font = 'bold ' + Screen.scale(34) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, cx + 1, titleY + 1)

    ctx.fillStyle = Theme.ink
    ctx.fillText(title, cx, titleY)

    // ── Stats Card ──
    var cardW = Screen.gameWidth * 0.82
    var cardX = cx - cardW / 2
    var cardY = titleY + Screen.scale(24)
    var cardPadding = Screen.scale(14)
    var rowH = Screen.scale(36)

    var stats = [
      { label: '关卡', value: '第 ' + (d.level || 1) + ' 关', icon: '🎯' },
      { label: '金币', value: (d.gold || 0) + ' 💰', icon: '🪙' },
      { label: '击杀', value: (d.kills || 0) + ' 只', icon: '💢' },
      { label: '最高连击', value: (d.maxCombo || 0) + ' combo', icon: '🔥' },
      { label: '评价', value: this._getStars(d.stars || 0), icon: '🏆' }
    ]

    var cardH = stats.length * rowH + cardPadding * 2

    // Card (paper style)
    Theme.drawPaperCard(ctx, cardX, cardY, cardW, cardH, {
      fill: Theme.paperWhite,
      border: Theme.ink,
      radius: 12,
      shadowOffset: 4
    })

    // Stat rows
    for (var i = 0; i < stats.length; i++) {
      var s = stats[i]
      var rowY = cardY + cardPadding + i * rowH

      ctx.fillStyle = Theme.inkLight
      ctx.font = Screen.scale(11) + 'px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(s.icon + ' ' + s.label, cardX + 14, rowY + rowH / 2 + 4)

      ctx.fillStyle = Theme.ink
      ctx.font = 'bold ' + Screen.scale(13) + 'px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(s.value, cardX + cardW - 14, rowY + rowH / 2 + 4)

      // Divider
      if (i < stats.length - 1) {
        ctx.strokeStyle = 'rgba(75, 53, 40, 0.08)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cardX + 12, rowY + rowH)
        ctx.lineTo(cardX + cardW - 12, rowY + rowH)
        ctx.stroke()
      }
    }

    // ── Buttons ──
    for (const btn of this.buttons) {
      btn.render(ctx)
    }
  }

  _getStars(count) {
    var stars = ''
    for (var i = 0; i < 3; i++) {
      stars += i < count ? '⭐' : '☆'
    }
    return stars
  }
}

window.SettlementScene = new SettlementScene()
