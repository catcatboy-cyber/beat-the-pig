class UpgradeSystemClass {
  constructor() {
    this.activeUpgrades = {}  // 局内升级生效中
    this.upgradePool = [
      { id: 'atk1', name: '攻击力 +20%', type: 'attack', value: 0.2, maxLevel: 3, icon: '⚔️' },
      { id: 'atk2', name: '攻击力 +40%', type: 'attack', value: 0.4, maxLevel: 3, icon: '⚔️' },
      { id: 'atk3', name: '攻击力 +60%', type: 'attack', value: 0.6, maxLevel: 3, icon: '⚔️' },
      { id: 'range1', name: '攻击范围 +15%', type: 'range', value: 0.15, maxLevel: 3, icon: '📏' },
      { id: 'range2', name: '攻击范围 +30%', type: 'range', value: 0.3, maxLevel: 3, icon: '📏' },
      { id: 'range3', name: '攻击范围 +45%', type: 'range', value: 0.45, maxLevel: 3, icon: '📏' },
      { id: 'crit1', name: '暴击率 +15%', type: 'crit', value: 0.15, maxLevel: 3, icon: '💥' },
      { id: 'crit2', name: '暴击率 +25%', type: 'crit', value: 0.25, maxLevel: 3, icon: '💥' },
      { id: 'slow1', name: '击中减速 2秒', type: 'slow', value: 2, maxLevel: 3, icon: '🐌' },
      { id: 'slow2', name: '击中减速 3秒', type: 'slow', value: 3, maxLevel: 3, icon: '🐌' },
      { id: 'magnet', name: '金币磁铁', type: 'magnet', value: 1, maxLevel: 1, icon: '🧲' },
      { id: 'comboGold', name: '连击金币 +50%', type: 'comboGold', value: 0.5, maxLevel: 3, icon: '💎' },
      { id: 'shield', name: '护盾 +1', type: 'shield', value: 1, maxLevel: 3, icon: '🛡️' },
      { id: 'cdReduction', name: '大招CD -20%', type: 'cdReduction', value: 0.2, maxLevel: 3, icon: '⏱️' },
      { id: 'stun', name: '眩晕概率 +10%', type: 'stun', value: 0.1, maxLevel: 3, icon: '⚡' }
    ]
  }

  getChoices(count) {
    const availablePool = this.upgradePool.filter(u => {
      const current = this.activeUpgrades[u.type]
      if (!current) return true
      return current.level < u.maxLevel
    })
    if (availablePool.length === 0) return []
    return Random.shuffle(availablePool).slice(0, count)
  }

  applyUpgrade(upgradeId) {
    const upgrade = this.upgradePool.find(u => u.id === upgradeId)
    if (!upgrade) return false
    if (!this.activeUpgrades[upgrade.type]) {
      this.activeUpgrades[upgrade.type] = { ...upgrade, level: 1 }
    } else {
      this.activeUpgrades[upgrade.type].level++
      this.activeUpgrades[upgrade.type].value = Math.max(
        this.activeUpgrades[upgrade.type].value,
        upgrade.value
      )
    }
    return true
  }

  getAttackMultiplier() {
    const atk = this.activeUpgrades['attack']
    return atk ? (1 + atk.value) : 1
  }

  getRangeMultiplier() {
    const range = this.activeUpgrades['range']
    return range ? (1 + range.value) : 1
  }

  getCritChance() {
    const crit = this.activeUpgrades['crit']
    return crit ? crit.value : 0
  }

  hasMagnet() {
    return !!this.activeUpgrades['magnet']
  }

  getComboGoldMultiplier() {
    const cg = this.activeUpgrades['comboGold']
    return cg ? (1 + cg.value) : 1
  }

  getShieldCount() {
    const shield = this.activeUpgrades['shield']
    return shield ? shield.value : 0
  }

  reset() {
    this.activeUpgrades = {}
  }
}

window.UpgradeSystem = new UpgradeSystemClass()
