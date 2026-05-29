class Match3EngineClass {
  constructor() {
    this.rows = 8
    this.cols = 8
    this.grid = []
    this.weaponIds = ['broom', 'hammer', 'swatter', 'taser', 'slipper', 'rocket', 'machinegun', 'poop']
    this.comboCount = 0
  }

  init() {
    this.comboCount = 0
    for (var r = 0; r < this.rows; r++) {
      this.grid[r] = []
      for (var c = 0; c < this.cols; c++) {
        this.grid[r][c] = this._pickSafe(r, c)
      }
    }
    if (!this.hasValidMoves()) this.init()
  }

  _pickSafe(row, col) {
    var forbidden = {}
    if (col >= 2 && this.grid[row][col - 1] === this.grid[row][col - 2]) {
      forbidden[this.grid[row][col - 1]] = true
    }
    if (row >= 2 && this.grid[row - 1] && this.grid[row - 1][col] === this.grid[row - 2][col]) {
      forbidden[this.grid[row - 1][col]] = true
    }
    var safe = []
    for (var i = 0; i < this.weaponIds.length; i++) {
      if (!forbidden[this.weaponIds[i]]) safe.push(this.weaponIds[i])
    }
    if (safe.length === 0) return this.weaponIds[Math.floor(Math.random() * this.weaponIds.length)]
    return safe[Math.floor(Math.random() * safe.length)]
  }

  findMatches() {
    var groups = []
    var matched = {}

    // Horizontal
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols - 2; c++) {
        var id = this.grid[r][c]
        if (!id) continue
        var count = 1
        while (c + count < this.cols && this.grid[r][c + count] === id) count++
        if (count >= 3) {
          var cells = []
          for (var i = 0; i < count; i++) {
            cells.push({ r: r, c: c + i })
            matched[r + ',' + (c + i)] = true
          }
          groups.push({ weaponId: id, cells: cells, count: count, shape: count >= 5 ? 'five' : count === 4 ? 'four' : 'three' })
          c += count - 1
        }
      }
    }

    // Vertical
    for (var c = 0; c < this.cols; c++) {
      for (var r = 0; r < this.rows - 2; r++) {
        var id = this.grid[r][c]
        if (!id) continue
        var count = 1
        while (r + count < this.rows && this.grid[r + count][c] === id) count++
        if (count >= 3) {
          var cells = []
          for (var i = 0; i < count; i++) {
            cells.push({ r: r + i, c: c })
            matched[(r + i) + ',' + c] = true
          }
          groups.push({ weaponId: id, cells: cells, count: count, shape: count >= 5 ? 'five' : count === 4 ? 'four' : 'three' })
          r += count - 1
        }
      }
    }

    // Merge T/L shapes: cells that appear in multiple groups → mark as special
    var cellGroupCount = {}
    for (var g = 0; g < groups.length; g++) {
      for (var ci = 0; ci < groups[g].cells.length; ci++) {
        var key = groups[g].cells[ci].r + ',' + groups[g].cells[ci].c
        cellGroupCount[key] = (cellGroupCount[key] || 0) + 1
      }
    }
    for (var g2 = 0; g2 < groups.length; g2++) {
      for (var ci2 = 0; ci2 < groups[g2].cells.length; ci2++) {
        if (cellGroupCount[groups[g2].cells[ci2].r + ',' + groups[g2].cells[ci2].c] > 1) {
          groups[g2].shape = 'special'
        }
      }
    }

    return groups
  }

  removeMatches(matches) {
    var results = []
    for (var m = 0; m < matches.length; m++) {
      var match = matches[m]
      for (var ci = 0; ci < match.cells.length; ci++) {
        this.grid[match.cells[ci].r][match.cells[ci].c] = null
      }
      var mult = match.shape === 'five' || match.shape === 'special' ? 3 : match.shape === 'four' ? 2 : 1
      results.push({ weaponId: match.weaponId, count: match.count, multiplier: mult, shape: match.shape })
    }
    return results
  }

  applyGravity() {
    for (var c = 0; c < this.cols; c++) {
      var writeRow = this.rows - 1
      for (var r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== null) {
          this.grid[writeRow][c] = this.grid[r][c]
          writeRow--
        }
      }
      for (var r = writeRow; r >= 0; r--) {
        this.grid[r][c] = this.weaponIds[Math.floor(Math.random() * this.weaponIds.length)]
      }
    }
  }

  canSwap(r1, c1, r2, c2) {
    var dr = Math.abs(r1 - r2)
    var dc = Math.abs(c1 - c2)
    if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) return false

    var tmp = this.grid[r1][c1]
    this.grid[r1][c1] = this.grid[r2][c2]
    this.grid[r2][c2] = tmp

    var matches = this.findMatches()

    this.grid[r2][c2] = this.grid[r1][c1]
    this.grid[r1][c1] = tmp

    return matches.length > 0
  }

  swap(r1, c1, r2, c2) {
    var tmp = this.grid[r1][c1]
    this.grid[r1][c1] = this.grid[r2][c2]
    this.grid[r2][c2] = tmp
  }

  hasValidMoves() {
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        if (c < this.cols - 1 && this.canSwap(r, c, r, c + 1)) return true
        if (r < this.rows - 1 && this.canSwap(r, c, r + 1, c)) return true
      }
    }
    return false
  }

  shuffle() {
    this.init()
    var attempts = 0
    while (!this.hasValidMoves() && attempts < 20) {
      this.init()
      attempts++
    }
  }
}

window.Match3Engine = new Match3EngineClass()
