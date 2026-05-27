class RankManager {
  constructor() {
    this._cache = {}
    this._cacheTime = {}
  }

  // 获取排行榜（带本地缓存，5 分钟有效）
  async getRank(type, limit = 50) {
    const cacheKey = `${type}_${limit}`
    const now = Date.now()
    if (this._cache[cacheKey] && (now - this._cacheTime[cacheKey]) < 300000) {
      return this._cache[cacheKey]
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'getRank',
        data: { type, limit }
      })
      if (res.result && res.result.code === 0) {
        this._cache[cacheKey] = res.result.data
        this._cacheTime[cacheKey] = now
        return res.result.data
      }
    } catch (err) {
      console.error('getRank failed:', err)
    }
    return []
  }

  // 上传自己的数据
  async updateRank(data) {
    try {
      await wx.cloud.callFunction({
        name: 'updateRank',
        data: {
          nickname: data.nickname || Storage.getNickname(),
          maxCombo: data.maxCombo || Storage.get('user.maxCombo'),
          totalKills: data.totalKills || Storage.get('user.totalKills'),
          totalDamage: data.totalDamage || 0
        }
      })
    } catch (err) {
      console.error('updateRank failed:', err)
    }
  }

  // 通关后自动上传
  autoUpdate() {
    const data = {
      nickname: Storage.getNickname(),
      maxCombo: Storage.get('user.maxCombo'),
      totalKills: Storage.get('user.totalKills')
    }
    this.updateRank(data)
    this._syncFriendStorage(data)
  }

  // 同步到好友排行榜（开放数据域）
  _syncFriendStorage(data) {
    try {
      wx.setUserCloudStorage({
        KVDataList: [
          { key: 'maxCombo', value: String(data.maxCombo || 0) },
          { key: 'totalKills', value: String(data.totalKills || 0) }
        ]
      })
    } catch (err) {
      // 开放数据域上传失败不阻塞
    }
  }
}

window.RankManager = new RankManager()
