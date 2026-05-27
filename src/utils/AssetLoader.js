class AssetLoaderClass {
  constructor() {
    this._cache = {}
    this._baseUrl = ''
    this._useCloud = false
  }

  init() {
    if (wx.cloud && wx.cloud.getTempFileURL) {
      this._useCloud = true
    }
  }

  setBaseUrl(url) {
    this._baseUrl = url
  }

  loadImage(key, cloudPath, fallbackDraw) {
    return new Promise((resolve) => {
      if (this._cache[key]) {
        resolve(this._cache[key])
        return
      }

      if (this._useCloud && cloudPath) {
        wx.cloud.downloadFile({
          fileID: cloudPath,
          success: (res) => {
            const img = wx.createImage()
            img.src = res.tempFilePath
            img.onload = () => {
              this._cache[key] = img
              resolve(img)
            }
            img.onerror = () => {
              resolve(fallbackDraw || null)
            }
          },
          fail: () => {
            resolve(fallbackDraw || null)
          }
        })
      } else {
        resolve(fallbackDraw || null)
      }
    })
  }

  loadAudio(key, cloudPath) {
    return new Promise((resolve) => {
      if (this._cache[key]) {
        resolve(this._cache[key])
        return
      }

      if (this._useCloud && cloudPath) {
        wx.cloud.downloadFile({
          fileID: cloudPath,
          success: (res) => {
            const audio = wx.createInnerAudioContext()
            audio.src = res.tempFilePath
            this._cache[key] = audio
            resolve(audio)
          },
          fail: () => {
            resolve(null)
          }
        })
      } else {
        resolve(null)
      }
    })
  }

  precache(manifest) {
    return Promise.all(
      manifest.map(item => {
        if (item.type === 'image') {
          return this.loadImage(item.key, item.cloudPath, item.fallback)
        } else if (item.type === 'audio') {
          return this.loadAudio(item.key, item.cloudPath)
        }
        return Promise.resolve(null)
      })
    )
  }

  get(key) {
    return this._cache[key] || null
  }

  clear(key) {
    if (key) {
      delete this._cache[key]
    } else {
      this._cache = {}
    }
  }
}

window.AssetLoader = new AssetLoaderClass()
