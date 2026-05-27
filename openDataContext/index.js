var canvas = wx.getSharedCanvas()
var ctx = canvas.getContext('2d')

ctx.fillStyle = '#1a1a2e'
ctx.fillRect(0, 0, canvas.width, canvas.height)
ctx.fillStyle = '#FFD700'
ctx.font = 'bold 16px sans-serif'
ctx.textAlign = 'center'
ctx.fillText('好友排行榜', canvas.width / 2, canvas.height / 2)
