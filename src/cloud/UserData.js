class UserDataManager {
  constructor() {
    this._synced = false
  }

  // 从云端拉取用户数据（用于换设备恢复或好友数据导入）
  async fetchFromCloud() {
    try {
      const db = window.cloudDB
      if (!db) return null
      const { data } = await db.collection('users').where({
        _openid: '{openid}'
      }).get()
      return data[0] || null
    } catch (err) {
      console.error('fetchFromCloud failed:', err)
      return null
    }
  }

  // 同步本地数据到云端
  async syncToCloud() {
    if (this._synced) return
    try {
      const db = window.cloudDB
      if (!db) return
      const allData = Storage.getAllData()
      await db.collection('user_data').add({
        data: {
          nickname: allData.user.nickname,
          currentLevel: allData.user.currentLevel,
          maxLevel: allData.user.maxLevel,
          totalKills: allData.user.totalKills,
          maxCombo: allData.user.maxCombo,
          gold: allData.user.gold,
          weapons: allData.weapons,
          updatedAt: db.serverDate()
        }
      })
      this._synced = true
    } catch (err) {
      console.error('syncToCloud failed:', err)
    }
  }

  // 保存导入的好友猪数据
  async saveImportedPig(friendOpenid, pigData) {
    try {
      const db = window.cloudDB
      if (!db) return
      await db.collection('imported_pigs').add({
        data: {
          ownerOpenid: friendOpenid,
          nickname: pigData.nickname,
          level: pigData.level,
          importedAt: db.serverDate()
        }
      })
    } catch (err) {
      console.error('saveImportedPig failed:', err)
    }
  }

  // 获取我导入的好友猪列表
  async getImportedPigs() {
    try {
      const db = window.cloudDB
      if (!db) return []
      const { data } = await db.collection('imported_pigs').get()
      return data
    } catch (err) {
      console.error('getImportedPigs failed:', err)
      return []
    }
  }
}

window.UserDataManager = new UserDataManager()
