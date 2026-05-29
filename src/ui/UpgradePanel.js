class UpgradePanelClass {
  constructor() {
    this.visible = false
    this.cards = []
    this._onChoice = null
  }

  show(onChoice) {
    this.visible = true
    this.cards = UpgradeSystem.getChoices(3)
    this._onChoice = onChoice || null
  }

  hide() {
    this.visible = false
    this.cards = []
    this._onChoice = null
  }

  hasChoices() {
    return this.visible && this.cards.length > 0
  }

  handleTap(px, py) {
    if (!this.visible || this.cards.length === 0) return false
    var cardH = Screen.scale(120)
    var startY = Screen.gameHeight / 2 - cardH * 1.5 + 10
    var cx = Screen.gameWidth / 2
    var cardW = Screen.scale(240)
    var gap = Screen.scale(12)

    for (var i = 0; i < this.cards.length; i++) {
      var cy = startY + i * (cardH + gap)
      var cx2 = cx - cardW / 2
      if (px >= cx2 && px <= cx2 + cardW && py >= cy && py <= cy + cardH) {
        var upgradeId = this.cards[i].id
        UpgradeSystem.applyUpgrade(upgradeId)
        if (this._onChoice) this._onChoice(this.cards[i])
        this.hide()
        return true
      }
    }
    return false
  }

  render(ctx) {
    if (!this.visible || this.cards.length === 0) return

    var cx = Screen.gameWidth / 2
    var cy = Screen.gameHeight / 2

    // Dim background
    ctx.fillStyle = 'rgba(75, 53, 40, 0.55)'
    ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

    // Title
    ctx.fillStyle = Theme.gold
    ctx.font = 'bold ' + Screen.scale(20) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⬆ 选择升级', cx + 1, cy - Screen.scale(135) + 1)
    ctx.fillStyle = Theme.ink
    ctx.fillText('⬆ 选择升级', cx, cy - Screen.scale(135))

    // Cards
    var cardW = Screen.scale(240)
    var cardH = Screen.scale(120)
    var startY = cy - cardH * 1.5 + 10
    var gap = Screen.scale(12)

    for (var i = 0; i < this.cards.length; i++) {
      var upgrade = this.cards[i]
      var cardX = cx - cardW / 2
      var cardY = startY + i * (cardH + gap)

      Theme.drawPaperCard(ctx, cardX, cardY, cardW, cardH, {
        fill: Theme.paperWhite,
        border: Theme.ink,
        radius: 12,
        shadowOffset: 4
      })

      // Icon
      ctx.font = Screen.scale(28) + 'px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(upgrade.icon || '⬆', cardX + 14, cardY + 14)

      // Name
      ctx.fillStyle = Theme.ink
      ctx.font = 'bold ' + Screen.scale(14) + 'px sans-serif'
      ctx.fillText(upgrade.name, cardX + 52, cardY + 18)

      // Level indicator
      var currentLv = (UpgradeSystem.activeUpgrades[upgrade.type] && UpgradeSystem.activeUpgrades[upgrade.type].level) || 0
      ctx.fillStyle = Theme.teal
      ctx.font = Screen.scale(10) + 'px sans-serif'
      ctx.fillText('Lv.' + currentLv + ' → Lv.' + (currentLv + 1), cardX + 52, cardY + 38)

      // Description based on type
      var desc = this._getUpgradeDesc(upgrade)
      ctx.fillStyle = Theme.inkLight
      ctx.font = Screen.scale(11) + 'px sans-serif'
      ctx.fillText(desc, cardX + 14, cardY + 62)

      // Max level badge
      var maxLv = upgrade.maxLevel || 3
      if (currentLv >= maxLv) {
        ctx.fillStyle = Theme.red
        ctx.font = 'bold ' + Screen.scale(11) + 'px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('已满', cardX + cardW - 14, cardY + 18)
        ctx.textAlign = 'left'
      }
    }
  }

  _getUpgradeDesc(upgrade) {
    switch (upgrade.type) {
      case 'attack': return '武器攻击力提升'
      case 'range': return '攻击范围扩大'
      case 'crit': return '概率造成暴击伤害'
      case 'slow': return '击中后减速小猪'
      case 'magnet': return '自动吸引附近金币'
      case 'comboGold': return '连击时金币加成提高'
      case 'shield': return '获得额外护盾'
      case 'cdReduction': return '特殊技能冷却减少'
      case 'stun': return '击中概率眩晕小猪'
      default: return ''
    }
  }
}

window.UpgradePanel = new UpgradePanelClass()
