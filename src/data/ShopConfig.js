const ShopConfig = {
  weaponSkins: [
    { id: 'fire_broom', name: '火焰扫帚', weapon: 'broom', cost: 1500, desc: '扫过留下火焰拖尾', icon: '🔥' },
    { id: 'gold_hammer', name: '黄金榔头', weapon: 'hammer', cost: 2000, desc: '金光闪闪的土豪锤', icon: '✨' },
    { id: 'neon_swatter', name: '霓虹苍蝇拍', weapon: 'swatter', cost: 1800, desc: 'RGB流光拍子', icon: '💫' },
    { id: 'thunder_taser', name: '雷霆之杖', weapon: 'taser', cost: 2500, desc: '紫色闪电环绕', icon: '⚡' },
    { id: 'diamond_slipper', name: '钻石拖鞋', weapon: 'slipper', cost: 3000, desc: '弹射轨迹带钻石', icon: '💎' },
    { id: 'dragon_rocket', name: '龙息火箭炮', weapon: 'rocket', cost: 5000, desc: '龙形火焰爆炸', icon: '🐉' }
  ],
  pigOutfits: [
    { id: 'sunglasses', name: '墨镜金链', cost: 1500, desc: '社会小猪', emoji: '😎' },
    { id: 'school_uniform', name: 'JK制服', cost: 1200, desc: '学生小猪', emoji: '👧' },
    { id: 'suit', name: '西装革履', cost: 2000, desc: '老板小猪', emoji: '🤵' },
    { id: 'pajamas', name: '睡衣套装', cost: 1000, desc: '睡眼惺忪猪', emoji: '😴' },
    { id: 'superhero', name: '超人披风', cost: 2500, desc: '超级飞猪', emoji: '🦸' },
    { id: 'clown', name: '小丑装扮', cost: 1800, desc: '滑稽小猪', emoji: '🤡' }
  ],
  effects: [
    { id: 'rainbow_star', name: '彩虹星爆', cost: 1000, desc: '击中飞出彩虹星星' },
    { id: 'fire_burst', name: '烈焰爆发', cost: 1500, desc: '击中火焰爆炸' },
    { id: 'thunder_strike', name: '雷霆打击', cost: 2000, desc: '击中闪电特效' },
    { id: 'heart_burst', name: '爱心炸裂', cost: 800, desc: '击中飞出爱心' },
    { id: 'money_rain', name: '金钱雨', cost: 2500, desc: '击中飘金币雨' }
  ],
  voicePacks: [
    { id: 'crybaby', name: '撒娇版', cost: 800, desc: '"人家错啦~不要嘛~"' },
    { id: 'dramatic', name: '戏精版', cost: 1000, desc: '"啊我死了！复活！又死了！"' },
    { id: 'dialect', name: '方言版', cost: 1500, desc: '东北/四川/广东话惨叫' },
    { id: 'robot', name: '机器人版', cost: 1200, desc: '电子音惨叫' },
    { id: 'chipmunk', name: '花栗鼠版', cost: 1000, desc: '加速变声惨叫' },
    { id: 'boss_tone', name: '老板腔', cost: 1200, desc: '"这个月的KPI你完成了吗？"' },
    { id: 'green_tea', name: '绿茶腔', cost: 1200, desc: '"哥哥你打人家好痛哦~"' },
    { id: 'monk_tone', name: '唐僧腔', cost: 1500, desc: '"打猪是不对的，不过...嗯。"' }
  ],
  backgrounds: [
    { id: 'default', name: '默认房间', cost: 0, desc: '温馨小客厅' },
    { id: 'office', name: '办公室', cost: 2000, desc: '格子间办公桌背景' },
    { id: 'classroom', name: '教室', cost: 2000, desc: '黑板课桌背景' },
    { id: 'kitchen', name: '厨房', cost: 2500, desc: '锅碗瓢盆背景' },
    { id: 'space', name: '太空', cost: 3000, desc: '宇宙星球背景' },
    { id: 'dojo', name: '武道馆', cost: 3000, desc: '日式道场背景' }
  ]
}

window.ShopConfig = ShopConfig
