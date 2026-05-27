class GameLoopClass {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.running = false
    this.lastTime = 0
    this.accumulator = 0
    this.fixedDt = 1000 / 60
    this.gameSpeed = 1.0
    this.hitStopTimer = 0
    this._rafId = null
  }

  init(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
  }

  start() {
    this.running = true
    this.lastTime = Date.now()
    this._loop()
  }

  stop() {
    this.running = false
    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  triggerHitStop(frames) {
    this.gameSpeed = 0.1
    this.hitStopTimer = frames || 3
  }

  _loop() {
    if (!this.running) return
    this._rafId = requestAnimationFrame(() => this._loop())

    const now = Date.now()
    let dt = now - this.lastTime
    this.lastTime = now

    // 防止大帧差
    if (dt > 100) dt = 100

    // Hit stop 处理
    if (this.hitStopTimer > 0) {
      this.hitStopTimer--
      if (this.hitStopTimer <= 0) {
        this.gameSpeed = 1.0
      }
    }

    const scaledDt = dt * this.gameSpeed

    this.ctx.save()
    this.ctx.scale(Screen.dpr, Screen.dpr)

    try {
      SceneManager.update(scaledDt)
      SceneManager.render(this.ctx)
    } catch (e) {
      console.error('[Frame Error]', e)
    }

    InputManager.update()

    this.ctx.restore()
  }
}

window.GameLoop = new GameLoopClass()
