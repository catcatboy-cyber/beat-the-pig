class InputManagerClass {
  constructor() {
    this.touches = []
    this.activeTouches = {}
    this.startPos = {}
    this.startTime = {}
    this.moveDelta = {}
    this.prevPos = {}
    this.swipeVelocity = {}
    this.gestures = {}
    this.tapCallbacks = []
    this.swipeCallbacks = []
    this.circleCallbacks = []
    this.circleHistory = {}
    this._justPressed = false
  }

  init(canvas) {
    wx.onTouchStart((e) => {
      const now = Date.now()
      for (const t of e.touches) {
        this.activeTouches[t.identifier] = true
        this.startPos[t.identifier] = { x: t.clientX, y: t.clientY }
        this.startTime[t.identifier] = now
        this.prevPos[t.identifier] = { x: t.clientX, y: t.clientY }
        this.moveDelta[t.identifier] = { dx: 0, dy: 0 }
        this.swipeVelocity[t.identifier] = { vx: 0, vy: 0 }
        this.circleHistory[t.identifier] = []
      }
      this.touches = e.touches.map(t => ({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        startX: this.startPos[t.identifier].x,
        startY: this.startPos[t.identifier].y
      }))
      this._justPressed = true
    })

    wx.onTouchMove((e) => {
      for (const t of e.touches) {
        if (this.prevPos[t.identifier]) {
          const dx = t.clientX - this.prevPos[t.identifier].x
          const dy = t.clientY - this.prevPos[t.identifier].y
          this.moveDelta[t.identifier] = { dx, dy }
          this.swipeVelocity[t.identifier] = {
            vx: dx,
            vy: dy
          }
          this.prevPos[t.identifier] = { x: t.clientX, y: t.clientY }
        }
        // 画圈检测
        if (this.circleHistory[t.identifier]) {
          this.circleHistory[t.identifier].push({
            x: t.clientX,
            y: t.clientY,
            time: Date.now()
          })
          if (this.circleHistory[t.identifier].length > 60) {
            this.circleHistory[t.identifier].shift()
          }
        }
      }
      this.touches = e.touches.map(t => ({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        startX: this.startPos[t.identifier] ? this.startPos[t.identifier].x : t.clientX,
        startY: this.startPos[t.identifier] ? this.startPos[t.identifier].y : t.clientY
      }))
    })

    wx.onTouchEnd((e) => {
      for (const t of e.changedTouches) {
        const start = this.startPos[t.identifier]
        const prev = this.prevPos[t.identifier]
        if (start && prev) {
          const totalDx = t.clientX - start.x
          const totalDy = t.clientY - start.y
          const dist = Math.sqrt(totalDx * totalDx + totalDy * totalDy)
          const duration = Date.now() - this._touchStartTime(t.identifier)

          if (dist < 10 && duration < 300) {
            // Tap
            this._fireTap({ x: t.clientX, y: t.clientY })
          }
        }

        // 画圈检测
        const history = this.circleHistory[t.identifier]
        if (history && this._detectCircle(history)) {
          this._fireCircle({ x: t.clientX, y: t.clientY })
        }

        delete this.activeTouches[t.identifier]
        delete this.startPos[t.identifier]
        delete this.prevPos[t.identifier]
        delete this.moveDelta[t.identifier]
        delete this.swipeVelocity[t.identifier]
        delete this.circleHistory[t.identifier]
      }
      this.touches = []
    })

    wx.onTouchCancel((e) => {
      for (const t of e.changedTouches) {
        delete this.activeTouches[t.identifier]
        delete this.startPos[t.identifier]
        delete this.prevPos[t.identifier]
        delete this.moveDelta[t.identifier]
        delete this.swipeVelocity[t.identifier]
        delete this.circleHistory[t.identifier]
      }
      this.touches = []
    })
  }

  _touchStartTime(id) {
    return this.startTime[id] || Date.now()
  }

  _detectCircle(history) {
    if (history.length < 20) return false
    // 简单画圈检测：轨迹围绕中心点旋转超过 360 度
    const recent = history.slice(-30)
    let cx = 0, cy = 0
    for (const p of recent) {
      cx += p.x
      cy += p.y
    }
    cx /= recent.length
    cy /= recent.length

    let totalAngle = 0
    let prevAngle = null
    for (const p of recent) {
      const angle = Math.atan2(p.y - cy, p.x - cx)
      if (prevAngle !== null) {
        let dAngle = angle - prevAngle
        if (dAngle > Math.PI) dAngle -= 2 * Math.PI
        if (dAngle < -Math.PI) dAngle += 2 * Math.PI
        totalAngle += dAngle
      }
      prevAngle = angle
    }
    return Math.abs(totalAngle) > Math.PI * 1.8
  }

  _fireTap(pos) {
    for (const cb of this.tapCallbacks) {
      cb(pos)
    }
  }

  _fireCircle(pos) {
    for (const cb of this.circleCallbacks) {
      cb(pos)
    }
  }

  onTap(callback) { this.tapCallbacks.push(callback) }
  onCircle(callback) { this.circleCallbacks.push(callback) }

  getPrimaryTouch() {
    return this.touches[0] || null
  }

  getTouchDelta(id) {
    return this.moveDelta[id] || { dx: 0, dy: 0 }
  }

  isTouching() {
    return this.touches.length > 0
  }

  justPressed() {
    return this._justPressed
  }

  update() {
    this._justPressed = false
  }
}

window.InputManager = new InputManagerClass()
