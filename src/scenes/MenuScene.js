class MenuScene {
  constructor() {
    this.buttons = []
    this._titleY = 0
    this._titleTarget = 0
    this._initialized = false
    this._avatarPickerOpen = false
    this._tapHandlerRegistered = false
    this._avatars = ['🐷', '🐽', '🐗', '🐖', '🐸', '🐯', '🐱', '🐶', '🦊', '🐰', '🐼', '🐨', '🐮', '🦁', '🐔', '🐙', '🦄', '🐳', '👽', '🤖', '👻', '😈', '👾', '💩']
  }

  onEnter() {
    this._createGameClubButton()
    this._registerTapHandler()
    this._avatarPickerOpen = false
    if (this._initialized) {
      this._setupButtons()
      return
    }
    this._initialized = true
    this._titleTarget = Screen.gameHeight * 0.14
    this._titleY = -120
    this._setupButtons()

    if (!Storage.getNickname()) {
      Storage.setNickname('小猪')
    }
  }

  _setupButtons() {
    this.buttons = []
    const cx = Screen.gameWidth / 2
    const gap = Screen.scale(10)

    // ── Row 1: Primary ──
    var r1w = Screen.scale(240)
    var r1h = Screen.scale(52)
    var r1y = Screen.gameHeight * 0.48
    this.buttons.push(new Button(
      cx, r1y, r1w, r1h,
      '⚡ 开 始 暴 打', '#FF3860',
      () => { SceneManager.switchTo('battle') }
    ))

    // ── Row 2: Paired (shop | gold) ──
    var r2w = Screen.scale(115)
    var r2h = Screen.scale(42)
    var r2y = Screen.gameHeight * 0.595
    var r2LeftX = cx - r2w / 2 - gap / 2
    var r2RightX = cx + r2w / 2 + gap / 2

    this.buttons.push(new Button(
      r2LeftX, r2y, r2w, r2h,
      '🏪 武器商店', '#00D4FF',
      () => { SceneManager.switchTo('shop') }
    ))
    this.buttons.push(new Button(
      r2RightX, r2y, r2w, r2h,
      '📺 领金币 +300', '#FFB800',
      () => {
        AdManager.showRewardedVideo((watched) => {
          if (watched) {
            Storage.addGold(300)
            this._showToast('+300 💰')
          }
        })
      }
    ))

    // ── Row 3: Paired (nickname | sound) ──
    var r3w = Screen.scale(115)
    var r3h = Screen.scale(36)
    var r3y = Screen.gameHeight * 0.69
    var r3LeftX = cx - r3w / 2 - gap / 2
    var r3RightX = cx + r3w / 2 + gap / 2

    this.buttons.push(new Button(
      r3LeftX, r3y, r3w, r3h,
      '✏️ 改昵称', '#7B68EE',
      () => { this._changeNickname() }
    ))
    this.buttons.push(new Button(
      r3RightX, r3y, r3w, r3h,
      '🔊 音效', '#9E9E9E',
      () => {
        const on = AudioManager.toggle()
        this.buttons[4].text = on ? '🔊 音效' : '🔇 静音'
      }
    ))
  }

  _showToast(text) {
    this._toastText = text
    this._toastTimer = 1500
  }

  _registerTapHandler() {
    if (this._tapHandlerRegistered) return
    this._tapHandlerRegistered = true
    InputManager.onTap((pos) => {
      if (SceneManager.currentScene !== this || !this._avatarPickerOpen) return
      const cell = this._findAvatarCell(pos.x, pos.y)
      if (cell && cell.action === 'album') {
        this._chooseFromAlbum()
      }
    })
  }

  _findAvatarCell(x, y) {
    const cells = this._avatarCells || []
    for (const cell of cells) {
      if (x >= cell.x && x <= cell.x + cell.w &&
          y >= cell.y && y <= cell.y + cell.h) {
        return cell
      }
    }
    return null
  }

  _renderAvatarPicker(ctx) {
    ctx.fillStyle = 'rgba(75, 53, 40, 0.55)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    const cols = 6
    const cellSize = Screen.scale(44)
    const gap = Screen.scale(8)
    const totalW = cols * cellSize + (cols - 1) * gap
    const startX = (Screen.gameWidth - totalW) / 2 + cellSize / 2
    const startY = Screen.gameHeight * 0.32

    const panelW = totalW - cellSize + 36
    const panelH = Math.ceil(this._avatars.length / cols) * (cellSize + gap) + 100
    const panelX = startX - cellSize / 2 - 18
    const panelY = startY - cellSize / 2 - 48

    // Panel (paper card)
    Theme.drawPaperCard(ctx, panelX, panelY, panelW, panelH, {
      fill: Theme.paperWhite,
      border: Theme.ink,
      radius: 12,
      shadowOffset: 5
    })

    // Title
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(16) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('选择头像', Screen.gameWidth / 2, panelY + 28)

    // Album button
    const albumBtnW = Screen.scale(130)
    const albumBtnH = Screen.scale(32)
    const albumBtnX = Screen.gameWidth / 2
    const albumBtnY = panelY + 56

    Theme.drawPaperCard(ctx, albumBtnX - albumBtnW / 2, albumBtnY - albumBtnH / 2, albumBtnW, albumBtnH, {
      fill: Theme.teal,
      border: Theme.ink,
      radius: 10,
      shadowOffset: 3
    })

    ctx.fillStyle = Theme.paperWhite
    ctx.font = 'bold ' + Screen.scale(12) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📷 从相册选择', albumBtnX, albumBtnY)

    this._avatarCells = [{
      x: albumBtnX - albumBtnW / 2, y: albumBtnY - albumBtnH / 2,
      w: albumBtnW, h: albumBtnH,
      action: 'album'
    }]

    const emojiStartY = albumBtnY + albumBtnH / 2 + 12

    // Divider
    ctx.strokeStyle = 'rgba(75, 53, 40, 0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(panelX + 20, emojiStartY + 4)
    ctx.lineTo(panelX + panelW - 20, emojiStartY + 4)
    ctx.stroke()

    // Emoji grid
    for (let i = 0; i < this._avatars.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const cx = startX + col * (cellSize + gap)
      const cy = emojiStartY + row * (cellSize + gap) + 12
      const isEmojiSelected = Storage.getAvatarType() === 'emoji' && this._avatars[i] === Storage.getAvatar()

      // Cell
      const cellBg = isEmojiSelected ? Theme.gold : Theme.paperWhite
      Theme.drawPaperCard(ctx, cx - cellSize / 2, cy - cellSize / 2, cellSize, cellSize, {
        fill: cellBg,
        border: isEmojiSelected ? Theme.ink : 'rgba(75, 53, 40, 0.2)',
        radius: 8,
        shadowOffset: isEmojiSelected ? 3 : 2
      })

      ctx.font = Screen.scale(22) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this._avatars[i], cx, cy)

      this._avatarCells.push({
        x: cx - cellSize / 2, y: cy - cellSize / 2,
        w: cellSize, h: cellSize,
        emoji: this._avatars[i],
        action: 'emoji'
      })
    }
  }

  _getAvatarImage() {
    var path = Storage.getAvatar()
    if (!path) return null
    if (!this._cachedAvatarImg || this._cachedAvatarPath !== path) {
      this._cachedAvatarImg = wx.createImage()
      this._cachedAvatarImg.src = path
      this._cachedAvatarPath = path
    }
    return this._cachedAvatarImg
  }

  _chooseFromAlbum() {
    var self = this
    var onSuccess = function (tempPath) {
      if (!tempPath) {
        self._showToast('没有选中照片')
        return
      }
      var fs = wx.getFileSystemManager && wx.getFileSystemManager()
      var savedPath = wx.env.USER_DATA_PATH + '/avatar_' + Date.now() + '.png'
      try {
        if (fs && fs.saveFileSync) {
          fs.saveFileSync(tempPath, savedPath)
          Storage.setPhotoAvatar(savedPath)
        } else {
          Storage.setPhotoAvatar(tempPath)
        }
        self._avatarPickerOpen = false
      } catch (e) {
        Storage.setPhotoAvatar(tempPath)
        self._avatarPickerOpen = false
      }
    }
    var onFail = function (err) {
      console.warn('[Avatar] choose image failed:', err)
      if (err && /cancel/i.test(String(err.errMsg || err))) return
      self._showToast('无法打开相册')
    }

    if (typeof wx.chooseMedia === 'function') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: function (res) {
          var file = res.tempFiles && res.tempFiles[0]
          onSuccess(file && file.tempFilePath)
        },
        fail: onFail
      })
      return
    }

    if (typeof wx.chooseImage === 'function') {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: function (res) {
          onSuccess(res.tempFilePaths && res.tempFilePaths[0])
        },
        fail: onFail
      })
      return
    }

    this._showToast('当前微信版本不支持相册')
  }

  _changeNickname() {
    const currentName = Storage.getNickname() || '小猪'
    if (typeof wx.showKeyboard !== 'function') {
      wx.showModal({
        title: '提示',
        content: '请升级微信版本以使用改名功能',
        showCancel: false
      })
      return
    }

    const onComplete = (res) => {
      const name = (res && res.value || '').trim()
      if (name) {
        Storage.setNickname(name)
        this._showToast('昵称已改为: ' + name)
      }
      wx.offKeyboardComplete(onComplete)
    }

    wx.onKeyboardComplete(onComplete)
    wx.showKeyboard({
      defaultValue: currentName,
      maxLength: 8,
      confirmText: '确定'
    })
  }

  onExit() {
    this._destroyGameClubButton()
  }

  _createGameClubButton() {
    if (this._gameClubBtn) return
    try {
      this._gameClubBtn = wx.createGameClubButton({
        type: 'text',
        text: '🎮 游戏圈',
        style: {
          left: Screen.gameWidth - 95,
          top: Screen.safeAreaTop + 40,
          width: 80,
          height: 30
        },
        icon: 'light'
      })
    } catch (e) {}
  }

  _destroyGameClubButton() {
    if (this._gameClubBtn) {
      try { this._gameClubBtn.destroy() } catch (e) {}
      this._gameClubBtn = null
    }
  }

  update(dt) {
    this._titleY += (this._titleTarget - this._titleY) * 0.06

    if (this._toastTimer > 0) this._toastTimer -= dt

    for (const btn of this.buttons) {
      btn.update(dt)
    }

    const touch = InputManager.getPrimaryTouch()
    if (touch && InputManager.justPressed()) {
      if (this._avatarPickerOpen) {
        const cell = this._findAvatarCell(touch.x, touch.y)
        if (cell) {
          if (cell.action === 'album') {
            return
          } else if (cell.action === 'emoji') {
            Storage.setEmojiAvatar(cell.emoji)
            this._avatarPickerOpen = false
          }
          return
        }
        this._avatarPickerOpen = false
      }

      // Avatar tap
      var cardW = Screen.scale(210)
      var cardY = this._titleTarget + 50
      var avatarCX = Screen.gameWidth / 2 - cardW / 2 + 30
      var avatarCY = cardY + Screen.scale(56) / 2
      const dx = touch.x - avatarCX
      const dy = touch.y - avatarCY
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        this._avatarPickerOpen = true
        return
      }

      for (const btn of this.buttons) {
        if (btn.containsPoint(touch.x, touch.y)) {
          btn.onTap(touch.x, touch.y)
          break
        }
      }
    }
  }

  render(ctx) {
    const cx = Screen.gameWidth / 2

    // ── Paper background ──
    Theme.drawBackground(ctx)

    // ── Title ──
    var titleY = this._titleY
    var titleText = '暴打小猪'

    // Gold text shadow (offset, no blur)
    ctx.fillStyle = Theme.gold
    ctx.font = 'bold ' + Screen.scale(48) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(titleText, cx + 2, titleY + 2)

    // Main ink text
    ctx.fillStyle = Theme.ink
    ctx.fillText(titleText, cx, titleY)

    // Subtitle
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(12) + 'px sans-serif'
    ctx.fillText('今日份坏心情已排队', cx, titleY + 36)

    // ── Player Info Card ──
    var cardW = Screen.scale(210)
    var cardH = Screen.scale(56)
    var cardX = cx - cardW / 2
    var cardY = titleY + 50

    Theme.drawPaperCard(ctx, cardX, cardY, cardW, cardH, {
      fill: Theme.paperWhite,
      border: Theme.ink,
      radius: 12,
      shadowOffset: 4
    })

    // Avatar circle
    var avatarCX = cardX + 30
    var avatarCY = cardY + cardH / 2
    var avatarR = 19

    // Avatar shadow
    ctx.fillStyle = 'rgba(75, 53, 40, 0.2)'
    ctx.beginPath()
    ctx.arc(avatarCX + 3, avatarCY + 3, avatarR, 0, Math.PI * 2)
    ctx.fill()

    // Avatar fill
    ctx.fillStyle = Theme.gold
    ctx.beginPath()
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2)
    ctx.fill()

    // Avatar border
    ctx.strokeStyle = Theme.ink
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2)
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (Storage.getAvatarType() === 'photo') {
      var photoImg = this._getAvatarImage()
      if (photoImg) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarCX, avatarCY, avatarR - 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(photoImg, avatarCX - avatarR + 2, avatarCY - avatarR + 2, (avatarR - 2) * 2, (avatarR - 2) * 2)
        ctx.restore()
      } else {
        ctx.font = Screen.scale(17) + 'px sans-serif'
        ctx.fillText('🐷', avatarCX, avatarCY)
      }
    } else {
      ctx.font = Screen.scale(18) + 'px sans-serif'
      ctx.fillText(Storage.getAvatar() || '🐷', avatarCX, avatarCY)
    }

    // Player name
    var nickname = Storage.getNickname() || '小猪'
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(14) + 'px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(nickname, avatarCX + 30, avatarCY - 7)

    // Gold
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(11) + 'px sans-serif'
    ctx.fillText('💰 ' + Storage.getGold(), avatarCX + 30, avatarCY + 9)

    // Edit indicator
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(9) + 'px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('✏️', cardX + cardW - 12, cardY + cardH / 2)

    // ── Avatar Picker or Buttons ──
    if (this._avatarPickerOpen) {
      this._renderAvatarPicker(ctx)
    } else {
      for (const btn of this.buttons) {
        btn.render(ctx)
      }
    }

    // ── Toast ──
    if (this._toastTimer > 0) {
      var alpha = Math.min(1, this._toastTimer / 300)
      var toastW = Screen.scale(180)
      var toastH = Screen.scale(40)
      var toastX = cx - toastW / 2
      var toastY = Screen.gameHeight / 2 - toastH / 2

      Theme.drawPaperCard(ctx, toastX, toastY, toastW, toastH, {
        fill: Theme.paperWhite,
        border: Theme.ink,
        radius: 10,
        shadowOffset: 4,
        alpha: alpha
      })

      ctx.globalAlpha = alpha
      ctx.fillStyle = Theme.ink
      ctx.font = 'bold ' + Screen.scale(15) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this._toastText || '', cx, toastY + toastH / 2)
      ctx.globalAlpha = 1
    }

    // ── Bottom weapon strip ──
    var bottomY = Screen.gameHeight - 28
    var weaponList = WeaponSwitcher.weapons.map(function (w) { return WeaponConfig[w].icon }).join('  ')
    var stripW = Screen.scale(270)
    var stripX = cx - stripW / 2

    Theme.drawPaperCard(ctx, stripX, bottomY - 14, stripW, 28, {
      fill: Theme.paperCream,
      border: Theme.ink,
      radius: 8,
      shadowOffset: 3
    })

    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(10) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('武器 ' + weaponList, cx, bottomY)
  }
}

window.MenuScene = new MenuScene()
