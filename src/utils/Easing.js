const Easing = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeOutBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },

  easeOutBounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    else return n1 * (t -= 2.625 / d1) * t + 0.984375
  },

  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t - 1) * (2 * Math.PI) / 0.3) + 1
  },

  easeInBack: (t) => {
    const c1 = 1.70158
    return (c1 + 1) * t * t * t - c1 * t * t
  }
}

window.Easing = Easing
