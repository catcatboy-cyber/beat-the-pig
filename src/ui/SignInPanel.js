class SignInPanelClass {
  constructor() {
    this.visible = false
    this._rewards = [100, 200, 300, 500, 800, 1200, 2000]
    this._todayIndex = -1
    this._streak = 0
    this._claimed = false
  }

  // Returns true if auto-popup should show
  shouldAutoShow() {
    var today = new Date().toDateString()
    var lastDate = Storage.get('stats.lastSignInDate') || ''
    if (lastDate === today) return false // already signed in today
    return true
  }

  show(autoPopup) {
    var today = new Date().toDateString()
    var lastDate = Storage.get('stats.lastSignInDate') || ''
    this._streak = Storage.get('stats.signInStreak') || 0

    // Check if streak is broken (more than 1 day gap)
    if (lastDate && lastDate !== today) {
      var last = new Date(lastDate)
      var now = new Date(today)
      var diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))
      if (diffDays > 1) {
        this._streak = 0
        Storage.set('stats.signInStreak', 0)
      }
    }

    this._todayIndex = this._streak // current day index (0-6)
    this._claimed = lastDate === today
    this.visible = true
    this._autoPopup = autoPopup || false
  }

  hide() {
    this.visible = false
  }

  claim() {
    if (this._claimed || this._todayIndex >= 7) return
    var reward = this._rewards[this._todayIndex]
    Storage.addGold(reward)
    this._streak++
    if (this._streak > 7) this._streak = 7
    Storage.set('stats.signInStreak', this._streak)
    Storage.set('stats.lastSignInDate', new Date().toDateString())
    this._claimed = true

    // Toast
    this._claimToast = '签到成功! +' + reward + ' 💰'
    this._claimTimer = 2000
  }

  handleTap(px, py) {
    if (!this.visible) return false

    var cx = Screen.gameWidth / 2

    // Close button (tap outside panel)
    var panelW = Screen.scale(290)
    var panelH = Screen.scale(300)
    var panelX = cx - panelW / 2
    var panelY = Screen.gameHeight * 0.18
    if (px < panelX || px > panelX + panelW || py < panelY || py > panelY + panelH) {
      this.hide()
      return true
    }

    // Claim button
    if (!this._claimed && this._todayIndex < 7) {
      var btnW = Screen.scale(160)
      var btnH = Screen.scale(38)
      var btnX = cx - btnW / 2
      var btnY = panelY + panelH - btnH - 16
      if (px >= btnX && px <= btnX + btnW && py >= btnY && py <= btnY + btnH) {
        this.claim()
        return true
      }
    }

    // Tap inside panel does nothing
    return false
  }

  update(dt) {
    if (this._claimTimer > 0) {
      this._claimTimer -= dt
    }
  }

  render(ctx) {
    if (!this.visible) return

    var cx = Screen.gameWidth / 2

    // Dim background
    ctx.fillStyle = 'rgba(75, 53, 40, 0.5)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    var panelW = Screen.scale(290)
    var panelH = Screen.scale(300)
    var panelX = cx - panelW / 2
    var panelY = Screen.gameHeight * 0.18

    Theme.drawPaperCard(ctx, panelX, panelY, panelW, panelH, {
      fill: Theme.paperWhite,
      border: Theme.ink,
      radius: 14,
      shadowOffset: 6
    })

    // Title
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(20) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📅 七日签到', cx, panelY + 32)

    // Subtitle
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(11) + 'px sans-serif'
    ctx.fillText('连续签到奖励递增，中断重新开始', cx, panelY + 52)

    // Day grid: 7 cells in a row
    var cellW = Screen.scale(34)
    var cellH = Screen.scale(64)
    var gridGap = Screen.scale(4)
    var gridTotalW = 7 * cellW + 6 * gridGap
    var gridStartX = cx - gridTotalW / 2
    var gridY = panelY + 66

    for (var i = 0; i < 7; i++) {
      var gx = gridStartX + i * (cellW + gridGap)
      var isChecked = i < this._streak || (i === this._todayIndex && this._claimed)
      var isToday = i === this._todayIndex && !this._claimed
      var cellFill = isChecked ? Theme.gold : isToday ? Theme.teal : Theme.paperCream
      var cellBorder = isChecked || isToday ? Theme.ink : 'rgba(75, 53, 40, 0.2)'

      Theme.drawPaperCard(ctx, gx, gridY, cellW, cellH, {
        fill: cellFill,
        border: cellBorder,
        radius: 8,
        shadowOffset: isToday ? 4 : 2
      })

      // Day number
      ctx.fillStyle = isChecked ? Theme.ink : isToday ? Theme.paperWhite : Theme.inkLight
      ctx.font = 'bold ' + Screen.scale(10) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('第' + (i + 1) + '天', gx + cellW / 2, gridY + 16)

      // Checkmark or reward
      if (isChecked) {
        ctx.font = Screen.scale(18) + 'px sans-serif'
        ctx.fillText('✓', gx + cellW / 2, gridY + 42)
      } else {
        ctx.fillStyle = isToday ? Theme.paperWhite : Theme.inkLight
        ctx.font = Screen.scale(9) + 'px sans-serif'
        ctx.fillText('+' + this._rewards[i], gx + cellW / 2, gridY + 44)
      }
    }

    // Claim button
    if (!this._claimed && this._todayIndex < 7) {
      var btnW = Screen.scale(160)
      var btnH = Screen.scale(38)
      var btnX = cx - btnW / 2
      var btnY = panelY + panelH - btnH - 16

      Theme.drawPaperCard(ctx, btnX, btnY, btnW, btnH, {
        fill: Theme.gold,
        border: Theme.ink,
        radius: 10,
        shadowOffset: 4
      })

      ctx.fillStyle = Theme.ink
      ctx.font = 'bold ' + Screen.scale(14) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🎁 领取 +' + this._rewards[this._todayIndex], cx, btnY + btnH / 2)
    } else if (this._claimed) {
      // Already claimed indicator
      ctx.fillStyle = Theme.teal
      ctx.font = 'bold ' + Screen.scale(13) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('✅ 今日已签到', cx, panelY + panelH - 26)
    } else {
      // All 7 days claimed
      ctx.fillStyle = Theme.gold
      ctx.font = 'bold ' + Screen.scale(13) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🏆 本周签到已满!', cx, panelY + panelH - 26)
    }

    // Hint to close
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(10) + 'px sans-serif'
    ctx.fillText('点击空白处关闭', cx, panelY + panelH + 20)

    // Toast
    if (this._claimTimer > 0) {
      var alpha = Math.min(1, this._claimTimer / 400)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = Theme.ink
      ctx.font = 'bold ' + Screen.scale(16) + 'px sans-serif'
      ctx.fillText(this._claimToast || '', cx, Screen.gameHeight / 2)
      ctx.restore()
    }
  }
}

window.SignInPanel = new SignInPanelClass()
