class Match3SceneClass {
  constructor() {
    this.boardX = 0
    this.boardY = 0
    this.cellSize = 0
    this.engine = Match3Engine
    this.state = 'idle'
    this._selectedCell = null
    this._matches = []
    this._damageResults = []
    this._animTimer = 0
    this._swapCells = null
    this._swapProgress = 0
    this._matchedCells = null
    this._fallOffsets = null
    this._totalDamage = 0
    this._chainCount = 0
    this._shakeTimer = 0
    this._bigText = ''
    this._bigTextTimer = 0

    // Pig
    this._pigName = ''
    this._pigMaxHp = 0
    this._pigHp = 0
    this._pigEmotion = 'arrogant'
    this._pigDialog = ''
    this._pigDialogTimer = 0
    this._pigShakeTimer = 0

    // Game state
    this._movesLeft = 30
    this._level = 1
    this._pigDefeated = false
  }

  onEnter(data) {
    this._level = (data && data.level) || 1
    this._movesLeft = 30
    this._totalDamage = 0
    this._pigDefeated = false
    this._chainCount = 0
    this.state = 'idle'
    this._selectedCell = null
    this._matches = []
    this._damageResults = []
    this._swapCells = null
    this._matchedCells = null
    this._fallOffsets = null
    this._shakeTimer = 0
    this._bigText = ''
    this._bigTextTimer = 0
    this._pigDialog = ''
    this._pigDialogTimer = 0
    this._pigShakeTimer = 0

    var self = this

    // Setup pig
    var hitList = Storage.getHitList()
    if (hitList.length > 0 && Math.random() < 0.7) {
      this._pigName = hitList[Math.floor(Math.random() * hitList.length)].name
    } else {
      this._pigName = Storage.getNickname() || '小猪'
    }
    this._pigMaxHp = 100 + this._level * 30
    if (this._level % 5 === 0) this._pigMaxHp *= 2
    this._pigHp = this._pigMaxHp
    this._pigEmotion = 'arrogant'

    // Layout
    var availW = Screen.gameWidth * 0.88
    this.cellSize = Math.floor(availW / 8)
    this.boardX = Math.floor((Screen.gameWidth - this.cellSize * 8) / 2)
    this.boardY = Math.floor(Screen.gameHeight * 0.28)

    // Init engine
    this.engine.init()

    // Track daily plays
    var today = new Date().toDateString()
    var lastDate = Storage.get('stats.match3LastDate') || ''
    if (lastDate !== today) {
      Storage.set('stats.match3DailyPlays', 0)
      Storage.set('stats.match3LastDate', today)
    }
    var plays = Storage.get('stats.match3DailyPlays') || 0
    Storage.set('stats.match3DailyPlays', plays + 1)
  }

  _getCellCenter(r, c) {
    return {
      x: this.boardX + c * this.cellSize + this.cellSize / 2,
      y: this.boardY + r * this.cellSize + this.cellSize / 2
    }
  }

  _getCellFromXY(px, py) {
    var c = Math.floor((px - this.boardX) / this.cellSize)
    var r = Math.floor((py - this.boardY) / this.cellSize)
    if (r >= 0 && r < 8 && c >= 0 && c < 8) return { r: r, c: c }
    return null
  }

  update(dt) {
    if (this._bigTextTimer > 0) this._bigTextTimer -= dt
    if (this._shakeTimer > 0) this._shakeTimer -= dt
    if (this._pigShakeTimer > 0) this._pigShakeTimer -= dt
    if (this._pigDialogTimer > 0) this._pigDialogTimer -= dt

    switch (this.state) {
      case 'swapping':
        this._animTimer -= dt
        this._swapProgress = 1 - this._animTimer / 200
        if (this._animTimer <= 0) {
          this.state = 'matching'
          this._animTimer = 300
          this._swapCells = null
          this._swapProgress = 0
        }
        break

      case 'matching':
        this._animTimer -= dt
        if (this._animTimer <= 0) {
          // Remove matches and apply damage
          this._damageResults = this.engine.removeMatches(this._matches)
          this._applyDamage()
          this._matchedCells = this._getAllMatchedCells()
          this._matches = []
          this.state = 'falling'
          this._animTimer = 350
          this._fallOffsets = this._computeFallOffsets()
        }
        break

      case 'falling':
        this._animTimer -= dt
        var progress = 1 - this._animTimer / 350
        if (this._animTimer <= 0) {
          this.engine.applyGravity()
          this._matchedCells = null
          this._fallOffsets = null
          this._damageResults = []

          // Check for chain matches
          var newMatches = this.engine.findMatches()
          if (newMatches.length > 0) {
            this._chainCount++
            this._matches = newMatches
            this.state = 'matching'
            this._animTimer = 300
          } else if (this._pigDefeated) {
            this.state = 'victory'
            this._animTimer = 1500
          } else if (this._movesLeft <= 0) {
            this.state = 'defeat'
            this._animTimer = 1500
          } else if (!this.engine.hasValidMoves()) {
            this.engine.shuffle()
            this.state = 'idle'
            this._selectedCell = null
          } else {
            this.state = 'idle'
            this._selectedCell = null
          }
        }
        break

      case 'victory':
      case 'defeat':
        this._animTimer -= dt
        if (InputManager.justPressed() && this._animTimer <= 0) {
          if (this.state === 'victory') {
            var reward = Math.floor(this._totalDamage / 2)
            Storage.addGold(reward)
          }
          SceneManager.switchTo('menu')
        }
        break

      default:
        this._handleInput()
        break
    }
  }

  _applyDamage() {
    for (var i = 0; i < this._damageResults.length; i++) {
      var dr = this._damageResults[i]
      var config = WeaponConfig[dr.weaponId]
      var baseDamage = config ? config.upgrades[0].damage : 10
      this._totalDamage += baseDamage * dr.multiplier
      this._pigHp -= baseDamage * dr.multiplier
      this._pigShakeTimer = 300
    }

    // Big text for special matches
    if (this._chainCount > 1) {
      this._bigText = this._chainCount + 'x CHAIN!'
      this._bigTextTimer = 1500
    }
    var hasSpecial = false
    for (var j = 0; j < this._damageResults.length; j++) {
      if (this._damageResults[j].shape === 'special' || this._damageResults[j].shape === 'five') {
        hasSpecial = true
      }
    }
    if (hasSpecial) {
      this._bigText = '💥 无双连揍!'
      this._bigTextTimer = 1800
      this._shakeTimer = 400
    }

    this._updatePigEmotion()

    if (this._pigHp <= 0) {
      this._pigHp = 0
      this._pigDefeated = true
      Storage.incrementHitCount(this._pigName)
    }
  }

  _updatePigEmotion() {
    var ratio = this._pigHp / this._pigMaxHp
    if (ratio <= 0) {
      this._pigEmotion = 'ko'
    } else if (ratio < 0.15) {
      this._pigEmotion = 'broken'
    } else if (ratio < 0.4) {
      this._pigEmotion = 'begging'
    } else {
      this._pigEmotion = 'arrogant'
    }
    this._maybePigDialog()
  }

  _maybePigDialog() {
    if (this._pigDialogTimer > 0) return
    this._pigDialogTimer = 2000

    var pool = DialogConfig[this._pigEmotion] || DialogConfig.arrogant
    var raw = pool[Math.floor(Math.random() * pool.length)]
    this._pigDialog = raw.replace(/\{name\}/g, this._pigName).replace(/\{combo\}/g, String(this._chainCount))

    var customDialog = Storage.getCustomDialog(this._pigName)
    if (customDialog && Math.random() < 0.3) {
      this._pigDialog = customDialog
    }
  }

  _getAllMatchedCells() {
    var set = {}
    var all = []
    for (var i = 0; i < this._matches.length; i++) {
      for (var j = 0; j < this._matches[i].cells.length; j++) {
        var key = this._matches[i].cells[j].r + ',' + this._matches[i].cells[j].c
        if (!set[key]) {
          set[key] = true
          all.push(this._matches[i].cells[j])
        }
      }
    }
    return all
  }

  _computeFallOffsets() {
    var offsets = {}
    for (var c = 0; c < 8; c++) {
      var gapCount = 0
      for (var r = 7; r >= 0; r--) {
        if (this.engine.grid[r][c] === null) {
          gapCount++
        } else if (gapCount > 0) {
          offsets[r + ',' + c] = gapCount
        }
      }
    }
    return offsets
  }

  _handleInput() {
    if (!InputManager.justPressed()) return
    var touch = InputManager.getPrimaryTouch()
    if (!touch) return

    // Back button
    if (this._backBtnRect && touch.x >= this._backBtnRect.x && touch.x <= this._backBtnRect.x + this._backBtnRect.w && touch.y >= this._backBtnRect.y && touch.y <= this._backBtnRect.y + this._backBtnRect.h) {
      SceneManager.switchTo('menu')
      return
    }

    var cell = this._getCellFromXY(touch.x, touch.y)
    if (!cell) return

    if (!this._selectedCell) {
      this._selectedCell = cell
      return
    }

    // Same cell: deselect
    if (this._selectedCell.r === cell.r && this._selectedCell.c === cell.c) {
      this._selectedCell = null
      return
    }

    // Adjacent: try swap
    if (this.engine.canSwap(this._selectedCell.r, this._selectedCell.c, cell.r, cell.c)) {
      this.engine.swap(this._selectedCell.r, this._selectedCell.c, cell.r, cell.c)
      this._swapCells = { from: this._selectedCell, to: cell }
      this._chainCount = 0
      this._matches = this.engine.findMatches()
      if (this._matches.length > 0) {
        this._movesLeft--
        this.state = 'swapping'
        this._animTimer = 200
        this._swapProgress = 0
        this._selectedCell = null
      } else {
        // Shouldn't happen since canSwap checked, but swap back
        this.engine.swap(this._selectedCell.r, this._selectedCell.c, cell.r, cell.c)
      }
    } else {
      // Non-adjacent: select new cell
      this._selectedCell = cell
    }
  }

  render(ctx) {
    Theme.drawBackground(ctx)
    this._renderPig(ctx)
    this._renderBoard(ctx)
    this._renderHUD(ctx)
    this._renderOverlays(ctx)
  }

  _renderPig(ctx) {
    var pigCX = Screen.gameWidth / 2
    var pigCY = Screen.gameHeight * 0.10
    var pigR = Screen.scale(28)
    var shakeX = 0
    var shakeY = 0
    if (this._pigShakeTimer > 0) {
      shakeX = (Math.random() - 0.5) * 8
      shakeY = (Math.random() - 0.5) * 8
    }
    pigCX += shakeX
    pigCY += shakeY

    // Pig body (emoji)
    ctx.font = (pigR * 2) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🐷', pigCX, pigCY)

    // Pig name
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(13) + 'px sans-serif'
    ctx.fillText(this._pigName, pigCX, pigCY + pigR + 16)

    // HP bar
    var barW = Screen.scale(160)
    var barH = Screen.scale(8)
    var barX = pigCX - barW / 2
    var barY = pigCY + pigR + 30
    ctx.fillStyle = '#ddd'
    ctx.fillRect(barX, barY, barW, barH)
    var ratio = Math.max(0, this._pigHp / this._pigMaxHp)
    var barColor = ratio > 0.5 ? '#4CAF50' : ratio > 0.2 ? '#FF9800' : '#F44336'
    ctx.fillStyle = barColor
    ctx.fillRect(barX, barY, barW * ratio, barH)

    // HP text
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(9) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(this._pigHp + '/' + this._pigMaxHp, pigCX, barY + barH + 14)

    // Dialog bubble
    if (this._pigDialog && this._pigDialogTimer > 0) {
      ctx.font = Screen.scale(10) + 'px sans-serif'
      var tw = ctx.measureText(this._pigDialog).width + 12
      var th = 20
      var bx = pigCX - tw / 2
      var by = pigCY - pigR - 36
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(bx, by, tw, th, [6])
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#333'
      ctx.fillText(this._pigDialog, pigCX, by + th / 2 + 4)
    }
  }

  _renderBoard(ctx) {
    var cs = this.cellSize

    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var cx = this.boardX + c * cs + cs / 2
        var cy = this.boardY + r * cs + cs / 2
        var drawX = cx
        var drawY = cy

        // Apply fall offsets
        if (this._fallOffsets) {
          var key = r + ',' + c
          if (this._fallOffsets[key]) {
            var progress = Math.min(1, (350 - this._animTimer) / 350)
            drawY += this._fallOffsets[key] * cs * (1 - progress)
          }
        }

        // Apply swap animation
        if (this._swapCells && this._swapProgress < 1) {
          var p = this._swapProgress
          if (this._swapCells.from.r === r && this._swapCells.from.c === c) {
            drawX += (this._swapCells.to.c - this._swapCells.from.c) * cs * p
            drawY += (this._swapCells.to.r - this._swapCells.from.r) * cs * p
          } else if (this._swapCells.to.r === r && this._swapCells.to.c === c) {
            drawX += (this._swapCells.from.c - this._swapCells.to.c) * cs * p
            drawY += (this._swapCells.from.r - this._swapCells.to.r) * cs * p
          }
        }

        // Check if matched
        var isMatched = false
        if (this._matchedCells) {
          for (var mi = 0; mi < this._matchedCells.length; mi++) {
            if (this._matchedCells[mi].r === r && this._matchedCells[mi].c === c) {
              isMatched = true
              break
            }
          }
        }

        if (isMatched) {
          var alpha = this._animTimer > 0 ? Math.max(0, this._animTimer / 300) : 0
          ctx.globalAlpha = alpha
        }

        // Cell background
        var isSelected = this._selectedCell && this._selectedCell.r === r && this._selectedCell.c === c
        Theme.drawPaperCard(ctx, drawX - cs / 2 + 1, drawY - cs / 2 + 1, cs - 2, cs - 2, {
          fill: isSelected ? Theme.gold : Theme.paperWhite,
          border: isSelected ? Theme.ink : 'rgba(75, 53, 40, 0.12)',
          radius: 6,
          shadowOffset: isSelected ? 3 : 1
        })

        // Weapon emoji
        ctx.globalAlpha = 1
        var weaponId = this.engine.grid[r][c]
        if (weaponId) {
          var config = WeaponConfig[weaponId]
          if (config) {
            ctx.font = Math.floor(cs * 0.5) + 'px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(config.icon, drawX, drawY)
          }
        }
      }
    }
  }

  _renderHUD(ctx) {
    var cx = Screen.gameWidth / 2
    var hudY = Screen.gameHeight - Screen.scale(50)

    Theme.drawPaperCard(ctx, cx - Screen.scale(130), hudY, Screen.scale(260), Screen.scale(36), {
      fill: Theme.paperWhite,
      border: Theme.ink,
      radius: 10,
      shadowOffset: 3
    })

    // Moves left
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(14) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    var movesColor = this._movesLeft <= 5 ? Theme.red : Theme.ink
    ctx.fillStyle = movesColor
    ctx.fillText('剩余 ' + this._movesLeft + ' 步', cx - Screen.scale(50), hudY + Screen.scale(18))

    // Daily plays
    var dailyPlays = Storage.get('stats.match3DailyPlays') || 0
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(10) + 'px sans-serif'
    ctx.fillText('今日 ' + dailyPlays + '/5', cx + Screen.scale(60), hudY + Screen.scale(18))

    // Back button
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(11) + 'px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('← 退出', Screen.gameWidth - 12, Screen.safeAreaTop + 22)
    this._backBtnRect = { x: Screen.gameWidth - 80, y: Screen.safeAreaTop + 4, w: 70, h: 28 }
  }

  _renderOverlays(ctx) {
    // Big text
    if (this._bigTextTimer > 0) {
      var alpha = Math.min(1, this._bigTextTimer / 500)
      var scale = 1 + (1 - this._bigTextTimer / 2000) * 0.2
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = Theme.gold
      ctx.font = 'bold ' + Screen.scale(30 * scale) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(this._bigText, Screen.gameWidth / 2 + 2, Screen.gameHeight * 0.45 + 2)
      ctx.fillStyle = Theme.ink
      ctx.fillText(this._bigText, Screen.gameWidth / 2, Screen.gameHeight * 0.45)
      ctx.restore()
    }

    // Victory/Defeat overlay
    if (this.state === 'victory' || this.state === 'defeat') {
      var vAlpha = 0
      if (this.state === 'victory') {
        vAlpha = Math.min(0.5, (1500 - this._animTimer) / 1500 * 0.5)
      } else {
        vAlpha = Math.min(0.5, this._animTimer / 1500 * 0.5)
      }

      ctx.fillStyle = 'rgba(75, 53, 40, ' + vAlpha + ')'
      ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

      var cx = Screen.gameWidth / 2
      var cy = Screen.gameHeight / 2
      var isWin = this.state === 'victory'

      ctx.fillStyle = isWin ? Theme.gold : Theme.red
      ctx.font = 'bold ' + Screen.scale(32) + 'px sans-serif'
      ctx.textAlign = 'center'
      var text = isWin ? '🎉 猪已揍飞!' : '😭 步数用完...'
      ctx.fillText(text, cx + 1, cy + 1)
      ctx.fillStyle = Theme.ink
      ctx.fillText(text, cx, cy)

      if (isWin) {
        ctx.fillStyle = Theme.ink
        ctx.font = Screen.scale(13) + 'px sans-serif'
        ctx.fillText('伤害 ' + this._totalDamage + '  连击 ' + this._chainCount + 'x', cx, cy + 40)

        ctx.fillStyle = Theme.gold
        ctx.font = 'bold ' + Screen.scale(15) + 'px sans-serif'
        ctx.fillText('+ ' + Math.floor(this._totalDamage / 2) + ' 💰', cx, cy + 68)
      }
    }
  }
}

window.Match3Scene = new Match3SceneClass()
