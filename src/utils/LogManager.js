class LogManagerClass {
  constructor() {
    this._rtm = null
    this._enabled = false
  }

  init() {
    try {
      this._rtm = wx.getRealtimeLogManager()
      if (this._rtm) {
        this._enabled = true
        this._rtm.info('LogManager initialized')
      }
    } catch (e) {
      this._enabled = false
    }

    this._hookErrors()
  }

  _hookErrors() {
    if (typeof wx.onError === 'function') {
      wx.onError((msg) => {
        this.error('Global Error', msg)
      })
    }
    if (typeof wx.onUnhandledRejection === 'function') {
      wx.onUnhandledRejection((res) => {
        this.error('Unhandled Rejection', res && res.reason)
      })
    }
  }

  info(tag, msg) {
    if (this._enabled && this._rtm) {
      this._rtm.info(`[${tag}]`, msg || '')
    }
    console.log(`[${tag}]`, msg || '')
  }

  warn(tag, msg) {
    if (this._enabled && this._rtm) {
      this._rtm.warn(`[${tag}]`, msg || '')
    }
    console.warn(`[${tag}]`, msg || '')
  }

  error(tag, msg) {
    if (this._enabled && this._rtm) {
      this._rtm.error(`[${tag}]`, msg || '')
    }
    console.error(`[${tag}]`, msg || '')
  }

  addFilterMsg(msg) {
    if (this._enabled && this._rtm) {
      this._rtm.addFilterMsg(msg)
    }
  }

  setFilterMsg(msg) {
    if (this._enabled && this._rtm) {
      this._rtm.setFilterMsg(msg)
    }
  }
}

window.LogManager = new LogManagerClass()
