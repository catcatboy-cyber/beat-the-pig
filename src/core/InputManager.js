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
    this._lastTouch = null
    this._touchGraceUntil = 0
    this._touchGraceMs = 90
    this._touchGraceFrames = 0
    this._mouseDown = false
  }

  init(canvas) {
    wx.onTouchStart((e) => {
      const now = Date.now()
      this._startPointers(e.touches || [], now)
      this._syncTouches(e.touches || [])
      this._justPressed = true
    })

    wx.onTouchMove((e) => {
      this._movePointers(e.touches || [])
      this._syncTouches(e.touches || [])
    })

    wx.onTouchEnd((e) => {
      this._endPointers(e.changedTouches || [], e.touches || [])
    })

    wx.onTouchCancel((e) => {
      this._cancelPointers(e.changedTouches || [], e.touches || [])
    })

    this._initMouseFallback(canvas)
  }

  _initMouseFallback(canvas) {
    const start = (e) => {
      this._mouseDown = true
      const point = this._mouseEventToTouch(e)
      this._startPointers([point], Date.now())
      this._syncTouches([point])
      this._justPressed = true
    }
    const move = (e) => {
      if (!this._mouseDown) return
      const point = this._mouseEventToTouch(e)
      this._movePointers([point])
      this._syncTouches([point])
    }
    const end = (e) => {
      if (!this._mouseDown) return
      this._mouseDown = false
      this._endPointers([this._mouseEventToTouch(e)], [])
    }

    if (typeof wx.onMouseDown === 'function') wx.onMouseDown(start)
    if (typeof wx.onMouseMove === 'function') wx.onMouseMove(move)
    if (typeof wx.onMouseUp === 'function') wx.onMouseUp(end)

    if (canvas && typeof canvas.addEventListener === 'function') {
      canvas.addEventListener('mousedown', start)
      canvas.addEventListener('mousemove', move)
      canvas.addEventListener('mouseup', end)
      canvas.addEventListener('mouseleave', end)
    }
  }

  _mouseEventToTouch(e) {
    return {
      identifier: 'mouse',
      clientX: e.clientX != null ? e.clientX : (e.x || 0),
      clientY: e.clientY != null ? e.clientY : (e.y || 0)
    }
  }

  _touchId(t, index) {
    if (t.identifier !== undefined && t.identifier !== null) return t.identifier
    if (t.id !== undefined && t.id !== null) return t.id
    return 'touch_' + index
  }

  _touchPoint(t, index) {
    return {
      id: this._touchId(t, index),
      x: t.clientX != null ? t.clientX : (t.x != null ? t.x : (t.pageX || 0)),
      y: t.clientY != null ? t.clientY : (t.y != null ? t.y : (t.pageY || 0))
    }
  }

  _startPointers(list, now) {
    for (let i = 0; i < list.length; i++) {
      const p = this._touchPoint(list[i], i)
      this.activeTouches[p.id] = true
      this.startPos[p.id] = { x: p.x, y: p.y }
      this.startTime[p.id] = now
      this.prevPos[p.id] = { x: p.x, y: p.y }
      this.moveDelta[p.id] = { dx: 0, dy: 0 }
      this.swipeVelocity[p.id] = { vx: 0, vy: 0 }
      this.circleHistory[p.id] = []
      this._lastTouch = { id: p.id, x: p.x, y: p.y, startX: p.x, startY: p.y }
    }
    if (list.length > 0) this._touchGraceUntil = 0
    if (list.length > 0) this._touchGraceFrames = 0
  }

  _movePointers(list) {
    const now = Date.now()
    for (let i = 0; i < list.length; i++) {
      const p = this._touchPoint(list[i], i)
      if (!this.startPos[p.id]) {
        this.startPos[p.id] = { x: p.x, y: p.y }
        this.startTime[p.id] = now
      }
      if (this.prevPos[p.id]) {
        const dx = p.x - this.prevPos[p.id].x
        const dy = p.y - this.prevPos[p.id].y
        this.moveDelta[p.id] = { dx, dy }
        this.swipeVelocity[p.id] = { vx: dx, vy: dy }
      }
      this.prevPos[p.id] = { x: p.x, y: p.y }
      if (this.circleHistory[p.id]) {
        this.circleHistory[p.id].push({ x: p.x, y: p.y, time: now })
        if (this.circleHistory[p.id].length > 60) this.circleHistory[p.id].shift()
      }
    }
  }

  _endPointers(changedList, remainingList) {
    const now = Date.now()
    for (let i = 0; i < changedList.length; i++) {
      const p = this._touchPoint(changedList[i], i)
      const start = this.startPos[p.id]
      const prev = this.prevPos[p.id]
      if (start && prev) {
        const totalDx = p.x - start.x
        const totalDy = p.y - start.y
        const dist = Math.sqrt(totalDx * totalDx + totalDy * totalDy)
        const duration = now - this._touchStartTime(p.id)
        if (dist < 10 && duration < 300) {
          this._fireTap({ x: p.x, y: p.y })
        }
      }

      const history = this.circleHistory[p.id]
      if (history && this._detectCircle(history)) {
        this._fireCircle({ x: p.x, y: p.y })
      }

      this._lastTouch = {
        id: p.id,
        x: p.x,
        y: p.y,
        startX: start ? start.x : p.x,
        startY: start ? start.y : p.y
      }
      this._touchGraceUntil = now + this._touchGraceMs
      this._touchGraceFrames = 2
      this._clearPointer(p.id)
    }
    this._syncTouches(remainingList)
  }

  _cancelPointers(changedList, remainingList) {
    for (let i = 0; i < changedList.length; i++) {
      const p = this._touchPoint(changedList[i], i)
      this._clearPointer(p.id)
    }
    this._syncTouches(remainingList)
  }

  _clearPointer(id) {
    delete this.activeTouches[id]
    delete this.startPos[id]
    delete this.startTime[id]
    delete this.prevPos[id]
    delete this.moveDelta[id]
    delete this.swipeVelocity[id]
    delete this.circleHistory[id]
  }

  _syncTouches(list) {
    this.touches = []
    for (let i = 0; i < list.length; i++) {
      const p = this._touchPoint(list[i], i)
      const start = this.startPos[p.id] || { x: p.x, y: p.y }
      const touch = {
        id: p.id,
        x: p.x,
        y: p.y,
        startX: start.x,
        startY: start.y
      }
      this.touches.push(touch)
    }
    if (this.touches.length > 0) {
      this._lastTouch = this.touches[0]
      this._touchGraceUntil = 0
      this._touchGraceFrames = 0
    }
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
    if (this.touches[0]) return this.touches[0]
    if (this._lastTouch && (this._touchGraceFrames > 0 || Date.now() <= this._touchGraceUntil)) return this._lastTouch
    return this.touches[0] || null
  }

  getTouchDelta(id) {
    return this.moveDelta[id] || { dx: 0, dy: 0 }
  }

  isTouching() {
    return this.touches.length > 0 ||
      (this._lastTouch && (this._touchGraceFrames > 0 || Date.now() <= this._touchGraceUntil))
  }

  justPressed() {
    return this._justPressed
  }

  update() {
    this._justPressed = false
    if (this.touches.length === 0 && this._touchGraceFrames > 0) {
      this._touchGraceFrames--
    }
    if (this.touches.length === 0 && this._lastTouch && Date.now() > this._touchGraceUntil) {
      if (this._touchGraceFrames <= 0) this._lastTouch = null
    }
  }
}

window.InputManager = new InputManagerClass()
