class SceneManagerClass {
  constructor() {
    this.ctx = null
    this.currentScene = null
    this.nextScene = null
    this.scenes = {}
  }

  init(ctx) {
    this.ctx = ctx
  }

  register(name, scene) {
    this.scenes[name] = scene
  }

  switchTo(name, data) {
    const scene = this.scenes[name]
    if (!scene) return
    if (this.currentScene && this.currentScene.onExit) {
      this.currentScene.onExit()
    }
    this.currentScene = scene
    if (this.currentScene.onEnter) {
      this.currentScene.onEnter(data)
    }
  }

  update(dt) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(dt)
    }
  }

  render(ctx) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx)
    }
  }
}

window.SceneManager = new SceneManagerClass()
