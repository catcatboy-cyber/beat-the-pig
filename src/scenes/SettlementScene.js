class SettlementScene {
  constructor() {
    this.data = null
    this.buttons = []
    this._animTime = 0
    this._shareImagePath = ''
  }

  onEnter(data) {
    this.data = data || {}
    this.buttons = []
    this._animTime = 0
    this._shareImagePath = ''

    // Pre-render share card so tap handler can use it synchronously
    this._generateShareCard()

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

  _generateShareCard() {
    var self = this
    var d = this.data
    var nickname = Storage.getNickname()

    var offscreenCanvas
    try {
      offscreenCanvas = wx.createOffscreenCanvas({ type: '2d', width: 500, height: 400 })
    } catch (e) {
      offscreenCanvas = null
    }

    if (offscreenCanvas) {
      this._drawShareCard(offscreenCanvas, d, nickname)
      offscreenCanvas.toTempFilePath({
        success: function (res) {
          self._shareImagePath = res.tempFilePath
        },
        fail: function () {
          self._shareImagePath = ''
        }
      })
    }
  }

  _share() {
    var d = this.data
    var nickname = Storage.getNickname()
    wx.shareAppMessage({
      title: '我把「' + nickname + '」揍飞了 ' + (d.kills || 0) + ' 次！',
      imageUrl: this._shareImagePath || '',
      query: 'from=share&level=' + (d.level || 1)
    })
  }

  _drawShareCard(canvas, d, nickname) {
    var ctx = canvas.getContext('2d')
    var W = 500
    var H = 400

    // Background — paper texture color
    ctx.fillStyle = '#FFF8E7'
    ctx.fillRect(0, 0, W, H)

    // Border
    ctx.strokeStyle = '#4B3528'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, W - 4, H - 4)

    // Title bar
    ctx.fillStyle = '#4B3528'
    ctx.fillRect(4, 4, W - 8, 52)

    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('💥 暴打小猪战报', W / 2, 38)

    // Player info
    var avatarY = 72
    ctx.fillStyle = '#4B3528'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('👤 ' + nickname, 24, avatarY + 10)

    // Result badge
    var badgeText = d.victory ? '🎉 通关!' : '💀 战败'
    var badgeColor = d.victory ? '#4CAF50' : '#F44336'
    ctx.fillStyle = badgeColor
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(badgeText, W - 24, avatarY + 10)

    // Big emoji pig
    var pigY = 160
    ctx.font = '64px sans-serif'
    ctx.textAlign = 'center'
    var pigEmoji = d.victory ? '🐷' : '😈'
    ctx.fillText(pigEmoji, W / 2, pigY)

    // Pig expression label
    ctx.fillStyle = '#4B3528'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText((d.stars >= 3 ? '被打成猪头了! ' : '') + '名字: ' + nickname, W / 2, pigY + 34)

    // Stats
    var statsY = 208
    var stats = [
      { label: '🎯 关卡', value: '第 ' + (d.level || 1) + ' 关' },
      { label: '🪙 金币', value: (d.gold || 0) + ' 💰' },
      { label: '💢 击杀', value: (d.kills || 0) + ' 只' }
    ]
    if (d.maxCombo > 1) {
      stats.push({ label: '🔥 最高连击', value: (d.maxCombo || 0) + 'x' })
    }

    ctx.fillStyle = '#4B3528'
    ctx.font = '14px sans-serif'
    for (var i = 0; i < stats.length; i++) {
      var sy = statsY + i * 28
      ctx.textAlign = 'left'
      ctx.fillText(stats[i].label, 36, sy + 10)
      ctx.textAlign = 'right'
      ctx.font = 'bold 14px sans-serif'
      ctx.fillText(stats[i].value, W - 36, sy + 10)
      ctx.font = '14px sans-serif'
      if (i < stats.length - 1) {
        ctx.strokeStyle = 'rgba(75, 53, 40, 0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(36, sy + 18)
        ctx.lineTo(W - 36, sy + 18)
        ctx.stroke()
      }
    }

    // CTA
    var ctaY = 340
    ctx.fillStyle = '#FF3860'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('👇 扫码一起来暴打小猪!', W / 2, ctaY)

    // Footer
    ctx.fillStyle = '#9E9E9E'
    ctx.font = '11px sans-serif'
    ctx.fillText('暴打小猪 · 给你的烦恼取个名字', W / 2, H - 16)
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
