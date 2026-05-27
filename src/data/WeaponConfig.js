const WeaponConfig = {
  broom: {
    id: 'broom',
    name: '扫帚',
    icon: '🧹',
    unlockLevel: 1,
    unlockCost: 0,
    type: 'sweep',
    upgrades: [
      { level: 1, damage: 35, range: 100, speed: 1.0, cost: 0, desc: '基础扫帚' },
      { level: 2, damage: 42, range: 110, speed: 1.05, cost: 200, desc: '伤害+20%' },
      { level: 3, damage: 50, range: 120, speed: 1.10, cost: 500, desc: '范围+10%' },
      { level: 4, damage: 60, range: 135, speed: 1.15, cost: 1200, desc: '伤害+20%' },
      { level: 5, damage: 72, range: 150, speed: 1.20, cost: 2500, desc: '范围+15%' }
    ],
    special: {
      name: '火焰扫帚',
      cost: 3000,
      desc: '扫过后留下火焰路径，持续灼烧小猪 3 秒',
      damagePerSec: 15
    },
    sweepAngle: Math.PI / 2.5,
    knockbackForce: 12
  },
  hammer: {
    id: 'hammer',
    name: '榔头',
    icon: '🔨',
    unlockLevel: 5,
    unlockCost: 0,
    type: 'smash',
    upgrades: [
      { level: 1, damage: 65, range: 50, speed: 0.7, cost: 0, desc: '基础榔头' },
      { level: 2, damage: 80, range: 55, speed: 0.75, cost: 200, desc: '伤害+23%' },
      { level: 3, damage: 95, range: 60, speed: 0.80, cost: 500, desc: '暴击率+15%' },
      { level: 4, damage: 115, range: 68, speed: 0.85, cost: 1200, desc: '伤害+21%' },
      { level: 5, damage: 140, range: 75, speed: 0.90, cost: 2500, desc: '暴击伤害x2' }
    ],
    special: {
      name: '震荡锤',
      cost: 3000,
      desc: '砸地产生冲击波，溅射伤害周围敌人',
      splashRadius: 80,
      splashDamage: 0.5
    },
    critChance: 0,
    critMultiplier: 1.5,
    knockbackForce: 20
  },
  swatter: {
    id: 'swatter',
    name: '苍蝇拍',
    icon: '🪰',
    unlockLevel: 15,
    unlockCost: 500,
    type: 'rapid',
    upgrades: [
      { level: 1, damage: 18, range: 55, speed: 1.8, cost: 0, desc: '基础苍蝇拍' },
      { level: 2, damage: 22, range: 60, speed: 1.9, cost: 300, desc: '攻速+5%' },
      { level: 3, damage: 26, range: 65, speed: 2.0, cost: 600, desc: '伤害+18%' },
      { level: 4, damage: 31, range: 70, speed: 2.15, cost: 1300, desc: '连击窗口延长' },
      { level: 5, damage: 38, range: 80, speed: 2.3, cost: 2600, desc: '每50连击AOE一次' }
    ],
    special: {
      name: '电击拍',
      cost: 3000,
      desc: '每 50 连击自动触发一次范围电击',
      aoeInterval: 50
    },
    luckChance: 0.02,
    knockbackForce: 5
  },
  taser: {
    id: 'taser',
    name: '电击棒',
    icon: '⚡',
    unlockLevel: 25,
    unlockCost: 800,
    type: 'charge',
    upgrades: [
      { level: 1, damage: 50, range: 90, speed: 0.5, cost: 0, desc: '基础电击棒' },
      { level: 2, damage: 60, range: 95, speed: 0.55, cost: 400, desc: '蓄力速度+10%' },
      { level: 3, damage: 72, range: 100, speed: 0.6, cost: 800, desc: '麻痹时长+0.5秒' },
      { level: 4, damage: 86, range: 110, speed: 0.65, cost: 1600, desc: '连锁+1目标' },
      { level: 5, damage: 105, range: 120, speed: 0.7, cost: 3000, desc: '伤害+22%' }
    ],
    special: {
      name: '雷神之杖',
      cost: 5000,
      desc: '麻痹期间金币掉落翻倍',
      goldMultiplier: 2
    },
    chainTargets: 1,
    stunDuration: 1.5,
    maxCharge: 100,
    knockbackForce: 8
  },
  slipper: {
    id: 'slipper',
    name: '拖鞋',
    icon: '🩴',
    unlockLevel: 40,
    unlockCost: 1500,
    type: 'throw',
    upgrades: [
      { level: 1, damage: 40, range: 200, speed: 1.2, cost: 0, desc: '基础拖鞋' },
      { level: 2, damage: 48, range: 220, speed: 1.25, cost: 500, desc: '飞行速度+5%' },
      { level: 3, damage: 58, range: 240, speed: 1.3, cost: 1000, desc: '弹射次数+1' },
      { level: 4, damage: 70, range: 260, speed: 1.35, cost: 2000, desc: '追踪角度+20%' },
      { level: 5, damage: 85, range: 300, speed: 1.4, cost: 3500, desc: '伤害+21%' }
    ],
    special: {
      name: '金币拖鞋',
      cost: 5000,
      desc: '弹射路径留下金币',
      goldPerBounce: 5
    },
    bounceCount: 2,
    trackingAngle: Math.PI / 4,
    knockbackForce: 10
  },
  rocket: {
    id: 'rocket',
    name: '火箭炮',
    icon: '🚀',
    unlockLevel: 60,
    unlockCost: 3000,
    type: 'explosive',
    upgrades: [
      { level: 1, damage: 100, range: 120, speed: 0.4, cost: 0, desc: '基础火箭炮' },
      { level: 2, damage: 120, range: 130, speed: 0.43, cost: 800, desc: '爆炸半径+10%' },
      { level: 3, damage: 145, range: 145, speed: 0.46, cost: 1500, desc: '装填速度+10%' },
      { level: 4, damage: 175, range: 160, speed: 0.5, cost: 3000, desc: '燃烧伤害+50%' },
      { level: 5, damage: 210, range: 180, speed: 0.55, cost: 5000, desc: '伤害+20%' }
    ],
    special: {
      name: '双管火箭',
      cost: 8000,
      desc: '双发火箭弹',
      doubleShot: true
    },
    explosionRadius: 80,
    burnDamage: 10,
    burnDuration: 3,
    knockbackForce: 25
  }
}

window.WeaponConfig = WeaponConfig
