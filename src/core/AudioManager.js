class AudioManagerClass {
  constructor() {
    this.sounds = {}
    this.enabled = true
    this._playingPool = []
  }

  init() {
    this.enabled = Storage.get('settings.soundEnabled')
  }

  register(name, src) {
    const audio = wx.createInnerAudioContext()
    audio.src = src
    audio.onEnded(() => {
      this._playingPool = this._playingPool.filter(a => a !== audio)
    })
    audio.onError(() => {
      this._playingPool = this._playingPool.filter(a => a !== audio)
    })
    this.sounds[name] = { audio, src }
  }

  play(name) {
    if (!this.enabled) return
    const s = this.sounds[name]
    if (!s) return
    // 创建新的 audio 实例以支持重叠播放
    const audio = wx.createInnerAudioContext()
    audio.src = s.src
    audio.onEnded(() => {
      audio.destroy()
      this._playingPool = this._playingPool.filter(a => a !== audio)
    })
    audio.onError(() => {
      audio.destroy()
      this._playingPool = this._playingPool.filter(a => a !== audio)
    })
    this._playingPool.push(audio)
    audio.play()
  }

  setEnabled(enabled) {
    this.enabled = enabled
  }

  toggle() {
    this.enabled = !this.enabled
    Storage.set('settings.soundEnabled', this.enabled)
    return this.enabled
  }
}

window.AudioManager = new AudioManagerClass()
