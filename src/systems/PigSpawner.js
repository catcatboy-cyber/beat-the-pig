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
    this._pendingMudThrows = []
  }

  initLevel(levelConfig) {
    this.pool.releaseAll()
    this._activePigs = []
    this._pendingMudThrows = []
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
    HUD.setWave(index + 1)
  }

  update(dt) {
    // 更新洞口
    for (const hole of this.holes) {
      hole.update(dt)
    }

    // 生成小猪（Boss 出场前）
    if (this.waveActive && !this.bossSpawned) {
      this.spawnTimer += dt
      const limit = this.bossConfig ? 8 : 15
      while (this.spawnTimer >= this.spawnInterval && this.wavePigSpawned < this.wavePigCount && this._activePigs.length < limit) {
        this.spawnTimer -= this.spawnInterval
        this._spawnPig()
      }
      // 本波小猪刷完后，有 Boss 则出 Boss
      if (this.wavePigSpawned >= this.wavePigCount) {
        if (this.bossConfig && !this.bossSpawned) {
          this._spawnBoss()
        } else if (this._activePigs.length === 0) {
          this.currentWave++
          this._startWave(this.currentWave)
        }
      }
    }

    // Boss 出场后：等 Boss 被清掉再推进下一波
    if (this.waveActive && this.bossSpawned && this._activePigs.length === 0) {
      this.currentWave++
      this._startWave(this.currentWave)
    }

    // 非刷怪期：检查是否所有猪都处理完了
    if (!this.waveActive && !this.allWavesDone && this._activePigs.length === 0) {
      this.currentWave++
      this._startWave(this.currentWave)
    }

    // 更新小猪 + 处理特殊能力
    for (let i = this._activePigs.length - 1; i >= 0; i--) {
      const pig = this._activePigs[i]
      pig.update(dt)

      if (pig._shouldSplit) {
        this._handleSplit(pig)
        this._activePigs.splice(i, 1)
        this.pool.release(pig)
        continue
      }
      if (pig._shouldExplode) {
        this._handleExplode(pig)
        this._activePigs.splice(i, 1)
        this.pool.release(pig)
        continue
      }
      if (pig._cloneReady) {
        this._spawnClonePig(pig)
        pig._cloneReady = false
      }
      if (pig._mudThrowReady) {
        this._pendingMudThrows.push({ x: pig.x, y: pig.y })
        pig._mudThrowReady = false
      }

      if (!pig.alive && !pig.escaped) {
        this._activePigs.splice(i, 1)
        this.pool.release(pig)
      }
    }

    // 哭包猪阻挡：crying 的猪挡住后方（上方）的猪
    for (const pig of this._activePigs) {
      if (pig._crying && pig.state === PIG_STATE.WALKING) {
        for (const other of this._activePigs) {
          if (other !== pig && other.state === PIG_STATE.WALKING && !other._crying) {
            if (other.y + other.height / 2 < pig.y - pig.height / 2 &&
                Math.abs(other.x - pig.x) < pig.width * 1.5) {
              var blockY = pig.y - pig.height / 2 - other.height / 2
              if (other.y + other.height / 2 > blockY) {
                other.y = blockY
              }
            }
          }
        }
      }
    }
  }

  _pickPigName() {
    var hitList = Storage.getHitList()
    if (hitList.length > 0 && Math.random() < 0.7) {
      return Random.pick(hitList).name
    }
    return Storage.getNickname() || '小猪'
  }

  _spawnPig() {
    if (this.holes.length === 0) return
    const hole = Random.pick(this.holes)
    const pos = hole.getSpawnPos()
    const typeInfo = Random.weightedPick(this.waveTypes)
    const pig = this.pool.acquire()
    pig.init(typeInfo.id, pos.x, pos.y, hole.index, this._pickPigName())
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

  _handleSplit(pig) {
    var halfSize = pig.typeConfig.size / 2
    for (var i = 0; i < 2; i++) {
      var sx = pig.x + (i === 0 ? -halfSize : halfSize)
      var sy = pig.y - 10
      var child = this.pool.acquire()
      child.init('normal', Math.max(20, Math.min(Screen.gameWidth - 20, sx)), sy, pig.holeIndex)
      child.width = halfSize
      child.height = halfSize
      child.hp = 30
      child.maxHp = 30
      child.speed = child.typeConfig.speed * 1.3
      child.nickname = '小' + pig.nickname
      this._activePigs.push(child)
    }
  }

  _handleExplode(pig) {
    ParticleSystem.emitExplosion(pig.x, pig.y)
    this.damageInRadius(pig.x, pig.y, 120, 200)
  }

  _spawnClonePig(pig) {
    var offsetX = (Math.random() - 0.5) * 80
    var clone = this.pool.acquire()
    clone.init(pig.type, pig.x + offsetX, pig.y - 30, pig.holeIndex)
    clone.hp = 1
    clone.maxHp = 1
    clone._isClone = true
    clone.nickname = pig.nickname + '(伪)'
    this._activePigs.push(clone)
  }

  spawnPigAt(typeId, x, y, holeIndex, nickname) {
    var pig = this.pool.acquire()
    pig.init(typeId || 'normal', x, y, holeIndex !== undefined ? holeIndex : 0, nickname)
    this._activePigs.push(pig)
    return pig
  }

  damageInRadius(cx, cy, radius, damage) {
    for (var i = this._activePigs.length - 1; i >= 0; i--) {
      var pig = this._activePigs[i]
      if (!pig.alive || pig._isClone) continue
      var dx = pig.x - cx
      var dy = pig.y - cy
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        pig.hp -= damage
        if (pig.hp <= 0 && pig.state !== PIG_STATE.DEAD) {
          pig.state = PIG_STATE.DEAD
        }
      }
    }
  }

  getPendingMudThrows() {
    var result = this._pendingMudThrows.slice()
    this._pendingMudThrows = []
    return result
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
