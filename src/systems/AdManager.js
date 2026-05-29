class AdManagerClass {
  constructor() {
    this.rewardedVideoAd = null
    this.interstitialAd = null
    this.rewardCallback = null
    this.interstitialCount = 0
    this.lastInterstitialTime = 0
    this.dailyInterstitialCount = 0
    this.dailyRewardedCount = 0
    this.isFirstDay = true
    this._rewardedReady = false
    this._adsWatched = 0
  }

  init() {
    // 开发阶段：没有真实广告位 ID 时跳过
    const rewardedAdUnitId = 'adunit-xxxxxxxxxx'
    const interstitialAdUnitId = 'adunit-yyyyyyyyyy'
    const isDev = rewardedAdUnitId.includes('xxx') || interstitialAdUnitId.includes('yyy')

    if (isDev) {
      console.log('[AdManager] 开发模式：广告已禁用，上线前替换 adUnitId')
      return
    }

    // 激励视频广告
    try {
      this.rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: rewardedAdUnitId
      })
      this.rewardedVideoAd.onLoad(() => {
        this._rewardedReady = true
      })
      this.rewardedVideoAd.onError((err) => {
        console.log('Rewarded video ad error:', err)
      })
      this.rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded && this.rewardCallback) {
          this._adsWatched++
          if (typeof AchievementTracker !== 'undefined') {
            AchievementTracker.check('adsWatched', this._adsWatched)
          }
          this.rewardCallback(true)
        } else if (this.rewardCallback) {
          this.rewardCallback(false)
        }
        this.rewardCallback = null
        // 重新预加载
        this.rewardedVideoAd.load()
      })
      // 预加载
      this.rewardedVideoAd.load()
    } catch (e) {
      console.log('Create rewarded video ad failed:', e)
    }

    // 插屏广告
    try {
      this.interstitialAd = wx.createInterstitialAd({
        adUnitId: interstitialAdUnitId
      })
      this.interstitialAd.onError((err) => {
        console.log('Interstitial ad error:', err)
      })
    } catch (e) {
      console.log('Create interstitial ad failed:', e)
    }

    // 检查是否首日
    this._loadDailyStats()
  }

  _loadDailyStats() {
    const today = new Date().toDateString()
    const daily = Storage.get('stats.daily')
    if (daily.date === today) {
      this.dailyInterstitialCount = daily.adsWatched || 0
    } else {
      this.dailyInterstitialCount = 0
      // 检查注册日期判断是否首日
      const playDays = Storage.get('user.playDays') || 1
      this.isFirstDay = playDays <= 1
    }
  }

  // 激励视频：结算双倍金币
  showRewardedVideo(callback) {
    // 开发模式直接发奖励
    if (!this.rewardedVideoAd) {
      this._adsWatched++
      if (typeof AchievementTracker !== 'undefined') {
        AchievementTracker.check('adsWatched', this._adsWatched)
      }
      setTimeout(() => { if (callback) callback(true) }, 300)
      return
    }
    this.rewardCallback = callback
    if (this.rewardedVideoAd && this._rewardedReady) {
      this._rewardedReady = false
      this.rewardedVideoAd.show().catch(() => {
        this.rewardedVideoAd.load().then(() => {
          this.rewardedVideoAd.show().catch(() => {
            // 播放失败，仍然给奖励（开发阶段）
            if (callback) callback(true)
          })
        })
      })
    } else {
      // 广告未准备好，先加载再播放
      if (this.rewardedVideoAd) {
        this.rewardedVideoAd.load().then(() => {
          this._rewardedReady = true
          this.rewardedVideoAd.show().catch(() => {
            if (callback) callback(true)  // 开发容错
          })
        })
      } else {
        // 开发阶段：无广告直接给奖励
        setTimeout(() => { if (callback) callback(true) }, 500)
      }
    }
  }

  // 插屏广告
  showInterstitial() {
    if (!this.interstitialAd) return
    const now = Date.now()
    // 频控
    if (this.dailyInterstitialCount >= 10) return
    if (this.isFirstDay && this.dailyInterstitialCount >= 3) return  // 首日上限 3 次
    if (now - this.lastInterstitialTime < 120000) return  // 间隔 > 120 秒

    if (this.interstitialAd) {
      this.interstitialAd.show().catch(() => {})
      this.interstitialCount++
      this.dailyInterstitialCount++
      this.lastInterstitialTime = now
      this._saveDailyStats()
    }
  }

  // 检查是否应该展示插屏
  shouldShowInterstitial() {
    return this.interstitialCount % 3 === 0  // 每 3 关一次
  }

  _saveDailyStats() {
    const today = new Date().toDateString()
    Storage.set('stats.daily', {
      date: today,
      goldEarned: Storage.get('stats.daily.goldEarned') || 0,
      adsWatched: this.dailyInterstitialCount
    })
  }

  // 预加载激励视频
  preloadRewarded() {
    if (this.rewardedVideoAd) {
      this.rewardedVideoAd.load()
    }
  }
}

window.AdManager = new AdManagerClass()
