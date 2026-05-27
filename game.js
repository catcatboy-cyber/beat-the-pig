// 微信小游戏真机不是浏览器环境，部分机型/基础库没有 window 全局对象。
// 下面的兼容层必须放在所有 require 前面，因为各模块会把单例挂到 window 上。
var root = (typeof GameGlobal !== 'undefined')
  ? GameGlobal
  : (typeof globalThis !== 'undefined' ? globalThis : this)

if (typeof root.window === 'undefined') {
  root.window = root
}

if (typeof root.requestAnimationFrame === 'undefined' &&
    typeof wx !== 'undefined' &&
    typeof wx.requestAnimationFrame === 'function') {
  root.requestAnimationFrame = function (callback) {
    return wx.requestAnimationFrame(callback)
  }
}

if (typeof root.cancelAnimationFrame === 'undefined' &&
    typeof wx !== 'undefined' &&
    typeof wx.cancelAnimationFrame === 'function') {
  root.cancelAnimationFrame = function (id) {
    return wx.cancelAnimationFrame(id)
  }
}

require('./src/core/GameLoop.js')
require('./src/core/InputManager.js')
require('./src/core/SceneManager.js')
require('./src/core/ObjectPool.js')
require('./src/core/AudioManager.js')
require('./src/core/ParticleSystem.js')

require('./src/utils/Easing.js')
require('./src/utils/Screen.js')
require('./src/utils/Random.js')
require('./src/utils/Storage.js')
require('./src/utils/AssetLoader.js')
require('./src/utils/LogManager.js')

require('./src/data/DialogConfig.js')
require('./src/data/PigTypes.js')
require('./src/data/WeaponConfig.js')
require('./src/data/LevelConfig.js')
require('./src/data/ShopConfig.js')

require('./src/entities/Pig.js')
require('./src/entities/Weapon.js')
require('./src/entities/weapons/Broom.js')
require('./src/entities/weapons/Hammer.js')
require('./src/entities/weapons/FlySwatter.js')
require('./src/entities/weapons/Taser.js')
require('./src/entities/weapons/Slipper.js')
require('./src/entities/weapons/Rocket.js')
require('./src/entities/Hole.js')
require('./src/entities/DefenseLine.js')

require('./src/systems/PigSpawner.js')
require('./src/systems/CollisionSystem.js')
require('./src/systems/ComboSystem.js')
require('./src/systems/UpgradeSystem.js')
require('./src/systems/AdManager.js')

require('./src/ui/Theme.js')
require('./src/ui/Button.js')
require('./src/ui/HUD.js')
require('./src/ui/WeaponSwitcher.js')
require('./src/ui/DialogBubble.js')
require('./src/ui/DamageNumber.js')

require('./src/scenes/MenuScene.js')
require('./src/scenes/BattleScene.js')
require('./src/scenes/ShopScene.js')
require('./src/scenes/SettlementScene.js')

require('./src/cloud/Rank.js')
require('./src/cloud/UserData.js')
require('./src/cloud/Report.js')

// 启动诊断
try { wx.showLoading({ title: '加载中...' }) } catch (e) {}

// 全局错误捕获（必须在最前面注册）
if (typeof wx.onError === 'function') {
  wx.onError(function (msg) {
    var errMsg = (msg && msg.message) || msg || '未知错误'
    console.error('[Global Error]', errMsg)
    try { wx.hideLoading() } catch (e) {}
    wx.showModal({
      title: '出错了',
      content: String(errMsg).substring(0, 200),
      showCancel: false
    })
  })
}

// 云开发初始化（真机失败不影响游戏运行）
try {
  wx.cloud.init({
    env: 'cloud1-d6go1lm0x2709873f',
    traceUser: true
  })
  var db = wx.cloud.database()
  window.cloudDB = db
} catch (e) {
  console.warn('[Cloud] init failed:', e)
}

var canvas = wx.createCanvas()
var ctx = canvas.getContext('2d')

// roundRect polyfill（微信小游戏 WebKit 只支持数组 radii）
;(function () {
  try {
    ctx.roundRect = function (x, y, w, h, r) {
      var radii = r
      if (typeof r === 'number') {
        radii = { tl: r, tr: r, br: r, bl: r }
      } else if (r && typeof r === 'object' && !Array.isArray(r)) {
        radii = r
      } else if (Array.isArray(r)) {
        radii = { tl: r[0], tr: r[1] || r[0], br: r[2] || r[0], bl: r[3] || r[1] || r[0] }
      }
      this.beginPath()
      this.moveTo(x + radii.tl, y)
      this.lineTo(x + w - radii.tr, y)
      this.quadraticCurveTo(x + w, y, x + w, y + radii.tr)
      this.lineTo(x + w, y + h - radii.br)
      this.quadraticCurveTo(x + w, y + h, x + w - radii.br, y + h)
      this.lineTo(x + radii.bl, y + h)
      this.quadraticCurveTo(x, y + h, x, y + h - radii.bl)
      this.lineTo(x, y + radii.tl)
      this.quadraticCurveTo(x, y, x + radii.tl, y)
      this.closePath()
      return this
    }
  } catch (e) {
    // polyfill 失败，调用方回退到普通 rect
  }
})()

// 注册场景
SceneManager.register('menu', MenuScene)
SceneManager.register('battle', BattleScene)
SceneManager.register('shop', ShopScene)
SceneManager.register('settlement', SettlementScene)

try {
  GameLoop.init(canvas, ctx)
  InputManager.init(canvas)
  Screen.init(canvas)
  SceneManager.init(ctx)
  Storage.init()
  AdManager.init()
  AudioManager.init()
  AssetLoader.init()
  LogManager.init()

  SceneManager.switchTo('menu')
  GameLoop.start()
  try { wx.hideLoading() } catch (e) {}
} catch (e) {
  console.error('[Init Error]', e)
  try { wx.hideLoading() } catch (e2) {}
  wx.showModal({
    title: '初始化失败',
    content: (e && e.message) || String(e),
    showCancel: false
  })
}
