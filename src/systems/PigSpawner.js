class PigSpawnerClass {
  constructor() {
    this.pool = new ObjectPool(
      () => new Pig(),
      (pig) => pig.reset(),
      25
    )
    this.holes = []
    this.waves = []
    this.currentWave = 0
    this.wavePigCount = 0
    this.wavePigSpawned = 0
    this.spawnTimer = 0
    this.spawnInterval = 1500
    this.waveTypes = []
    this.waveActive = false
    this.allWavesDone = false
    this.bossConfig = null
    this.bossSpawned = false

    this._activePigs = []
  }

  initLevel(levelConfig) {
    this.pool.releaseAll()
    this._activePigs = []
    this.waves = levelConfig.waves
    this.currentWave = 0
    this.wavePigCount = 0
    this.wavePigSpawned = 0
    this.spawnTimer = 0
    this.allWavesDone = false
    this.bossConfig = levelConfig.boss || null
    this.bossSpawned = false

    // 创建洞口
    this.holes = []
    for (let i = 0; i < levelConfig.holes; i++) {
      const hole = new Hole()
      hole.init(i, levelConfig.holes)
      this.holes.push(hole)
    }

    this._startWave(0)
  }

  _startWave(index) {
    if (index >= this.waves.length) {
      this.waveActive = false
      this.allWavesDone = true
      return
    }
    const wave = this.waves[index]
    this.waveActive = true
    this.wavePigCount = wave.pigs
    this.wavePigSpawned = 0
    this.spawnInterval = wave.interval * 1000
    this.spawnTimer = 0
    this.waveTypes = wave.types
  }

  update(dt) {
    // 更新洞口
    for (const hole of this.holes) {
      hole.update(dt)
    }

    // 生成小猪
    if (this.waveActive && !this.bossSpawned) {
      this.spawnTimer += dt
      const limit = this.bossConfig ? 8 : 15
      while (this.spawnTimer >= this.spawnInterval && this.wavePigSpawned < this.wavePigCount && this._activePigs.length < limit) {
        this.spawnTimer -= this.spawnInterval
        this._spawnPig()
      }
      if (this.wavePigSpawned >= this.wavePigCount) {
        // Boss 关：刷完小怪后出 Boss
        if (this.bossConfig && !this.bossSpawned) {
          this._spawnBoss()
        } else {
          // 检查是否所有猪都清完了
          if (this._activePigs.length === 0) {
            this.currentWave++
            this._startWave(this.currentWave)
          }
        }
      }
    }

    // 非刷怪期：检查是否所有猪都处理完了
    if (!this.waveActive && !this.allWavesDone && this._activePigs.length === 0) {
      this.currentWave++
      this._startWave(this.currentWave)
    }

    // 更新小猪
    for (let i = this._activePigs.length - 1; i >= 0; i--) {
      const pig = this._activePigs[i]
      pig.update(dt)
      if (!pig.alive && !pig.escaped) {
        this._activePigs.splice(i, 1)
        this.pool.release(pig)
      }
    }
  }

  _spawnPig() {
    if (this.holes.length === 0) return
    const hole = Random.pick(this.holes)
    const pos = hole.getSpawnPos()
    const typeInfo = Random.weightedPick(this.waveTypes)
    const pig = this.pool.acquire()
    pig.init(typeInfo.id, pos.x, pos.y, hole.index)
    this._activePigs.push(pig)
    this.wavePigSpawned++
  }

  _spawnBoss() {
    if (this.holes.length === 0) return
    // Boss 从中间洞口出
    const hole = this.holes[Math.floor(this.holes.length / 2)]
    const pos = hole.getSpawnPos()
    const pig = this.pool.acquire()
    pig.init(this.bossConfig.type, pos.x, pos.y, hole.index, '🐷Boss')
    pig.hp = this.bossConfig.hp
    pig.maxHp = this.bossConfig.hp
    this._activePigs.push(pig)
    this.bossSpawned = true
  }

  getActivePigs() {
    return this._activePigs
  }

  getEscapedPigs() {
    // 返回逃出防线的小猪，并回收
    const escaped = []
    for (let i = this._activePigs.length - 1; i >= 0; i--) {
      const pig = this._activePigs[i]
      if (pig.escaped) {
        escaped.push(pig)
        this._activePigs.splice(i, 1)
        this.pool.release(pig)
      }
    }
    return escaped
  }

  isWaveComplete() {
    return this.wavePigSpawned >= this.wavePigCount
      && this._activePigs.length === 0
  }

  startNextWave() {
    this.currentWave++
    this._startWave(this.currentWave)
  }

  isWaveActive() {
    return this.waveActive
  }

  isLevelComplete() {
    return this.allWavesDone
      && this._activePigs.length === 0
  }

  render(ctx) {
    for (const hole of this.holes) {
      hole.render(ctx)
    }
    for (const pig of this._activePigs) {
      pig.render(ctx)
    }
  }
}

window.PigSpawner = new PigSpawnerClass()
