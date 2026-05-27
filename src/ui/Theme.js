/**
 * 纸片玩具 (Paper Toy) Design Tokens
 * 方案C — 手作/轻幽默/高完成度
 */
const Theme = {
  // ── Ink & Paper ──
  ink: '#4b3528',
  inkLight: '#8a6d55',
  paper: '#fff7de',
  paperDark: '#f5edd1',
  paperCream: '#fffdf2',
  paperWhite: '#fffef2',

  // ── Accent ──
  gold: '#ffc85b',
  goldDark: '#d4a33a',
  teal: '#3f8f7a',
  tealDark: '#2d6b5a',
  red: '#e05555',
  redDark: '#b04040',

  // ── Pig ──
  pig: '#ef9a8d',
  pigNose: '#ffd0c4',

  // ── UI ──
  borderWidth: 2,
  borderRadius: 10,
  shadowOffset: 4,
  shadowAlpha: 0.24,
  gridColor: 'rgba(75, 63, 49, 0.06)',
  gridSize: 20,

  // ── Pill colors ──
  pillBg: '#fffef2',
  pillBorder: '#cbb889',
  pillText: '#4d3524'
}

// ── Shared Drawing Helpers ──

/** Draw paper-style background with grid */
Theme.drawBackground = function (ctx) {
  var grad = ctx.createLinearGradient(0, 0, 0, Screen.gameHeight)
  grad.addColorStop(0, Theme.paper)
  grad.addColorStop(1, Theme.paperDark)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, Screen.gameWidth, Screen.gameHeight)

  // Grid lines
  ctx.strokeStyle = Theme.gridColor
  ctx.lineWidth = 0.5
  var gs = Theme.gridSize
  for (var gx = 0; gx < Screen.gameWidth; gx += gs) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, Screen.gameHeight)
    ctx.stroke()
  }
  for (var gy = 0; gy < Screen.gameHeight; gy += gs) {
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(Screen.gameWidth, gy)
    ctx.stroke()
  }
}

/**
 * Draw a paper card: shadow → fill → border
 * options: { fill, border, shadowColor, shadowOffset, radius, alpha }
 */
Theme.drawPaperCard = function (ctx, x, y, w, h, options) {
  var opt = options || {}
  var fill = opt.fill || Theme.paperWhite
  var border = opt.border || Theme.ink
  var shadowColor = opt.shadowColor || Theme.ink
  var shadowOff = opt.shadowOffset != null ? opt.shadowOffset : Theme.shadowOffset
  var radius = opt.radius != null ? opt.radius : Theme.borderRadius
  var alpha = opt.alpha != null ? opt.alpha : 1

  ctx.save()
  ctx.globalAlpha = alpha

  // Shadow (hard offset)
  ctx.fillStyle = shadowColor.replace(')', ', ' + Theme.shadowAlpha + ')').replace('rgb', 'rgba')
  if (shadowColor.startsWith('#')) {
    ctx.fillStyle = 'rgba(75, 53, 40, ' + Theme.shadowAlpha + ')'
  }
  ctx.beginPath()
  ctx.roundRect(x + shadowOff, y + shadowOff, w, h, [radius])
  ctx.fill()

  // Fill
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, [radius])
  ctx.fill()

  // Border
  ctx.strokeStyle = border
  ctx.lineWidth = Theme.borderWidth
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, [radius])
  ctx.stroke()

  ctx.restore()
}

/**
 * Draw a paper pill/tag
 */
Theme.drawPill = function (ctx, x, y, text, options) {
  var opt = options || {}
  var active = opt.active || false
  var bg = active ? Theme.teal : (opt.bg || Theme.pillBg)
  var textColor = active ? Theme.paperWhite : (opt.textColor || Theme.pillText)
  var border = active ? Theme.teal : (opt.border || Theme.pillBorder)
  var radius = opt.radius != null ? opt.radius : 10
  var fontSize = opt.fontSize || 11

  ctx.font = 'bold ' + Screen.scale(fontSize) + 'px sans-serif'
  var textW = ctx.measureText(text).width
  var pillW = textW + 18
  var pillH = Screen.scale(26)

  if (opt.centerAlign) {
    x = x - pillW / 2
  }

  // Shadow
  ctx.fillStyle = 'rgba(75, 53, 40, 0.16)'
  ctx.beginPath()
  ctx.roundRect(x + 3, y + 3, pillW, pillH, [radius])
  ctx.fill()

  // Fill
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(x, y, pillW, pillH, [radius])
  ctx.fill()

  // Border
  ctx.strokeStyle = border
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(x, y, pillW, pillH, [radius])
  ctx.stroke()

  // Text
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + pillW / 2, y + pillH / 2 + 1)
}

window.Theme = Theme
