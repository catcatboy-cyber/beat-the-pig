const PIG_STATE = {
  WALKING: 'walking',
  HIT: 'hit',
  KNOCKBACK: 'knockback',
  DEAD: 'dead',
  SPLIT: 'split'
}

const EMOTION = {
  ARROGANT: 'arrogant',
  BEGGING: 'begging',
  BROKEN: 'broken',
  KO: 'ko'
}

class Pig {
  constructor() {
    this.x = 0
    this.y = 0
    this.width = 40
    this.height = 40
    this.hp = 100
    this.maxHp = 100
    this.speed = 80
    this.state = PIG_STATE.WALKING
    this.emotion = EMOTION.ARROGANT
    this.type = 'normal'
    this.typeConfig = null
    this.color = '#FFB6C1'
    this.score = 10
    this.gold = 10
    this.nickname = ''
    this.holeIndex = 0

    // 击退
    this.knockbackVx = 0
    this.knockbackVy = 0
    this.knockbackTimer = 0

    // 无敌帧（避免一帧多判）
    this.invincibleTimer = 0

    // 特殊能力状态
    this.abilityTimer = 0
    this.abilityCooldown = 0
    this._crying = false
    this._cryTimer = 0
    this._speedActive = false
    this._speedTimer = 0
    this._mudThrowReady = false
    this._cloneReady = false
    this._charged = false
    this._shouldSplit = false
    this._shouldExplode = false
    this._bounceTargets = []
    this._isClone = false
    this._shockTimer = 0
    this._burnTimer = 0
    this._burnDps = 0

    // Boss 专属状态
    this._weaknessCount = 0
    this._stunned = false
    this._stunTimer = 0
    this._charging = false
    this._chargeTimer = 0
    this._slamReady = false
    this._bossPhase = 'idle'

    // 受伤视觉
    this.injuryLevel = 0
    this.shakeTimer = 0

    // 台词
    this.lastDialogTime = 0
    this.currentDialog = ''

    // 碰撞盒
    this.aabb = { x: 0, y: 0, w: 0, h: 0 }

    this._active = false
    this._alive = false
    this._age = 0
    this._cachedAvatarImg = null
    this._cachedAvatarPath = ''
  }

  init(typeId, x, y, holeIndex, nickname) {
    const cfg = PigTypes[typeId] || PigTypes['normal']
    this.typeConfig = cfg
    this.type = cfg.id
    this.x = x
    this.y = y
    this.hp = cfg.hp
    this.maxHp = cfg.hp
    this.speed = cfg.speed
    this.width = cfg.size
    this.height = cfg.size
    this.color = cfg.color
    this.score = cfg.score
    this.gold = cfg.gold
    this.nickname = nickname || Storage.getNickname() || '小猪'
    this.holeIndex = holeIndex
    this.state = PIG_STATE.WALKING
    this.emotion = EMOTION.ARROGANT
    this.injuryLevel = 0
    this.invincibleTimer = 0
    this.knockbackTimer = 0
    this.shakeTimer = 0
    this.abilityTimer = 0
    this.abilityCooldown = 0
    this._crying = false
    this._cryTimer = 0
    this._speedActive = false
    this._speedTimer = 0
    this._mudThrowReady = false
    this._cloneReady = false
    this._charged = false
    this._shouldSplit = false
    this._shouldExplode = false
    this._bounceTargets = []
    this._isClone = false
    this._shockTimer = 0
    this._burnTimer = 0
    this._burnDps = 0
    this._weaknessCount = cfg.isBoss ? 3 : 0
    this._stunned = false
    this._stunTimer = 0
    this._charging = false
    this._chargeTimer = cfg.isBoss ? 8000 : 0
    this._slamReady = false
    this._bossPhase = 'idle'
    this.lastDialogTime = 0
    this.currentDialog = ''
    this._escaped = false
    this._alive = true
    this._age = 0
    this._updateAABB()
  }

  takeDamage(damage, knockDir, knockForce) {
    if (!this._alive || this.invincibleTimer > 0 || this.state === PIG_STATE.DEAD) return false
    if (this.typeConfig.isBoss) {
      if (this._stunned) {
        damage *= 3
      } else {
        this._weaknessCount--
        if (this._weaknessCount <= 0) {
          this._stunned = true
          this._stunTimer = 4000
          this._bossPhase = 'stunned'
          this._weaknessCount = 3
          this.speed = 0
          this.currentDialog = '我被破防了!!'
          this.lastDialogTime = Date.now()
        }
        damage *= 0.3
      }
    }

    this.hp -= damage
    this.invincibleTimer = 6
    this.shakeTimer = 8
    this.state = PIG_STATE.KNOCKBACK
    this.knockbackVx = knockDir.x * (knockForce || 5)
    this.knockbackVy = knockDir.y * (knockForce || 5) - 3
    this.knockbackTimer = 8

    // 哭包猪：被打后原地大哭
    if (this.typeConfig.abilities && this.typeConfig.abilities.indexOf('cry_block') >= 0) {
      this._crying = true
      this._cryTimer = 2000
    }

    this._updateEmotion()
    this._updateInjury()
    this._maybeDialog()

    return true
  }

  update(dt) {
    if (!this._alive) return
    this._age += dt
    const dtSec = dt / 1000

    if (this.invincibleTimer > 0) this.invincibleTimer--
    if (this.shakeTimer > 0) this.shakeTimer--
    if (this.abilityCooldown > 0) this.abilityCooldown -= dt

    switch (this.state) {
      case PIG_STATE.WALKING:
        if (!this._stunned && this._shockTimer <= 0) {
          this.y += this.speed * dtSec
        }
        if (this._shockTimer > 0) {
          this._shockTimer -= dt
          this.speed = 0
          if (this._shockTimer <= 0) {
            this.speed = this.typeConfig.speed
          }
        }
        if (this._burnTimer > 0) {
          this._burnTimer -= dt
          this.hp -= this._burnDps * dtSec
          if (this.hp <= 0 && this.state !== PIG_STATE.DEAD) {
            this.state = PIG_STATE.DEAD
          }
        }
        this._handleAbility(dt)
        break
      case PIG_STATE.KNOCKBACK:
        if (this.typeConfig.isBoss && this._charging) {
          this.state = PIG_STATE.WALKING
          break
        }
        this.x += this.knockbackVx * dtSec * 60
        this.y += this.knockbackVy * dtSec * 60
        this.knockbackTimer--
        if (this.knockbackTimer <= 0) {
          if (this.hp <= 0) {
            this.state = PIG_STATE.DEAD
            if (this.typeConfig.abilities) {
              if (this.typeConfig.abilities.indexOf('split_on_death') >= 0) this._shouldSplit = true
              if (this.typeConfig.abilities.indexOf('explode_on_death') >= 0) this._shouldExplode = true
            }
          } else {
            this.state = PIG_STATE.WALKING
          }
        }
        break
      case PIG_STATE.DEAD:
        // 死亡动画：缩小旋转飞出
        this.y -= 5 * dtSec * 60
        this.x += 2 * dtSec * 60
        if (this.y < -100) {
          this._alive = false
        }
        break
    }

    // x 轴边界限制（防止击退飞出屏幕）
    var halfW = this.width / 2
    var padding = 4
    if (this.x < halfW + padding) {
      this.x = halfW + padding
      if (this.state === PIG_STATE.KNOCKBACK) this.knockbackVx = Math.abs(this.knockbackVx) * 0.4
    }
    if (this.x > Screen.gameWidth - halfW - padding) {
      this.x = Screen.gameWidth - halfW - padding
      if (this.state === PIG_STATE.KNOCKBACK) this.knockbackVx = -Math.abs(this.knockbackVx) * 0.4
    }

    // 出界检测
    if (this.y > Screen.gameHeight + 50 && this.state === PIG_STATE.WALKING) {
      this._alive = false
      this._escaped = true
    }

    this._updateAABB()
  }

  _handleAbility(dt) {
    if (this.typeConfig && this.typeConfig.isBoss) {
      this._handleBossAbilities(dt)
    }
    if (!this.typeConfig || !this.typeConfig.abilities) return
    var abs = this.typeConfig.abilities
    var dtSec = dt / 1000

    // ── speed_boost: periodic dash ──
    if (abs.indexOf('speed_boost') >= 0) {
      this._speedTimer += dt
      if (!this._speedActive && this._speedTimer > 2000) {
        this._speedActive = true
        this.speed = this.typeConfig.speed * 1.8
        this._speedTimer = 0
      }
      if (this._speedActive && this._speedTimer > 400) {
        this._speedActive = false
        this.speed = this.typeConfig.speed
      }
    }

    // ── periodic_invisible ──
    if (abs.indexOf('periodic_invisible') >= 0) {
      this._invisible = (this._age % 3000) > 1500
    }

    // ── throw_mud: fires every 4s ──
    if (abs.indexOf('throw_mud') >= 0) {
      if (this.abilityCooldown <= 0) {
        this._mudThrowReady = true
        this.abilityCooldown = 4000
      }
    }

    // ── spawn_clones: every 5s ──
    if (abs.indexOf('spawn_clones') >= 0) {
      if (this.abilityCooldown <= 0 && !this._cloneReady) {
        this._cloneReady = true
        this.abilityCooldown = 5000
      }
    }

    // ── cry_block: freezes when hit, blocks pigs behind ──
    if (abs.indexOf('cry_block') >= 0 && this._crying) {
      this._cryTimer -= dt
      this.speed = 0
      if (this._cryTimer <= 0) {
        this._crying = false
        this.speed = this.typeConfig.speed
      }
    }
  }

  _handleBossAbilities(dt) {
    // 眩晕计时
    if (this._stunned) {
      this._stunTimer -= dt
      if (this._stunTimer <= 0) {
        this._stunned = false
        this._bossPhase = 'idle'
        this._weaknessCount = 3
        this.speed = this.typeConfig.speed
        this._chargeTimer = Math.max(this._chargeTimer, 2000)
      }
      return
    }

    // 冲锋计时
    this._chargeTimer -= dt
    if (this._chargeTimer <= 0 && !this._charging) {
      this._charging = true
      this._bossPhase = 'charging'
      this._chargeTimer = 1500
      this.speed = this.typeConfig.speed * 4.5
      this.currentDialog = '冲啊!!'
      this.lastDialogTime = Date.now()
    }
    if (this._charging) {
      if (this._chargeTimer <= 0) {
        this._charging = false
        this._bossPhase = 'idle'
        this.speed = this.typeConfig.speed
        this._chargeTimer = 8000 + Math.random() * 4000
        this._slamReady = true
      }
    }
  }

  _updateEmotion() {
    const ratio = this.hp / this.maxHp
    if (ratio <= 0) {
      this.emotion = EMOTION.KO
    } else if (ratio < 0.1) {
      this.emotion = EMOTION.BROKEN
    } else if (ratio < 0.4) {
      this.emotion = EMOTION.BEGGING
    } else if (ratio < 0.7) {
      this.emotion = EMOTION.BEGGING
    } else {
      this.emotion = EMOTION.ARROGANT
    }
  }

  _updateInjury() {
    const ratio = this.hp / this.maxHp
    if (ratio > 0.8) this.injuryLevel = 0
    else if (ratio > 0.6) this.injuryLevel = 1
    else if (ratio > 0.4) this.injuryLevel = 2
    else if (ratio > 0.2) this.injuryLevel = 3
    else if (ratio > 0.05) this.injuryLevel = 4
    else this.injuryLevel = 5
  }

  _maybeDialog() {
    const now = Date.now()
    if (now - this.lastDialogTime < 1500) return
    this.lastDialogTime = now

    const pool = DialogConfig[this.emotion] || DialogConfig.arrogant
    this.currentDialog = pool[Math.floor(Math.random() * pool.length)]
  }

  _updateAABB() {
    this.aabb.x = this.x - this.width / 2
    this.aabb.y = this.y - this.height / 2
    this.aabb.w = this.width
    this.aabb.h = this.height
  }

  get alive() { return this._alive }
  get escaped() { return this._escaped || false }
  get dead() { return this.hp <= 0 && this.state === PIG_STATE.DEAD }

  render(ctx) {
    if (!this._alive) return
    ctx.save()

    let drawX = this.x
    let drawY = this.y

    // 抖动效果
    if (this.shakeTimer > 0) {
      const intensity = 3 * (this.shakeTimer / 8)
      drawX += (Math.random() - 0.5) * intensity * 2
      drawY += (Math.random() - 0.5) * intensity * 2
    }

    // 死亡动画
    if (this.state === PIG_STATE.DEAD) {
      const deathProgress = 1 - Math.max(0, (this.y + 100) / (Screen.gameHeight + 150))
      ctx.globalAlpha = 1 - deathProgress
      ctx.translate(drawX, drawY)
      ctx.rotate(deathProgress * Math.PI * 3)
      ctx.scale(1 - deathProgress * 0.5, 1 - deathProgress * 0.5)
      drawX = 0
      drawY = 0
    }

    // 隐形效果
    if (this._invisible) {
      ctx.globalAlpha = 0.3
    }

    this._drawPigBody(ctx, drawX, drawY)

    // 昵称 + 血条
    if (this.state !== PIG_STATE.DEAD) {
      this._drawNameAndHP(ctx, drawX, drawY)
    }

    // Boss 专属指示器
    if (this.typeConfig && this.typeConfig.isBoss) {
      this._drawBossIndicators(ctx, drawX, drawY)
    }

    // 台词气泡
    if (this.currentDialog && Date.now() - this.lastDialogTime < 1200) {
      this._drawBubble(ctx, drawX, drawY)
    }

    ctx.restore()
  }

  _drawPigBody(ctx, cx, cy) {
    const r = this.width / 2

    // 身体：用头像（照片/emoji）替代圆形猪体
    if (Storage.getAvatarType() === 'photo') {
      var photoImg = this._getCachedAvatar()
      if (photoImg) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(photoImg, cx - r, cy - r, r * 2, r * 2)
        ctx.restore()
      } else {
        this._drawDefaultBody(ctx, cx, cy, r)
      }
    } else {
      var avatarEmoji = Storage.getAvatar() || '🐷'
      ctx.font = `${r * 1.6}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(avatarEmoji, cx, cy)
    }

    // 眼睛 + 情绪表情（emoji头像上叠加）
    if (Storage.getAvatarType() !== 'photo') {
      this._drawEyes(ctx, cx, cy, r)
    }

    // 受伤视觉叠加
    this._drawInjuries(ctx, cx, cy, r)
  }

  _drawDefaultBody(ctx, cx, cy, r) {
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 2
    ctx.stroke()

    // 耳朵
    ctx.fillStyle = this._darkerColor(this.color)
    ctx.beginPath()
    ctx.arc(cx - r * 0.5, cy - r * 0.85, r * 0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + r * 0.5, cy - r * 0.85, r * 0.25, 0, Math.PI * 2)
    ctx.fill()

    // 鼻子
    ctx.fillStyle = '#FF8888'
    ctx.beginPath()
    ctx.ellipse(cx, cy + r * 0.1, r * 0.3, r * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#CC6666'
    ctx.beginPath()
    ctx.arc(cx - r * 0.1, cy + r * 0.1, r * 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + r * 0.1, cy + r * 0.1, r * 0.06, 0, Math.PI * 2)
    ctx.fill()
  }

  _drawEyes(ctx, cx, cy, r) {
    const eyeY = cy - r * 0.2
    const eyeSpacing = r * 0.35

    if (this.emotion === EMOTION.ARROGANT) {
      // 嚣张眼：半眯眼
      ctx.fillStyle = '#000'
      ctx.fillRect(cx - eyeSpacing - r * 0.2, eyeY - r * 0.05, r * 0.4, r * 0.15)
      ctx.fillRect(cx + eyeSpacing - r * 0.2, eyeY - r * 0.05, r * 0.4, r * 0.15)
    } else if (this.emotion === EMOTION.BEGGING) {
      // 求饶眼：大圆眼含泪
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing, eyeY, r * 0.18, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + eyeSpacing, eyeY, r * 0.18, 0, Math.PI * 2)
      ctx.fill()
      // 眼泪
      ctx.fillStyle = '#66CCFF'
      ctx.beginPath()
      ctx.arc(cx - eyeSpacing + r * 0.15, eyeY + r * 0.25, r * 0.08, 0, Math.PI * 2)
      ctx.fill()
    } else if (this.emotion === EMOTION.BROKEN) {
      // 崩溃眼：叉叉眼
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      const s = r * 0.12
      ctx.beginPath()
      ctx.moveTo(cx - eyeSpacing - s, eyeY - s)
      ctx.lineTo(cx - eyeSpacing + s, eyeY + s)
      ctx.moveTo(cx - eyeSpacing + s, eyeY - s)
      ctx.lineTo(cx - eyeSpacing - s, eyeY + s)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + eyeSpacing - s, eyeY - s)
      ctx.lineTo(cx + eyeSpacing + s, eyeY + s)
      ctx.moveTo(cx + eyeSpacing + s, eyeY - s)
      ctx.lineTo(cx + eyeSpacing - s, eyeY + s)
      ctx.stroke()
    } else if (this.emotion === EMOTION.KO) {
      // KO眼：螺旋
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1.5
      this._drawSpiral(ctx, cx - eyeSpacing, eyeY, r * 0.12)
      this._drawSpiral(ctx, cx + eyeSpacing, eyeY, r * 0.12)
    }
  }

  _drawSpiral(ctx, x, y, r) {
    ctx.beginPath()
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      const rr = r * (0.3 + i * 0.2)
      ctx.arc(x, y, rr, a, a + Math.PI, false)
    }
    ctx.stroke()
  }

  _drawInjuries(ctx, cx, cy, r) {
    if (this.injuryLevel >= 1) {
      // 包
      ctx.fillStyle = '#FF6666'
      ctx.beginPath()
      ctx.arc(cx - r * 0.3, cy - r * 1.1, r * 0.18, 0, Math.PI * 2)
      ctx.fill()
    }
    if (this.injuryLevel >= 2) {
      // 熊猫眼
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.beginPath()
      ctx.arc(cx - r * 0.35, cy - r * 0.2, r * 0.22, 0, Math.PI * 2)
      ctx.fill()
    }
    if (this.injuryLevel >= 3) {
      // 创可贴
      ctx.fillStyle = '#FFE4B5'
      ctx.fillRect(cx - r * 0.2, cy - r * 0.6, r * 0.4, r * 0.12)
      ctx.fillStyle = '#FFF'
      ctx.fillRect(cx - r * 0.15, cy - r * 0.62, r * 0.1, r * 0.16)
    }
    if (this.injuryLevel >= 4) {
      // 绷带缠头
      ctx.strokeStyle = '#FFE4B5'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy - r * 0.3, r, -Math.PI * 0.2, Math.PI * 1.2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy + r * 0.1, r * 0.8, -Math.PI * 0.1, Math.PI * 1.1)
      ctx.stroke()
    }
    if (this.injuryLevel >= 5) {
      // 眼冒金星
      this._drawStars(ctx, cx + r * 0.6, cy - r * 0.8)
      this._drawStars(ctx, cx - r * 0.7, cy - r * 0.6)
    }
  }

  _drawStars(ctx, x, y) {
    ctx.fillStyle = '#FFD700'
    for (let i = 0; i < 3; i++) {
      const sx = x + (Math.sin(Date.now() / 200 + i) * 8)
      const sy = y + (Math.cos(Date.now() / 200 + i) * 8)
      ctx.beginPath()
      this._drawStarPath(ctx, sx, sy, 4, 2, 5)
      ctx.fill()
    }
  }

  _drawStarPath(ctx, cx, cy, outerR, innerR, points) {
    const step = Math.PI / points
    ctx.moveTo(cx, cy - outerR)
    for (let i = 1; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const angle = -Math.PI / 2 + i * step
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
    }
    ctx.closePath()
  }

  _drawNameAndHP(ctx, cx, cy) {
    const r = this.width / 2
    // 昵称（居中）
    const nameX = cx
    const nameY = cy - r - 18

    ctx.fillStyle = '#333'
    ctx.font = `${Screen.scale(11)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(this.nickname, nameX, nameY + 4)

    // 血条背景
    const barW = r * 2
    const barH = 4
    const barY = cy - r - 8
    ctx.fillStyle = '#ddd'
    ctx.fillRect(cx - barW / 2, barY, barW, barH)

    // 血条前景
    const ratio = Math.max(0, this.hp / this.maxHp)
    const barColor = ratio > 0.5 ? '#4CAF50' : ratio > 0.2 ? '#FF9800' : '#F44336'
    ctx.fillStyle = barColor
    ctx.fillRect(cx - barW / 2, barY, barW * ratio, barH)
  }

  _drawBossIndicators(ctx, cx, cy) {
    var r = this.width / 2

    // 弱点护盾指示器（3个圆点）
    for (var i = 0; i < 3; i++) {
      var angle = -Math.PI / 2 + (i / 3) * Math.PI * 2
      var ix = cx + Math.cos(angle) * (r + 16)
      var iy = cy + Math.sin(angle) * (r + 4)
      var active = i >= this._weaknessCount || this._stunned

      ctx.fillStyle = active ? '#888' : Theme.gold
      ctx.strokeStyle = Theme.ink
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(ix, iy, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      if (active) {
        ctx.strokeStyle = Theme.ink
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(ix - 3, iy - 3)
        ctx.lineTo(ix + 3, iy + 3)
        ctx.moveTo(ix + 3, iy - 3)
        ctx.lineTo(ix - 3, iy + 3)
        ctx.stroke()
      }
    }

    // 冲锋状态：红色光环
    if (this._charging) {
      ctx.strokeStyle = '#FF0000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,0,0,0.3)'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(cx, cy, r + 16, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 眩晕状态：旋转星星
    if (this._stunned) {
      var t = Date.now() / 200
      for (var s = 0; s < 4; s++) {
        var sa = t + (s / 4) * Math.PI * 2
        var sx = cx + Math.cos(sa) * (r + 14)
        var sy = cy + Math.sin(sa) * (r + 14)
        ctx.fillStyle = '#FFD700'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⭐', sx, sy)
      }
    }
  }

  _drawBubble(ctx, cx, cy) {
    const text = this.currentDialog
    ctx.font = `${Screen.scale(10)}px sans-serif`
    const textW = ctx.measureText(text).width + 16
    const textH = 22
    const bx = cx - textW / 2
    const by = cy - this.width / 2 - 50

    // 气泡背景
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(bx, by, textW, textH, [8])
    ctx.fill()
    ctx.stroke()

    // 气泡尖
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.moveTo(cx - 6, by + textH)
    ctx.lineTo(cx, by + textH + 8)
    ctx.lineTo(cx + 6, by + textH)
    ctx.fill()

    // 文字
    ctx.fillStyle = '#333'
    ctx.textAlign = 'center'
    ctx.fillText(text, cx, by + textH / 2 + 4)
  }

  _getCachedAvatar() {
    var path = Storage.getAvatar()
    if (!path) return null
    if (!this._cachedAvatarImg || this._cachedAvatarPath !== path) {
      this._cachedAvatarImg = wx.createImage()
      this._cachedAvatarImg.src = path
      this._cachedAvatarPath = path
    }
    return this._cachedAvatarImg
  }

  _darkerColor(hex) {
    if (hex.startsWith('rgba')) return hex
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgb(${Math.floor(r * 0.8)},${Math.floor(g * 0.8)},${Math.floor(b * 0.8)})`
  }

  reset() {
    this._alive = false
    this._escaped = false
    this._invisible = false
    this._shouldSplit = false
    this._shouldExplode = false
    this._bounceTargets = []
    this._isClone = false
    this._shockTimer = 0
    this._burnTimer = 0
    this._burnDps = 0
    this._weaknessCount = 0
    this._stunned = false
    this._stunTimer = 0
    this._charging = false
    this._chargeTimer = 0
    this._slamReady = false
    this._bossPhase = 'idle'
    this.x = 0
    this.y = 0
    this.currentDialog = ''
    this._cachedAvatarImg = null
    this._cachedAvatarPath = ''
  }
}

window.Pig = Pig
window.PIG_STATE = PIG_STATE
window.EMOTION = EMOTION
