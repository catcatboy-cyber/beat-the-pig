const LevelConfig = {
  levels: [
    // === 新手村 (1-10) ===
    {
      level: 1, name: '初来乍到', stage: 'beginner',
      duration: 30, holes: 2, defenseHP: 10,
      waves: [
        { pigs: 6, types: [{ id: 'normal', weight: 100 }], interval: 2.0 }
      ],
      boss: null
    },
    {
      level: 2, name: '热身运动', stage: 'beginner',
      duration: 30, holes: 2, defenseHP: 10,
      waves: [
        { pigs: 8, types: [{ id: 'normal', weight: 100 }], interval: 1.8 }
      ],
      boss: null
    },
    {
      level: 3, name: '第一滴血', stage: 'beginner',
      duration: 30, holes: 2, defenseHP: 10,
      waves: [
        { pigs: 10, types: [{ id: 'normal', weight: 100 }], interval: 1.6 }
      ],
      boss: null
    },
    {
      level: 4, name: '猪突猛进', stage: 'beginner',
      duration: 35, holes: 2, defenseHP: 9,
      waves: [
        { pigs: 8, types: [{ id: 'normal', weight: 100 }], interval: 1.8 },
        { pigs: 6, types: [{ id: 'normal', weight: 100 }], interval: 1.4 }
      ],
      boss: null
    },
    {
      level: 5, name: '哭包来袭', stage: 'beginner',
      duration: 35, holes: 2, defenseHP: 9,
      waves: [
        { pigs: 6, types: [{ id: 'normal', weight: 70 }, { id: 'crybaby', weight: 30 }], interval: 1.8 },
        { pigs: 8, types: [{ id: 'normal', weight: 60 }, { id: 'crybaby', weight: 40 }], interval: 1.4 }
      ],
      boss: null,
      unlock: 'hammer'
    },
    {
      level: 6, name: '扫帚飞扬', stage: 'beginner',
      duration: 35, holes: 2, defenseHP: 8,
      waves: [
        { pigs: 10, types: [{ id: 'normal', weight: 60 }, { id: 'crybaby', weight: 40 }], interval: 1.6 }
      ],
      boss: null
    },
    {
      level: 7, name: '双重麻烦', stage: 'beginner',
      duration: 35, holes: 2, defenseHP: 8,
      waves: [
        { pigs: 8, types: [{ id: 'normal', weight: 50 }, { id: 'crybaby', weight: 50 }], interval: 1.5 },
        { pigs: 8, types: [{ id: 'crybaby', weight: 60 }, { id: 'normal', weight: 40 }], interval: 1.2 }
      ],
      boss: null
    },
    {
      level: 8, name: '手忙脚乱', stage: 'beginner',
      duration: 35, holes: 3, defenseHP: 7,
      waves: [
        { pigs: 10, types: [{ id: 'normal', weight: 50 }, { id: 'crybaby', weight: 50 }], interval: 1.4 }
      ],
      boss: null
    },
    {
      level: 9, name: '最后试炼', stage: 'beginner',
      duration: 40, holes: 3, defenseHP: 7,
      waves: [
        { pigs: 8, types: [{ id: 'normal', weight: 60 }, { id: 'crybaby', weight: 40 }], interval: 1.5 },
        { pigs: 10, types: [{ id: 'crybaby', weight: 50 }, { id: 'normal', weight: 50 }], interval: 1.2 }
      ],
      boss: null
    },
    {
      level: 10, name: 'Boss: 猪老大', stage: 'beginner',
      duration: 45, holes: 3, defenseHP: 8,
      waves: [
        { pigs: 5, types: [{ id: 'normal', weight: 100 }], interval: 2.0 }
      ],
      boss: { type: 'boss', hp: 1200 }
    },

    // === 进阶 (11-30) ===
    {
      level: 11, name: '速度激情', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 7,
      waves: [
        { pigs: 8, types: [{ id: 'speedy', weight: 30 }, { id: 'normal', weight: 70 }], interval: 1.5 },
        { pigs: 10, types: [{ id: 'speedy', weight: 40 }, { id: 'normal', weight: 60 }], interval: 1.2 }
      ],
      boss: null
    },
    {
      level: 12, name: '加速世界', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 7,
      waves: [
        { pigs: 12, types: [{ id: 'speedy', weight: 50 }, { id: 'normal', weight: 50 }], interval: 1.3 }
      ],
      boss: null
    },
    {
      level: 13, name: '混合双打', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 6,
      waves: [
        { pigs: 8, types: [{ id: 'speedy', weight: 40 }, { id: 'crybaby', weight: 30 }, { id: 'normal', weight: 30 }], interval: 1.4 },
        { pigs: 10, types: [{ id: 'speedy', weight: 50 }, { id: 'crybaby', weight: 30 }, { id: 'normal', weight: 20 }], interval: 1.1 }
      ],
      boss: null
    },
    {
      level: 14, name: '狂风暴雨', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 6,
      waves: [
        { pigs: 10, types: [{ id: 'speedy', weight: 60 }, { id: 'normal', weight: 40 }], interval: 1.3 },
        { pigs: 8, types: [{ id: 'speedy', weight: 70 }, { id: 'crybaby', weight: 30 }], interval: 1.0 }
      ],
      boss: null
    },
    {
      level: 15, name: '琅头初试', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 7,
      waves: [
        { pigs: 10, types: [{ id: 'normal', weight: 40 }, { id: 'speedy', weight: 30 }, { id: 'crybaby', weight: 30 }], interval: 1.3 }
      ],
      boss: null,
      unlock: 'swatter'
    },
    // 关卡 16-19 逐步增加难度
    {
      level: 16, name: '猪山猪海', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 6,
      waves: [
        { pigs: 12, types: [{ id: 'speedy', weight: 50 }, { id: 'crybaby', weight: 30 }, { id: 'normal', weight: 20 }], interval: 1.2 }
      ],
      boss: null
    },
    {
      level: 17, name: '无处可逃', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 5,
      waves: [
        { pigs: 10, types: [{ id: 'speedy', weight: 40 }, { id: 'crybaby', weight: 40 }, { id: 'normal', weight: 20 }], interval: 1.2 },
        { pigs: 8, types: [{ id: 'speedy', weight: 60 }, { id: 'crybaby', weight: 40 }], interval: 1.0 }
      ],
      boss: null
    },
    {
      level: 18, name: '极限挑战', stage: 'advanced',
      duration: 45, holes: 3, defenseHP: 5,
      waves: [
        { pigs: 12, types: [{ id: 'speedy', weight: 50 }, { id: 'crybaby', weight: 50 }], interval: 1.1 }
      ],
      boss: null
    },
    {
      level: 19, name: '暴风雨前', stage: 'advanced',
      duration: 45, holes: 3, defenseHP: 5,
      waves: [
        { pigs: 10, types: [{ id: 'speedy', weight: 60 }, { id: 'crybaby', weight: 40 }], interval: 1.1 },
        { pigs: 10, types: [{ id: 'speedy', weight: 70 }, { id: 'crybaby', weight: 30 }], interval: 0.9 }
      ],
      boss: null
    },
    {
      level: 20, name: 'Boss: 极速猪王', stage: 'advanced',
      duration: 50, holes: 3, defenseHP: 7,
      waves: [
        { pigs: 4, types: [{ id: 'speedy', weight: 100 }], interval: 2.0 }
      ],
      boss: { type: 'boss', hp: 1800 }
    },
    // 关卡 21-30 引入分裂猪，难度继续上升
    {
      level: 21, name: '分裂开始', stage: 'advanced',
      duration: 40, holes: 3, defenseHP: 6,
      waves: [
        { pigs: 8, types: [{ id: 'split', weight: 30 }, { id: 'normal', weight: 70 }], interval: 1.4 }
      ],
      boss: null
    },
    {
      level: 22, name: '一生二二生四', stage: 'advanced',
      duration: 45, holes: 3, defenseHP: 6,
      waves: [
        { pigs: 10, types: [{ id: 'split', weight: 40 }, { id: 'normal', weight: 60 }], interval: 1.3 }
      ],
      boss: null
    },
    {
      level: 23, name: '分裂危机', stage: 'advanced',
      duration: 45, holes: 3, defenseHP: 5,
      waves: [
        { pigs: 8, types: [{ id: 'split', weight: 40 }, { id: 'speedy', weight: 30 }, { id: 'normal', weight: 30 }], interval: 1.2 },
        { pigs: 8, types: [{ id: 'split', weight: 50 }, { id: 'speedy', weight: 50 }], interval: 1.0 }
      ],
      boss: null
    },
    {
      level: 24, name: '大混战', stage: 'advanced',
      duration: 45, holes: 3, defenseHP: 5,
      waves: [
        { pigs: 10, types: [{ id: 'split', weight: 40 }, { id: 'speedy', weight: 30 }, { id: 'crybaby', weight: 30 }], interval: 1.1 }
      ],
      boss: null
    },
    {
      level: 25, name: '电闪雷鸣', stage: 'advanced',
      duration: 45, holes: 3, defenseHP: 6,
      waves: [
        { pigs: 10, types: [{ id: 'split', weight: 50 }, { id: 'speedy', weight: 30 }, { id: 'normal', weight: 20 }], interval: 1.1 }
      ],
      boss: null,
      unlock: 'taser'
    },
    {
      level: 26, name: '猪群汹涌', stage: 'advanced',
      duration: 45, holes: 3, defenseHP: 5,
      waves: [
        { pigs: 12, types: [{ id: 'split', weight: 50 }, { id: 'speedy', weight: 30 }, { id: 'crybaby', weight: 20 }], interval: 1.0 }
      ],
      boss: null
    },
    {
      level: 27, name: '应接不暇', stage: 'advanced',
      duration: 45, holes: 4, defenseHP: 5,
      waves: [
        { pigs: 10, types: [{ id: 'split', weight: 40 }, { id: 'speedy', weight: 40 }, { id: 'crybaby', weight: 20 }], interval: 1.0 },
        { pigs: 10, types: [{ id: 'split', weight: 50 }, { id: 'speedy', weight: 50 }], interval: 0.9 }
      ],
      boss: null
    },
    {
      level: 28, name: '极限操作', stage: 'advanced',
      duration: 50, holes: 4, defenseHP: 4,
      waves: [
        { pigs: 12, types: [{ id: 'split', weight: 50 }, { id: 'speedy', weight: 50 }], interval: 1.0 }
      ],
      boss: null
    },
    {
      level: 29, name: '决战前夕', stage: 'advanced',
      duration: 50, holes: 4, defenseHP: 4,
      waves: [
        { pigs: 10, types: [{ id: 'split', weight: 40 }, { id: 'speedy', weight: 40 }, { id: 'crybaby', weight: 20 }], interval: 1.0 },
        { pigs: 8, types: [{ id: 'split', weight: 60 }, { id: 'speedy', weight: 40 }], interval: 0.8 }
      ],
      boss: null
    },
    {
      level: 30, name: 'Boss: 分裂之王', stage: 'advanced',
      duration: 60, holes: 4, defenseHP: 7,
      waves: [
        { pigs: 3, types: [{ id: 'split', weight: 100 }], interval: 2.5 }
      ],
      boss: { type: 'boss', hp: 2500 }
    }
  ],

  getLevel(num) {
    if (num <= this.levels.length) {
      return this.levels[num - 1]
    }
    return this._generateProceduralLevel(num)
  },

  _generateProceduralLevel(num) {
    const stage = num <= 10 ? 'beginner'
      : num <= 30 ? 'advanced'
      : num <= 60 ? 'expert'
      : 'hell'

    const holes = stage === 'beginner' ? 2
      : stage === 'advanced' ? 3
      : stage === 'expert' ? 4
      : 5
    const duration = 40 + (stage === 'hell' ? 20 : stage === 'expert' ? 10 : 0)
    const interval = Math.max(0.5, 1.8 - num * 0.01)

    const availableTypes = []
    for (const [key, type] of Object.entries(PigTypes)) {
      if (type.unlockLevel > 0 && type.unlockLevel <= num && !type.isBoss) {
        availableTypes.push(key)
      }
    }
    if (availableTypes.length === 0) availableTypes.push('normal')

    const types = availableTypes.map((id, i) => ({
      id,
      weight: Math.max(10, 100 - i * 15)
    }))

    return {
      level: num,
      name: `第${num}关`,
      stage,
      duration,
      holes,
      defenseHP: Math.max(1, 8 - Math.floor(num / 15)),
      waves: [
        { pigs: 8 + Math.floor(num / 5), types, interval },
        { pigs: 10 + Math.floor(num / 4), types, interval: Math.max(0.5, interval - 0.2) }
      ],
      boss: num % 10 === 0 ? { type: 'boss', hp: 1500 + num * 80 } : null
    }
  },

  getTotalLevels() {
    return this.levels.length
  }
}

window.LevelConfig = LevelConfig
