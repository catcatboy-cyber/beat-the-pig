const AchievementConfig = [
  // ── 战斗里程碑 ──
  { id: 'first_kill', name: '初次下手', desc: '第一次暴打小猪', icon: '👊', condition: { type: 'totalKills', value: 1 } },
  { id: 'kill_100', name: '百猪斩', desc: '累计击败100只小猪', icon: '💯', condition: { type: 'totalKills', value: 100 } },
  { id: 'kill_500', name: '屠猪勇士', desc: '累计击败500只小猪', icon: '⚔️', condition: { type: 'totalKills', value: 500 } },
  { id: 'kill_1000', name: '猪见愁', desc: '累计击败1000只小猪', icon: '🏆', condition: { type: 'totalKills', value: 1000 } },
  { id: 'kill_5000', name: '猪圈终结者', desc: '累计击败5000只小猪', icon: '👑', condition: { type: 'totalKills', value: 5000 } },

  // ── 连击成就 ──
  { id: 'combo_10', name: '手感来了', desc: '达成10连击', icon: '🔥', condition: { type: 'maxCombo', value: 10 } },
  { id: 'combo_30', name: '连击达人', desc: '达成30连击', icon: '💥', condition: { type: 'maxCombo', value: 30 } },
  { id: 'combo_50', name: '无双乱舞', desc: '达成50连击', icon: '🌪️', condition: { type: 'maxCombo', value: 50 } },
  { id: 'combo_100', name: '人猪合一', desc: '达成100连击', icon: '✨', condition: { type: 'maxCombo', value: 100 } },

  // ── 关卡进度 ──
  { id: 'level_5', name: '初出茅庐', desc: '通关第5关', icon: '🌟', condition: { type: 'maxLevel', value: 5 } },
  { id: 'level_10', name: '渐入佳境', desc: '通关第10关', icon: '⭐', condition: { type: 'maxLevel', value: 10 } },
  { id: 'level_20', name: '身经百战', desc: '通关第20关', icon: '🎖️', condition: { type: 'maxLevel', value: 20 } },
  { id: 'level_30', name: '打通天下', desc: '通关第30关', icon: '🏅', condition: { type: 'maxLevel', value: 30 } },

  // ── 金币成就 ──
  { id: 'gold_1000', name: '第一桶金', desc: '累计获得1000金币', icon: '🪙', condition: { type: 'totalGold', value: 1000 } },
  { id: 'gold_10000', name: '暴发户', desc: '累计获得10000金币', icon: '💰', condition: { type: 'totalGold', value: 10000 } },

  // ── 武器成就 ──
  { id: 'unlock_all', name: '武器大师', desc: '解锁全部6种武器', icon: '🔧', condition: { type: 'weaponsUnlocked', value: 6 } },
  { id: 'max_one', name: '精益求精', desc: '任意一把武器升到满级', icon: '📈', condition: { type: 'weaponMaxLevel', value: 1 } },

  // ── 特殊成就 ──
  { id: 'boss_first', name: '屠龙勇士', desc: '第一次击败Boss', icon: '🐉', condition: { type: 'bossKills', value: 1 } },
  { id: 'no_damage', name: '完美防线', desc: '一局中防线未被突破（满血通关）', icon: '🛡️', condition: { type: 'perfectDefense', value: 1 } },
  { id: 'ad_watcher', name: '广告爱好者', desc: '累计观看10次广告', icon: '📺', condition: { type: 'adsWatched', value: 10 } }
]

window.AchievementConfig = AchievementConfig
window.AchievementUnlocked = {}  // runtime cache: { achievementId: true }
