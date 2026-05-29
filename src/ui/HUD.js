class HUDClass {
  constructor() {
    this.gold = 0
    this.displayGold = 0
    this.combo = 0
    this.maxCombo = 0
    this.timer = 30
    this.wave = 0
    this.totalWaves = 0
    this.stars = 0
    this.level = 0
    this.levelName = ''
    this._dirty = true
    this._time = 0
    this._pauseBtn = null
  }

  init(levelConfig) {
    this.gold = 0
    this.displayGold = 0
    this.combo = 0
    this.maxCombo = 0
    this.timer = (levelConfig.duration || 30) * 1000
    this.wave = 1
    this.totalWaves = levelConfig.waves.length
    this.level = levelConfig.level
    this.levelName = levelConfig.name || ''
    this.stars = 3
    this._dirty = true
    this._time = 0
  }

  setGold(val) { if (this.gold !== val) { this.gold = val; this._dirty = true } }
  addGold(val) { this.gold += val; this._dirty = true }
  setCombo(val) { if (this.combo !== val) { this.combo = val; this._dirty = true }; if (val > this.maxCombo) this.maxCombo = val }
  setTimer(val) { if (this.timer !== val) { this.timer = Math.max(0, val); this._dirty = true } }
  setWave(val) { if (this.wave !== val) { this.wave = val; this._dirty = true } }

  hitTestPause(px, py) {
    if (!this._pauseBtn) return false
    var b = this._pauseBtn
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h
  }

  update(dt) {
    this._time += dt
    if (this.timer > 0) {
      this.timer -= dt
      this._dirty = true
    }
    if (this.displayGold < this.gold) {
      this.displayGold = Math.min(this.gold, this.displayGold + Math.ceil((this.gold - this.displayGold) * 0.1))
      this._dirty = true
    }
  }

  render(ctx) {
    var topY = Screen.safeAreaTop + 8
    var padding = Screen.scale(10)
    var barH = Screen.scale(42)
    var barW = Screen.gameWidth - padding * 2
    var barX = padding

    ctx.save()

    // ── Panel (paper card) ──
    Theme.drawPaperCard(ctx, barX, topY, barW, barH, {
      fill: Theme.paperWhite,
      border: Theme.ink,
      radius: 10,
      shadowOffset: 3
    })

    var midY = topY + barH / 2

    // ── Level + Gold (left, stacked) ──
    var leftX = barX + 12
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    // Level number + name
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(12) + 'px sans-serif'
    ctx.fillText('第' + this.level + '关 ' + this.levelName, leftX, midY - 7)

    // Gold
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(10) + 'px sans-serif'
    ctx.fillText('💰 ' + this.displayGold, leftX, midY + 9)

    // ── Pause button (right edge) ──
    var pauseBtnW = Screen.scale(30)
    var pauseBtnH = Screen.scale(30)
    var pauseBtnX = Screen.gameWidth - padding - 10 - pauseBtnW
    var pauseBtnY = topY + (barH - pauseBtnH) / 2
    this._pauseBtn = { x: pauseBtnX, y: pauseBtnY, w: pauseBtnW, h: pauseBtnH }

    ctx.fillStyle = Theme.paperCream
    ctx.strokeStyle = Theme.ink
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(pauseBtnX, pauseBtnY, pauseBtnW, pauseBtnH, [6])
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = Theme.ink
    ctx.font = Screen.scale(16) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⏸', pauseBtnX + pauseBtnW / 2, pauseBtnY + pauseBtnH / 2)

    // ── Wave indicator (right, left of pause btn) ──
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(11) + 'px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText('第 ' + this.wave + '/' + this.totalWaves + ' 波', pauseBtnX - 8, midY)

    // ── Defense HP blocks (right, below wave) ──
    var hpBlocks = 10
    var blockW = Screen.scale(8)
    var blockH = 7
    var blockGap = 2
    var blocksTotalW = hpBlocks * blockW + (hpBlocks - 1) * blockGap
    var blocksX = Screen.gameWidth - padding - 10 - blocksTotalW
    var blocksY = topY + barH - 10
    var hpRatio = window._defenseHPRatio != null ? window._defenseHPRatio : 1
    var filledBlocks = Math.max(0, Math.ceil(hpRatio * hpBlocks))

    for (var bi = 0; bi < hpBlocks; bi++) {
      var bx = blocksX + bi * (blockW + blockGap)
      if (bi < filledBlocks) {
        ctx.fillStyle = hpRatio > 0.5 ? Theme.teal : hpRatio > 0.2 ? Theme.gold : Theme.red
      } else {
        ctx.fillStyle = 'rgba(75, 53, 40, 0.1)'
      }
      ctx.strokeStyle = Theme.ink
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(bx, blocksY, blockW, blockH, [1])
      ctx.fill()
      ctx.stroke()
    }

    // ── Combo (center) ──
    if (this.combo >= 5) {
      var comboY = midY
      var comboX = Screen.gameWidth / 2

      // Combo number — bold ink with gold shadow
      ctx.fillStyle = Theme.gold
      ctx.font = 'bold ' + Screen.scale(19) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this.combo + 'x', comboX + 1, comboY + 1)

      ctx.fillStyle = Theme.ink
      ctx.fillText(this.combo + 'x', comboX, comboY)

      // "COMBO" label
      ctx.fillStyle = Theme.inkLight
      ctx.font = Screen.scale(8) + 'px sans-serif'
      ctx.textBaseline = 'middle'
      ctx.fillText('COMBO', comboX, comboY + 14)
    }

    // ── Timer ──
    if (this.timer > 0) {
      var secs = Math.ceil(this.timer / 1000)
      var urgent = this.timer <= 10000
      var timerY = topY + barH + 22
      var pulse = urgent ? (0.6 + 0.4 * Math.sin(this._time / 150)) : 1
      var timerX = Screen.gameWidth / 2

      if (urgent) {
        ctx.globalAlpha = pulse
      }

      var timerW = Screen.scale(52)
      var timerH = Screen.scale(20)
      var timerBg = urgent ? Theme.red : Theme.paperWhite

      Theme.drawPaperCard(ctx, timerX - timerW / 2, timerY - timerH / 2, timerW, timerH, {
        fill: timerBg,
        border: Theme.ink,
        radius: 6,
        shadowOffset: 2
      })

      ctx.fillStyle = urgent ? Theme.paperWhite : Theme.ink
      ctx.font = 'bold ' + Screen.scale(11) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⏱ ' + secs + 's', timerX, timerY)
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }
}

window.HUD = new HUDClass()
