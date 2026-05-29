class AchievementTrackerClass {
  constructor() {
    this._checked = {}
    this._toastQueue = []
    this._toastTimer = 0
    this._initFromStorage()
  }

  _initFromStorage() {
    var unlocked = Storage.get('stats.achievements') || []
    for (var i = 0; i < unlocked.length; i++) {
      this._checked[unlocked[i]] = true
    }
  }

  check(type, value) {
    var newlyUnlocked = []
    for (var i = 0; i < AchievementConfig.length; i++) {
      var ach = AchievementConfig[i]
      if (this._checked[ach.id]) continue
      if (ach.condition.type === type && value >= ach.condition.value) {
        this._checked[ach.id] = true
        newlyUnlocked.push(ach)
      }
    }

    if (newlyUnlocked.length > 0) {
      var unlocked = Storage.get('stats.achievements') || []
      for (var j = 0; j < newlyUnlocked.length; j++) {
        if (unlocked.indexOf(newlyUnlocked[j].id) < 0) {
          unlocked.push(newlyUnlocked[j].id)
        }
      }
      Storage.set('stats.achievements', unlocked)

      // Queue toast for each (show one at a time)
      for (var k = 0; k < newlyUnlocked.length; k++) {
        this._toastQueue.push(newlyUnlocked[k])
      }
    }
  }

  // Call each frame
  update(dt) {
    if (this._toastTimer > 0) {
      this._toastTimer -= dt
      if (this._toastTimer <= 0 && this._toastQueue.length > 0) {
        this._toastQueue.shift()
      }
    }
    if (this._toastTimer <= 0 && this._toastQueue.length > 0) {
      this._toastTimer = 2500
    }
  }

  hasActiveToast() {
    return this._toastTimer > 0 && this._toastQueue.length > 0
  }

  getCurrentToast() {
    if (this._toastQueue.length === 0) return null
    return this._toastQueue[0]
  }

  renderToast(ctx) {
    var toast = this.getCurrentToast()
    if (!toast || this._toastTimer <= 0) return

    var cx = Screen.gameWidth / 2
    var toastW = Screen.scale(260)
    var toastH = Screen.scale(52)
    var toastX = cx - toastW / 2
    var toastY = Screen.gameHeight * 0.13
    var alpha = Math.min(1, this._toastTimer / 400)

    ctx.save()
    ctx.globalAlpha = alpha

    Theme.drawPaperCard(ctx, toastX, toastY, toastW, toastH, {
      fill: Theme.gold,
      border: Theme.ink,
      radius: 12,
      shadowOffset: 4
    })

    ctx.fillStyle = Theme.ink
    ctx.font = 'bold ' + Screen.scale(13) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏆 成就解锁!', cx, toastY + 16)

    ctx.fillStyle = Theme.ink
    ctx.font = Screen.scale(11) + 'px sans-serif'
    ctx.fillText(toast.icon + ' ' + toast.name, cx, toastY + 36)

    ctx.restore()
  }

  isUnlocked(id) {
    return !!this._checked[id]
  }

  getAll() {
    return AchievementConfig.map(function (ach) {
      return {
        config: ach,
        unlocked: !!this._checked[ach.id]
      }
    }.bind(this))
  }
}

window.AchievementTracker = new AchievementTrackerClass()
