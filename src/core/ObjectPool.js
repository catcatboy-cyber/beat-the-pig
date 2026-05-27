class ObjectPool {
  constructor(createFn, resetFn, initialSize) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []
    this.activeCount = 0
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn()
      obj._active = false
      this.pool.push(obj)
    }
  }

  acquire() {
    let obj = null
    for (const item of this.pool) {
      if (!item._active) {
        obj = item
        break
      }
    }
    if (!obj) {
      obj = this.createFn()
      this.pool.push(obj)
    }
    obj._active = true
    this.activeCount++
    this.resetFn(obj)
    return obj
  }

  release(obj) {
    if (obj._active) {
      obj._active = false
      this.activeCount--
    }
  }

  forEachActive(fn) {
    for (const item of this.pool) {
      if (item._active) fn(item)
    }
  }

  getActiveCount() {
    return this.activeCount
  }

  releaseAll() {
    for (const item of this.pool) {
      item._active = false
    }
    this.activeCount = 0
  }
}

window.ObjectPool = ObjectPool
