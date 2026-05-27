class ReportManager {
  // 敏感词过滤
  async checkContent(content) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'msgSecCheck',
        data: { content }
      })
      return res.result || { suggest: 'pass' }
    } catch (err) {
      // 云函数调用失败时放行
      return { suggest: 'pass' }
    }
  }

  // 设置昵称（带敏感词过滤）
  async setNickname(name) {
    if (!name || name.trim().length === 0) return { ok: false, msg: '昵称不能为空' }
    if (name.length > 8) return { ok: false, msg: '昵称最多 8 个字' }

    const checkResult = await this.checkContent(name)
    if (checkResult.suggest === 'risky' || checkResult.suggest === 'review') {
      return { ok: false, msg: '昵称包含敏感词，请换一个' }
    }

    Storage.setNickname(name)
    return { ok: true }
  }

  // 数据上报（留作后续分析用）
  reportEvent(eventName, data) {
    try {
      const db = window.cloudDB
      if (!db) return
      db.collection('events').add({
        data: {
          event: eventName,
          data: data || {},
          timestamp: db.serverDate()
        }
      })
    } catch (err) {
      // 静默失败
    }
  }
}

window.ReportManager = new ReportManager()
