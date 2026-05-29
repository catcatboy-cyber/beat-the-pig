class StorageUtil {
  constructor() {
    this._cache = null
  }

  init() {
    this._cache = this._load()
  }

  _load() {
    try {
      const data = wx.getStorageSync('beatpig_data')
      return data ? JSON.parse(data) : this._defaultData()
    } catch (e) {
      return this._defaultData()
    }
  }

  _defaultData() {
    return {
      user: {
        nickname: '',
        avatar: '🐷',
        avatarType: 'emoji',
        gold: 0,
        currentLevel: 1,
        maxLevel: 1,
        totalKills: 0,
        maxCombo: 0,
        playDays: 1
      },
      weapons: {
        broom: { level: 1, special: false },
        hammer: { level: 0, special: false },
        swatter: { level: 0, special: false },
        taser: { level: 0, special: false },
        slipper: { level: 0, special: false },
        rocket: { level: 0, special: false },
        machinegun: { level: 0, special: false },
        poop: { level: 0, special: false }
      },
      skins: {
        weaponSkins: [],
        pigOutfits: [],
        effects: [],
        voicePacks: [],
        backgrounds: []
      },
      stats: {
        daily: { date: '', goldEarned: 0, adsWatched: 0 },
        achievements: [],
        signInStreak: 0,
        lastSignInDate: ''
      },
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        quality: 'high'
      }
    }
  }

  save() {
    try {
      wx.setStorageSync('beatpig_data', JSON.stringify(this._cache))
    } catch (e) {
      // storage full, silent fail
    }
  }

  get(path) {
    const keys = path.split('.')
    let val = this._cache
    for (const k of keys) {
      if (val == null) return undefined
      val = val[k]
    }
    return val
  }

  set(path, value) {
    const keys = path.split('.')
    let obj = this._cache
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {}
      obj = obj[keys[i]]
    }
    obj[keys[keys.length - 1]] = value
    this.save()
  }

  addGold(amount) {
    this._cache.user.gold += amount
    this._cache.stats.daily.goldEarned += amount
    this.save()
  }

  spendGold(amount) {
    if (this._cache.user.gold < amount) return false
    this._cache.user.gold -= amount
    this.save()
    return true
  }

  getGold() {
    return this._cache.user.gold
  }

  getWeaponLevel(weaponId) {
    return this._cache.weapons[weaponId] ? this._cache.weapons[weaponId].level : 0
  }

  getWeaponSpecial(weaponId) {
    return this._cache.weapons[weaponId] ? this._cache.weapons[weaponId].special : false
  }

  setWeaponLevel(weaponId, level) {
    if (!this._cache.weapons[weaponId]) {
      this._cache.weapons[weaponId] = { level: 0, special: false }
    }
    this._cache.weapons[weaponId].level = level
    this.save()
  }

  unlockWeaponSpecial(weaponId) {
    if (this._cache.weapons[weaponId]) {
      this._cache.weapons[weaponId].special = true
      this.save()
    }
  }

  getNickname() {
    return this._cache.user.nickname || '小猪'
  }

  setNickname(name) {
    this._cache.user.nickname = name
    this.save()
  }

  getAvatar() {
    return this._cache.user.avatar || '🐷'
  }

  getAvatarType() {
    return this._cache.user.avatarType || 'emoji'
  }

  setEmojiAvatar(emoji) {
    this._cache.user.avatar = emoji
    this._cache.user.avatarType = 'emoji'
    this.save()
  }

  setPhotoAvatar(filePath) {
    this._cache.user.avatar = filePath
    this._cache.user.avatarType = 'photo'
    this.save()
  }

  getCustomDialogs() {
    return this._cache.customDialogs || {}
  }

  getCustomDialog(name) {
    var dialogs = this._cache.customDialogs || {}
    return dialogs[name] || ''
  }

  setCustomDialog(name, text) {
    if (!this._cache.customDialogs) this._cache.customDialogs = {}
    if (text) {
      this._cache.customDialogs[name] = text
    } else {
      delete this._cache.customDialogs[name]
    }
    this.save()
  }

  getAllData() {
    return this._cache
  }
}

window.Storage = new StorageUtil()
