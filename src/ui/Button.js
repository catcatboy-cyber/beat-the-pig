class Button {
  constructor(x, y, w, h, text, color, callback) {
    this.x = x
    this.y = y
    this.width = w
    this.height = h
    this.text = text
    this.color = color || '#ffc85b'
    this.callback = callback
    this._pressed = false
    this._pressAnim = 0

    // Map neon colors to paper palette
    this._paperBg = this._mapColor(color)
  }

  _mapColor(hex) {
    if (!hex) return Theme.gold
    // Strip alpha/rgba for mapping
    if (hex.indexOf('rgba') === 0 || hex.indexOf('rgb') === 0) return Theme.paperCream
    switch (hex.toUpperCase()) {
      case '#FF3860': return Theme.gold       // primary → gold
      case '#00D4FF': return Theme.teal       // secondary → teal
      case '#FFB800': return Theme.gold       // reward → gold
      case '#7B68EE': return Theme.ink        // purple → ink
      case '#9E9E9E': return Theme.paperCream // gray → cream
      case '#39FF14': return Theme.teal       // green → teal
      case '#B44CF0': return Theme.ink        // special → ink
      default: return Theme.gold
    }
  }

  _getTextColor() {
    if (this._paperBg === Theme.gold || this._paperBg === Theme.paperCream) {
      return Theme.ink
    }
    return Theme.paperWhite
  }

  containsPoint(px, py) {
    return px >= this.x - this.width / 2 &&
           px <= this.x + this.width / 2 &&
           py >= this.y - this.height / 2 &&
           py <= this.y + this.height / 2
  }

  onTap(px, py) {
    if (this.containsPoint(px, py) && this.callback) {
      this._pressed = true
      this._pressAnim = 1
      setTimeout(() => {
        this._pressed = false
        this._pressAnim = 0
        this.callback()
      }, 100)
      return true
    }
    return false
  }

  update(dt) {
    if (!this._pressed) {
      this._pressAnim *= 0.78
    }
  }

  render(ctx) {
    ctx.save()
    ctx.translate(this.x, this.y)

    var hw = this.width / 2
    var hh = this.height / 2
    var r = 14
    var shadowOff = (1 - this._pressAnim) * Theme.shadowOffset
    var pressY = this._pressAnim * 2

    // Shadow (hard offset)
    ctx.fillStyle = 'rgba(75, 53, 40, 0.22)'
    ctx.beginPath()
    ctx.roundRect(-hw + shadowOff, -hh + shadowOff + pressY, this.width, this.height, [r])
    ctx.fill()

    // Fill
    ctx.fillStyle = this._paperBg
    ctx.beginPath()
    ctx.roundRect(-hw, -hh + pressY, this.width, this.height, [r])
    ctx.fill()

    // Border
    ctx.strokeStyle = Theme.ink
    ctx.lineWidth = Theme.borderWidth
    ctx.beginPath()
    ctx.roundRect(-hw, -hh + pressY, this.width, this.height, [r])
    ctx.stroke()

    // Inner highlight line (top edge, paper fold effect)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(-hw + 4, -hh + 3 + pressY, this.width - 8, this.height - 6, [r - 2])
    ctx.stroke()

    // Text
    var textColor = this._getTextColor()
    ctx.fillStyle = textColor
    ctx.font = 'bold ' + Screen.scale(14) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.text, 0, 1 + pressY)

    ctx.restore()
  }
}

window.Button = Button
