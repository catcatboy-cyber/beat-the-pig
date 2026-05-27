class ScreenUtil {
  constructor() {
    this.width = 0
    this.height = 0
    this.safeAreaTop = 0
    this.safeAreaBottom = 0
    this.dpr = 1
    this.designWidth = 375
    this.designHeight = 667
    this.scaleX = 1
    this.scaleY = 1
  }

  init(canvas) {
    const sysInfo = wx.getSystemInfoSync()
    this.width = sysInfo.screenWidth
    this.height = sysInfo.screenHeight
    this.dpr = sysInfo.pixelRatio
    this.safeAreaTop = sysInfo.safeArea ? sysInfo.safeArea.top : 0
    this.safeAreaBottom = sysInfo.safeArea
      ? sysInfo.screenHeight - sysInfo.safeArea.bottom
      : 0

    canvas.width = this.width * this.dpr
    canvas.height = this.height * this.dpr

    this.scaleX = this.width / this.designWidth
    this.scaleY = this.height / this.designHeight
  }

  scale(value) {
    return value * Math.min(this.scaleX, this.scaleY)
  }

  get gameWidth() {
    return this.width
  }
  get gameHeight() {
    return this.height
  }
}

window.Screen = new ScreenUtil()
