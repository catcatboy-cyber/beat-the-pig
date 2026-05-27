class BattleScene {
  constructor() {
    this.levelConfig = null
    this.state = 'ready'  // ready, playing, wave_end, paused, victory, defeat
    this.defenseLine = new DefenseLine()
    this.escapedCount = 0
    this.totalGold = 0
    this.totalKills = 0
    this._stateTimer = 0
    this._readyCountdown = 3
    this._waveEndTimer = 0
    this._magnetPigs = []  // 磁铁收集到的金币猪
  }

  onEnter(data) {
    const levelNum = (data && data.level) || Storage.get('user.currentLevel') || 1
    this.levelConfig = LevelConfig.getLevel(levelNum)
    this.state = 'ready'
    this._readyCountdown = 3
    this._stateTimer = 0
    this.escapedCount = 0
    this.totalGold = 0
    this.totalKills = 0

    WeaponSwitcher.init()
    PigSpawner.initLevel(this.levelConfig)
    this.defenseLine.init(this.levelConfig.defenseHP)
    ComboSystem.reset()
    UpgradeSystem.reset()
    HUD.init(this.levelConfig)

    // 预加载广告
    AdManager.preloadRewarded()
  }

  onExit() {
    PigSpawner.pool.releaseAll()
  }

  update(dt) {
    switch (this.state) {
      case 'ready':
        this._updateReady(dt)
        break
      case 'playing':
        this._updatePlaying(dt)
        break
      case 'wave_end':
        this._updateWaveEnd(dt)
        break
      case 'victory':
      case 'defeat':
        this._updateEnding(dt)
        break
    }

    // 全局 UI 更新
    HUD.setCombo(ComboSystem.getCombo())
    HUD.setGold(this.totalGold)
    HUD.update(dt)
    DamageNumber.update(dt)
    DialogBubble.update(dt)
  }

  _updateReady(dt) {
    this._stateTimer += dt
    if (this._stateTimer >= 1000) {
      this._stateTimer = 0
      this._readyCountdown--
      if (this._readyCountdown <= 0) {
        this.state = 'playing'
      }
    }
  }

  _updatePlaying(dt) {
    // 输入更新
    WeaponSwitcher.update(dt)

    // 碰撞检测
    const weapon = WeaponSwitcher.getCurrentWeapon()
    const activePigs = PigSpawner.getActivePigs()
    const hits = CollisionSystem.check(weapon, activePigs)

    for (const hit of hits) {
      const pig = hit.pig
      const weaponId = hit.weaponType

      // 顿帧
      GameLoop.triggerHitStop(3)

      // 震动
      if (Storage.get('settings.vibrationEnabled')) {
        wx.vibrateShort({ type: hit.isSmash ? 'heavy' : 'light' })
      }

      // 粒子
      ParticleSystem.emitHit(hit.x, hit.y, weaponId)

      // 伤害数字
      const weaponCfg = WeaponConfig[weaponId]
      const atkMult = UpgradeSystem.getAttackMultiplier()
      const damage = weaponCfg.upgrades[WeaponSwitcher.getCurrentWeapon().level - 1].damage * atkMult
      DamageNumber.spawn(damage, hit.x, hit.y - 20, hit.isSmash)

      // 连击
      ComboSystem.onHit()

      // 金币
      const baseGold = pig.typeConfig.gold
      const comboBonus = ComboSystem.getGoldBonus(baseGold)
      const totalPigGold = baseGold + comboBonus
      this.totalGold += totalPigGold
      Storage.addGold(totalPigGold)
      ParticleSystem.emitGold(pig.x, pig.y, 3)

      // 击杀
      if (pig.hp <= 0) {
        this.totalKills++
        ParticleSystem.emitStars(pig.x, pig.y)
        if (!pig.typeConfig.isBoss) {
          DialogBubble.show(
            DialogConfig.ko[Math.floor(Math.random() * DialogConfig.ko.length)],
            pig.x, pig.y - 40
          )
        }
      }

      // 台词气泡
      if (pig.currentDialog) {
        DialogBubble.show(pig.currentDialog, pig.x, pig.y - 50)
      }
    }

    // 生成器更新
    PigSpawner.update(dt)

    // 逃出检测
    const escaped = PigSpawner.getEscapedPigs()
    for (const pig of escaped) {
      this.escapedCount++
      this.defenseLine.takeDamage(1)
      DialogBubble.show('溜了溜了~', pig.x, Screen.gameHeight - 50)
    }

    // 防线破了
    if (!this.defenseLine.alive) {
      this.state = 'defeat'
      this._stateTimer = 0
      return
    }

    // 升级触发（每波结束时）
    if (PigSpawner.currentWave < PigSpawner.waves.length - 1) {
      // 检查波次是否结束
      if (PigSpawner.isWaveComplete() && this.state !== 'wave_end') {
        this.state = 'wave_end'
        this._waveEndTimer = 0
      }
    }

    // 通关检测
    if (PigSpawner.isLevelComplete()) {
      this.state = 'victory'
      this._stateTimer = 0
      return
    }

    // 粒子更新
    ParticleSystem.update(dt)

    // 磁铁效果
    if (UpgradeSystem.hasMagnet() && weapon) {
      for (const pig of activePigs) {
        if (pig._active && pig.alive) {
          const dx = weapon.x - pig.x
          const dy = weapon.y - pig.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            pig.x += dx / dist * 2
          }
        }
      }
    }

    this.defenseLine.update(dt)
    window._defenseHPRatio = this.defenseLine.ratio
  }

  _updateWaveEnd(dt) {
    this._waveEndTimer += dt
    ParticleSystem.update(dt)
    PigSpawner.update(dt)

    if (this._waveEndTimer > 500 && !this._waitingForChoice) {
      const choices = UpgradeSystem.getChoices(3)
      if (choices.length > 0) {
        this._showUpgradeChoices = choices
        this._choiceCards = []
        this._waitingForChoice = true
      } else {
        this.state = 'playing'
        PigSpawner.startNextWave()
      }
    }

    if (this._waitingForChoice) {
      const touch = InputManager.getPrimaryTouch()
      if (touch && !this._lastTapCheck) {
        for (const card of this._choiceCards) {
          if (card.containsPoint(touch.x, touch.y)) {
            UpgradeSystem.applyUpgrade(card.upgrade.id)
            this._waitingForChoice = false
            this._showUpgradeChoices = null
            this.state = 'playing'
            PigSpawner.startNextWave()
            break
          }
        }
      }
      this._lastTapCheck = !!touch
    } else {
      this._lastTapCheck = false
    }
  }

  _updateEnding(dt) {
    this._stateTimer += dt
    ParticleSystem.update(dt)

    if (this._stateTimer > 1500) {
      const levelNum = this.levelConfig.level
      if (this.state === 'victory') {
        // 保存进度
        if (levelNum >= (Storage.get('user.maxLevel') || 1)) {
          Storage.set('user.maxLevel', levelNum)
        }
        Storage.set('user.currentLevel', levelNum + 1)
        Storage.set('user.totalKills', (Storage.get('user.totalKills') || 0) + this.totalKills)

        // 插屏广告
        if (AdManager.shouldShowInterstitial()) {
          AdManager.showInterstitial()
        }

        SceneManager.switchTo('settlement', {
          victory: true,
          level: levelNum,
          gold: this.totalGold,
          kills: this.totalKills,
          maxCombo: ComboSystem.getMaxCombo(),
          stars: this.defenseLine.ratio >= 0.9 ? 3 : this.defenseLine.ratio >= 0.6 ? 2 : 1
        })
      } else if (this.state === 'defeat') {
        SceneManager.switchTo('settlement', {
          victory: false,
          level: levelNum,
          gold: this.totalGold,
          kills: this.totalKills,
          maxCombo: ComboSystem.getMaxCombo()
        })
      }
    }
  }

  render(ctx) {
    // Paper background
    Theme.drawBackground(ctx)

    // Holes
    PigSpawner.render(ctx)

    // Defense line
    this.defenseLine.render(ctx)

    // Particles
    ParticleSystem.render(ctx)

    // Weapon
    WeaponSwitcher.render(ctx)

    // HUD
    HUD.render(ctx)

    // Damage numbers
    DamageNumber.render(ctx)

    // Dialog bubbles
    DialogBubble.render(ctx)

    // State overlays
    if (this.state === 'ready') {
      this._renderReadyOverlay(ctx)
    } else if (this.state === 'wave_end' && this._waitingForChoice) {
      this._renderUpgradeChoice(ctx)
    } else if (this.state === 'victory') {
      this._renderVictoryOverlay(ctx)
    } else if (this.state === 'defeat') {
      this._renderDefeatOverlay(ctx)
    }
  }

  _renderReadyOverlay(ctx) {
    var cx = Screen.gameWidth / 2
    var cy = Screen.gameHeight / 2

    ctx.fillStyle = 'rgba(75, 53, 40, 0.45)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    // Countdown number — ink with gold shadow
    var countText = this._readyCountdown > 0 ? String(this._readyCountdown) : 'GO!'

    ctx.fillStyle = Theme.gold
    ctx.font = 'bold ' + Screen.scale(72) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(countText, cx + 2, cy + 2)

    ctx.fillStyle = Theme.ink
    ctx.fillText(countText, cx, cy)

    // Level name
    ctx.fillStyle = Theme.inkLight
    ctx.font = Screen.scale(15) + 'px sans-serif'
    ctx.fillText((this.levelConfig && this.levelConfig.name) || '', cx, Screen.gameHeight * 0.33)
  }

  _renderUpgradeChoice(ctx) {
    var cx = Screen.gameWidth / 2

    ctx.fillStyle = 'rgba(75, 53, 40, 0.45)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    // Title
    ctx.fillStyle = Theme.gold
    ctx.font = 'bold ' + Screen.scale(22) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('选择升级', cx + 1, Screen.gameHeight * 0.22 + 1)
    ctx.fillStyle = Theme.ink
    ctx.fillText('选择升级', cx, Screen.gameHeight * 0.22)

    const choices = this._showUpgradeChoices || []
    const cardW = Screen.scale(100)
    const cardH = Screen.scale(120)
    const totalW = choices.length * cardW + (choices.length - 1) * 15
    const startX = (Screen.gameWidth - totalW) / 2 + cardW / 2
    const cardY = Screen.gameHeight * 0.46

    for (let i = 0; i < choices.length; i++) {
      const cix = startX + i * (cardW + 15)

      // Card (paper style)
      Theme.drawPaperCard(ctx, cix - cardW / 2, cardY - cardH / 2, cardW, cardH, {
        fill: Theme.paperWhite,
        border: Theme.ink,
        radius: 12,
        shadowOffset: 4
      })

      // Icon
      ctx.fillStyle = Theme.ink
      ctx.font = Screen.scale(28) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(choices[i].icon || '⚡', cix, cardY - 15)

      // Name
      ctx.fillStyle = Theme.ink
      ctx.font = 'bold ' + Screen.scale(11) + 'px sans-serif'
      ctx.fillText(choices[i].name, cix, cardY + 20)

      // Description
      ctx.fillStyle = Theme.inkLight
      ctx.font = Screen.scale(9) + 'px sans-serif'
      ctx.fillText(choices[i].desc || '', cix, cardY + 40)

      if (!this._choiceCards) this._choiceCards = []
      if (this._choiceCards.length <= i) {
        const halfW = cardW / 2
        const halfH = cardH / 2
        this._choiceCards.push({
          x: cix - halfW, y: cardY - halfH, w: cardW, h: cardH,
          upgrade: choices[i],
          containsPoint(px, py) {
            return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h
          }
        })
      }
    }
  }

  _renderVictoryOverlay(ctx) {
    var cx = Screen.gameWidth / 2
    var cy = Screen.gameHeight / 2

    ctx.fillStyle = 'rgba(75, 53, 40, 0.35)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    ctx.fillStyle = Theme.gold
    ctx.font = 'bold ' + Screen.scale(38) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('通关!', cx + 1, cy + 1)
    ctx.fillStyle = Theme.ink
    ctx.fillText('通关!', cx, cy)
  }

  _renderDefeatOverlay(ctx) {
    var cx = Screen.gameWidth / 2
    var cy = Screen.gameHeight / 2

    ctx.fillStyle = 'rgba(75, 53, 40, 0.35)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    ctx.fillStyle = Theme.red
    ctx.font = 'bold ' + Screen.scale(38) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('防线被突破!', cx + 1, cy + 1)
    ctx.fillStyle = Theme.ink
    ctx.fillText('防线被突破!', cx, cy)
  }
}

window.BattleScene = new BattleScene()
