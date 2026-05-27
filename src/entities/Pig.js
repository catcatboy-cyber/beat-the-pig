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

    // 特殊能力计时器
    this.abilityTimer = 0
    this.abilityCooldown = 0

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
    this.lastDialogTime = 0
    this.currentDialog = ''
    this._escaped = false
    this._alive = true
    this._age = 0
    this._updateAABB()
  }

  takeDamage(damage, knockDir, knockForce) {
    if (!this._alive || this.invincibleTimer > 0) return false
    if (this.typeConfig.isBoss && this.state !== 'stunned') {
      // Boss 需要先破弱点（简化版：击中即受伤但有减伤）
      damage *= 0.5
    }

    this.hp -= damage
    this.invincibleTimer = 6
    this.shakeTimer = 8
    this.state = PIG_STATE.KNOCKBACK
    this.knockbackVx = knockDir.x * (knockForce || 5)
    this.knockbackVy = knockDir.y * (knockForce || 5) - 3
    this.knockbackTimer = 8

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
        this.y += this.speed * dtSec
        this._handleAbility(dt)
        break
      case PIG_STATE.KNOCKBACK:
        this.x += this.knockbackVx * dtSec * 60
        this.y += this.knockbackVy * dtSec * 60
        this.knockbackTimer--
        if (this.knockbackTimer <= 0) {
          if (this.hp <= 0) {
            this.state = PIG_STATE.DEAD
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

    // 出界检测
    if (this.y > Screen.gameHeight + 50 && this.state === PIG_STATE.WALKING) {
      this._alive = false
      this._escaped = true
    }

    this._updateAABB()
  }

  _handleAbility(dt) {
    if (!this.typeConfig || !this.typeConfig.abilities) return
    const abs = this.typeConfig.abilities

    if (abs.includes('speed_boost')) {
      if (this.abilityCooldown <= 0) {
        this.abilityTimer += dt
        if (this.abilityTimer > 2000) {
          // 每 2 秒冲刺一次
          this.speed = this.typeConfig.speed * 1.8
          setTimeout(() => { this.speed = this.typeConfig.speed }, 400)
          this.abilityTimer = 0
          this.abilityCooldown = 2000
        }
      }
    }

    if (abs.includes('periodic_invisible')) {
      this.abilityTimer += dt
      this._invisible = this.abilityTimer % 3000 > 1500
    }

    if (abs.includes('throw_mud')) {
      if (this.abilityCooldown <= 0) {
        // 扔泥巴逻辑由 BattleScene 处理
        this._throwingMud = true
        this.abilityCooldown = 4000
      }
    }

    if (abs.includes('spawn_clones')) {
      if (this.abilityCooldown <= 0) {
        this._spawningClones = true
        this.abilityCooldown = 5000
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
    this._throwingMud = false
    this._spawningClones = false
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
