class BattleScene {
  constructor() {
    this.levelConfig = null
    this.state = 'ready'
    this.defenseLine = new DefenseLine()
    this.escapedCount = 0
    this.totalGold = 0
    this.totalKills = 0
    this._stateTimer = 0
    this._readyCountdown = 3
    this._magnetPigs = []
    this._mudDebuffTimer = 0
    this._paused = false
    this._nextUpgradeKills = 20
    this._screenPulse = 0
    this._slowmoTimer = 0
    this._freezeTimer = 0
    this._bigText = ''
    this._bigTextTimer = 0
    this._shakeIntensity = 0
    this._shakeDuration = 0
    this._shakeX = 0
    this._shakeY = 0
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
    this._mudDebuffTimer = 0
    this._paused = false
    this._nextUpgradeKills = 20
    this._pauseButtons = []

    WeaponSwitcher.init()
    PigSpawner.initLevel(this.levelConfig)
    this.defenseLine.init(this.levelConfig.defenseHP)
    ComboSystem.reset()
    UpgradeSystem.reset()
    UpgradePanel.hide()
    HUD.init(this.levelConfig)

    // 预加载广告
    AdManager.preloadRewarded()
  }

  onExit() {
    PigSpawner.pool.releaseAll()
    UpgradePanel.hide()
  }

  update(dt) {
    // Upgrade panel blocks all gameplay
    if (UpgradePanel.visible) {
      if (!UpgradePanel.hasChoices()) {
        console.warn('[BattleScene] UpgradePanel visible without choices; auto-hiding to avoid input lock')
        UpgradePanel.hide()
      } else if (this.state !== 'playing') {
        UpgradePanel.hide()
      }
    }

    if (UpgradePanel.visible) {
      if (InputManager.justPressed()) {
        var t = InputManager.getPrimaryTouch()
        if (t) UpgradePanel.handleTap(t.x, t.y)
      }
      return
    }

    switch (this.state) {
      case 'ready':
        this._updateReady(dt)
        break
      case 'playing':
        if (this._checkPauseTrigger()) return
        this._updatePlaying(dt)
        break
      case 'paused':
        this._updatePaused(dt)
        return
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
    AchievementTracker.update(dt)
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

  _checkPauseTrigger() {
    if (!InputManager.justPressed()) return false
    var touch = InputManager.getPrimaryTouch()
    if (!touch) return false
    if (HUD.hitTestPause(touch.x, touch.y)) {
      this.state = 'paused'
      return true
    }
    return false
  }

  _updatePaused(dt) {
    if (InputManager.justPressed()) {
      var touch = InputManager.getPrimaryTouch()
      if (!touch) return
      // Check overlay buttons
      var btns = this._pauseButtons || []
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].containsPoint(touch.x, touch.y)) {
          btns[i].onTap()
          return
        }
      }
      // Tap outside = resume
      this.state = 'playing'
    }
    // Also resume by tapping pause button again
  }

  _updatePlaying(dt) {
    // 慢动作
    if (this._slowmoTimer > 0) {
      this._slowmoTimer -= dt
      dt *= 0.25
    }
    // 屏幕脉冲
    if (this._screenPulse > 0) this._screenPulse -= dt
    // 大字计时
    if (this._bigTextTimer > 0) this._bigTextTimer -= dt
    // 全猪冻结
    if (this._freezeTimer > 0) {
      this._freezeTimer -= dt
      var pigs = PigSpawner.getActivePigs()
      for (var fi = 0; fi < pigs.length; fi++) {
        if (pigs[fi]._active && pigs[fi].alive) {
          pigs[fi].speed = 0
        }
      }
    }
    // 屏幕震动
    if (this._shakeDuration > 0) {
      this._shakeDuration -= dt
      this._shakeX = (Math.random() - 0.5) * this._shakeIntensity * 2
      this._shakeY = (Math.random() - 0.5) * this._shakeIntensity * 2
    } else {
      this._shakeX = 0
      this._shakeY = 0
    }

    // 输入更新（含武器切换检测）
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
      // 屏幕震动
      if (hit.isExplosive) {
        this.triggerShake(8, 250)
      } else if (hit.isSmash) {
        this.triggerShake(5, 180)
      } else {
        this.triggerShake(2, 80)
      }

      // 粒子
      ParticleSystem.emitHit(hit.x, hit.y, weaponId)

      // 伤害数字
      const weaponCfg = WeaponConfig[weaponId]
      const atkMult = UpgradeSystem.getAttackMultiplier()
      const mudMult = this._mudDebuffTimer > 0 ? 0.5 : 1.0
      const damage = weaponCfg.upgrades[WeaponSwitcher.getCurrentWeapon().level - 1].damage * atkMult * mudMult
      DamageNumber.spawn(damage, hit.x, hit.y - 20, hit.isSmash)

      // 连击
      ComboSystem.onHit()
      var milestone = ComboSystem.getMilestone()
      if (milestone === 10) {
        this._bigText = '10 COMBO!'
        this._bigTextTimer = 1200
      } else if (milestone === 30) {
        this._screenPulse = 800
        this._bigText = '30 COMBO!'
        this._bigTextTimer = 1500
      } else if (milestone === 50) {
        this._slowmoTimer = 500
        this._screenPulse = 1000
        this._bigText = 'UNSTOPPABLE!'
        this._bigTextTimer = 2000
      } else if (milestone === 100) {
        this._freezeTimer = 1000
        this._screenPulse = 1500
        this._bigText = 'GODLIKE!'
        this._bigTextTimer = 2500
      }

      // 金币
      const baseGold = pig.typeConfig.gold
      const comboBonus = ComboSystem.getGoldBonus(baseGold)
      var totalPigGold = baseGold + comboBonus
      // 小偷猪：打死双倍金币
      if (pig.hp <= 0 && pig.typeConfig.abilities && pig.typeConfig.abilities.indexOf('steal_gold') >= 0) {
        totalPigGold *= 2
      }
      this.totalGold += totalPigGold
      Storage.addGold(totalPigGold)
      ParticleSystem.emitGold(pig.x, pig.y, 3)

      // 击杀
      if (pig.hp <= 0) {
        this.totalKills++
        // Boss 击杀记录
        if (pig.typeConfig.isBoss) {
          Storage.set('user.bossKills', (Storage.get('user.bossKills') || 0) + 1)
        }
        // 每 N 杀触发升级选择
        if (this.totalKills >= this._nextUpgradeKills) {
          this._nextUpgradeKills += 20
          UpgradePanel.show()
        }
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

      // 反弹猪：被打后弹飞撞击周围猪
      if (pig.typeConfig.abilities && pig.typeConfig.abilities.indexOf('bounce_on_hit') >= 0) {
        for (const other of activePigs) {
          if (other === pig || !other.alive || other.state === PIG_STATE.DEAD) continue
          var bdx = other.x - pig.x
          var bdy = other.y - pig.y
          var bdist = Math.sqrt(bdx * bdx + bdy * bdy)
          if (bdist < 100) {
            var bdir = { x: bdx / bdist, y: bdy / bdist }
            other.takeDamage(damage * 0.5, bdir, 3)
            ParticleSystem.emitHit(other.x, other.y, 'broom')
          }
        }
      }

      // 电击棒：放电时麻痹小猪
      if (weaponId === 'taser' && weapon._discharging) {
        pig._shockTimer = weapon.config.stunDuration * 1000
        pig.speed = 0
      }

      // Boss 弱点打破：重震
      if (pig.typeConfig && pig.typeConfig.isBoss && pig._stunned) {
        this.triggerShake(14, 400)
      }

      // 火箭炮：爆炸时附加燃烧
      if (weaponId === 'rocket' && hit.isExplosive) {
        pig._burnTimer = weapon.config.burnDuration * 1000
        pig._burnDps = weapon.config.burnDamage
      }

      // 臭弹：溅射时附加中毒
      if (weaponId === 'poop' && hit.isPoison) {
        pig._poisonTimer = weapon.config.poisonDuration * 1000
        pig._poisonDps = weapon.config.poisonDamage
      }

      // 拖鞋：击中后弹射到最近的猪
      if (weaponId === 'slipper' && weapon._thrown && !weapon._returning) {
        var nearest = null
        var nearestDist = Infinity
        for (const other of activePigs) {
          if (other === pig || !other.alive || other.state === PIG_STATE.DEAD) continue
          var sdx = other.x - pig.x
          var sdy = other.y - pig.y
          var sdist = Math.sqrt(sdx * sdx + sdy * sdy)
          if (sdist < nearestDist) { nearestDist = sdist; nearest = other }
        }
        if (nearest && nearestDist < 350) {
          var ndx = nearest.x - pig.x
          var ndy = nearest.y - pig.y
          var ndist = Math.sqrt(ndx * ndx + ndy * ndy) || 1
          weapon._slipperVx = (ndx / ndist) * 700
          weapon._slipperVy = (ndy / ndist) * 700
          weapon._bouncesLeft--
          if (weapon._bouncesLeft <= 0) weapon._returning = true
        }
      }
    }

    // 苍蝇拍溅射（每 3 秒触发一次范围伤害）
    if (weapon && weapon.id === 'swatter' && weapon._splashReady) {
      weapon._splashReady = false
      ParticleSystem.emitExplosion(weapon.x, weapon.y)
      for (const pig of activePigs) {
        if (!pig.alive || pig.state === PIG_STATE.DEAD) continue
        var sdx = pig.x - weapon.x
        var sdy = pig.y - weapon.y
        if (Math.sqrt(sdx * sdx + sdy * sdy) < weapon.range * 1.2) {
          pig.takeDamage(weapon.damage * 0.6, { x: sdx, y: -0.5 }, 4)
        }
      }
    }

    // 生成器更新
    PigSpawner.update(dt)

    // 猪之间的物理碰撞（击退中）
    for (var pi = 0; pi < activePigs.length; pi++) {
      var pigA = activePigs[pi]
      if (!pigA._active || !pigA.alive || pigA.state !== PIG_STATE.KNOCKBACK) continue
      for (var pj = pi + 1; pj < activePigs.length; pj++) {
        var pigB = activePigs[pj]
        if (!pigB._active || !pigB.alive) continue
        var cdx = pigB.x - pigA.x
        var cdy = pigB.y - pigA.y
        var cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1
        var minDist = (pigA.width + pigB.width) / 2
        if (cdist < minDist) {
          var cnx = cdx / cdist
          var cny = cdy / cdist
          // 分离
          var overlap = minDist - cdist
          pigA.x -= cnx * overlap * 0.5
          pigA.y -= cny * overlap * 0.5
          pigB.x += cnx * overlap * 0.5
          pigB.y += cny * overlap * 0.5
          // 反弹速度
          if (pigB.state !== PIG_STATE.DEAD) {
            pigB.knockbackVx += cnx * 3
            pigB.knockbackVy += cny * 3
            pigB._knockbackRotSpeed = (Math.random() - 0.5) * 0.4
            if (pigB.state === PIG_STATE.WALKING) {
              pigB.state = PIG_STATE.KNOCKBACK
              pigB.knockbackTimer = 6
            }
          }
          ParticleSystem.emitHit((pigA.x + pigB.x) / 2, (pigA.y + pigB.y) / 2, 'broom')
        }
      }
    }

    // 泥巴攻击处理（嘲讽猪扔泥巴降低玩家攻击力）
    var mudThrows = PigSpawner.getPendingMudThrows()
    if (mudThrows.length > 0) {
      this._mudDebuffTimer = 3000
      for (var mi = 0; mi < mudThrows.length; mi++) {
        ParticleSystem.emitHit(mudThrows[mi].x, mudThrows[mi].y, 'broom')
      }
    }
    if (this._mudDebuffTimer > 0) this._mudDebuffTimer -= dt

    // Boss 技能处理
    for (const pig of activePigs) {
      if (!pig.typeConfig || !pig.typeConfig.isBoss) continue

      // Boss 冲锋到底部：扣防线血量
      if (pig._charging && pig.y > Screen.gameHeight - 40) {
        this.defenseLine.takeDamage(3)
        pig._charging = false
        pig._bossPhase = 'idle'
        pig.speed = pig.typeConfig.speed
        pig._chargeTimer = 8000 + Math.random() * 4000
        pig._slamReady = true
        GameLoop.triggerHitStop(5)
        DialogBubble.show('撞到防线了!', pig.x, pig.y - 50)
      }

      // Boss 捶地
      if (pig._slamReady) {
        pig._slamReady = false
        this.defenseLine.takeDamage(2)
        GameLoop.triggerHitStop(4)
        ParticleSystem.emitExplosion(pig.x, Math.min(pig.y + 60, Screen.gameHeight - 20))
        // 震飞周围小猪
        for (const other of activePigs) {
          if (other === pig || !other.alive || other.state === PIG_STATE.DEAD) continue
          var sdx = other.x - pig.x
          var sdy = other.y - pig.y
          var sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1
          if (sdist < 180) {
            other.takeDamage(20, { x: sdx / sdist, y: -0.5 }, 8)
          }
        }
        DialogBubble.show('地震啦!!', pig.x, pig.y - 50)
      }
    }

    // 逃出检测
    const escaped = PigSpawner.getEscapedPigs()
    for (const pig of escaped) {
      this.escapedCount++
      this.defenseLine.takeDamage(1)
      // 小偷猪逃跑：扣金币
      if (pig.typeConfig.abilities && pig.typeConfig.abilities.indexOf('steal_gold') >= 0) {
        var stolen = Math.min(Storage.getGold(), pig.typeConfig.gold * 2)
        Storage.addGold(-stolen)
        DialogBubble.show('偷了 ' + stolen + ' 💰 溜了!', pig.x, Screen.gameHeight - 50)
      } else {
        DialogBubble.show('溜了溜了~', pig.x, Screen.gameHeight - 50)
      }
    }

    // 防线破了
    if (!this.defenseLine.alive) {
      this.state = 'defeat'
      this._stateTimer = 0
      return
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

        // 成就检测
        AchievementTracker.check('totalKills', Storage.get('user.totalKills'))
        AchievementTracker.check('maxCombo', ComboSystem.getMaxCombo())
        AchievementTracker.check('maxLevel', levelNum)
        AchievementTracker.check('totalGold', Storage.getGold())
        if (this.totalKills > 0 && PigSpawner.bossSpawned) {
          AchievementTracker.check('bossKills', (Storage.get('user.bossKills') || 0) + 1)
        }
        if (this.defenseLine.ratio >= 1.0) {
          AchievementTracker.check('perfectDefense', 1)
        }

        // 更新排行榜
        RankManager.autoUpdate()

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
        Storage.set('user.totalKills', (Storage.get('user.totalKills') || 0) + this.totalKills)
        AchievementTracker.check('totalKills', Storage.get('user.totalKills'))
        AchievementTracker.check('maxCombo', ComboSystem.getMaxCombo())
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
    ctx.save()
    if (this._shakeX || this._shakeY) {
      ctx.translate(this._shakeX, this._shakeY)
    }

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

    // Upgrade panel (on top of everything)
    UpgradePanel.render(ctx)

    // Combo screen pulse
    if (this._screenPulse > 0) {
      var pulseAlpha = (this._screenPulse / 1500) * 0.3
      var gradient = ctx.createRadialGradient(Screen.gameWidth / 2, Screen.gameHeight / 2, Screen.gameWidth * 0.4, Screen.gameWidth / 2, Screen.gameHeight / 2, Screen.gameWidth * 0.8)
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0)')
      gradient.addColorStop(1, 'rgba(255, 0, 0, ' + pulseAlpha + ')')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)
    }

    // Big combo text
    if (this._bigTextTimer > 0) {
      var txtAlpha = Math.min(1, this._bigTextTimer / 500)
      var txtScale = 1 + (1 - this._bigTextTimer / 2500) * 0.3
      ctx.save()
      ctx.globalAlpha = txtAlpha
      ctx.fillStyle = Theme.gold
      ctx.font = 'bold ' + Screen.scale(36 * txtScale) + 'px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this._bigText, Screen.gameWidth / 2 + 2, Screen.gameHeight * 0.35 + 2)
      ctx.fillStyle = Theme.ink
      ctx.fillText(this._bigText, Screen.gameWidth / 2, Screen.gameHeight * 0.35)
      ctx.restore()
    }

    // Achievement toast
    AchievementTracker.renderToast(ctx)

    // State overlays
    if (this.state === 'ready') {
      this._renderReadyOverlay(ctx)
    } else if (this.state === 'paused') {
      this._renderPauseOverlay(ctx)
    } else if (this.state === 'victory') {
      this._renderVictoryOverlay(ctx)
    } else if (this.state === 'defeat') {
      this._renderDefeatOverlay(ctx)
    }

    ctx.restore()
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

  _renderPauseOverlay(ctx) {
    var cx = Screen.gameWidth / 2
    var cy = Screen.gameHeight / 2

    ctx.fillStyle = 'rgba(75, 53, 40, 0.5)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    // Panel
    var panelW = Screen.scale(220)
    var panelH = Screen.scale(200)
    var panelX = cx - panelW / 2
    var panelY = cy - panelH / 2 - 20

    Theme.drawPaperCard(ctx, panelX, panelY, panelW, panelH, {
      fill: Theme.paperWhite,
      border: Theme.ink,
      radius: 12,
      shadowOffset: 5
    })

    // Title
    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(22) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⏸ 暂停', cx, panelY + 36)

    // Buttons
    var btnW = Screen.scale(170)
    var btnH = Screen.scale(38)
    var btnX = cx - btnW / 2
    var btnStartY = panelY + 62
    var btnGap = Screen.scale(10)

    var self = this
    var btns = [
      { label: '▶ 继续游戏', color: Theme.teal, action: function () { self.state = 'playing' } },
      { label: '🔄 重新开始', color: Theme.gold, action: function () { self._restartLevel() } },
      { label: '🚪 返回菜单', color: '#9E9E9E', action: function () { SceneManager.switchTo('menu') } }
    ]

    this._pauseButtons = []
    for (var i = 0; i < btns.length; i++) {
      var by = btnStartY + i * (btnH + btnGap)
      var btn = new Button(cx, by, btnW, btnH, btns[i].label, btns[i].color, btns[i].action)
      btn.render(ctx)
      this._pauseButtons.push(btn)
    }
  }

  triggerShake(intensity, duration) {
    if (this._shakeDuration > 0 && this._shakeIntensity >= intensity) return
    this._shakeIntensity = intensity
    this._shakeDuration = duration || 150
  }

  _restartLevel() {
    this.state = 'playing'
    UpgradePanel.hide()
    PigSpawner.pool.releaseAll()
    const levelNum = this.levelConfig.level
    this.levelConfig = LevelConfig.getLevel(levelNum)
    this.escapedCount = 0
    this.totalGold = 0
    this.totalKills = 0
    this._mudDebuffTimer = 0
    this.defenseLine.init(this.levelConfig.defenseHP)
    PigSpawner.initLevel(this.levelConfig)
    ComboSystem.reset()
    UpgradeSystem.reset()
    this._nextUpgradeKills = 20
    this._pauseButtons = []
    HUD.init(this.levelConfig)
  }
}

window.BattleScene = new BattleScene()
