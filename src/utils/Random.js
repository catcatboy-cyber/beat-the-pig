class RandomUtil {
  int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  float(min, max) {
    return Math.random() * (max - min) + min
  }

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  weightedPick(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    let rand = Math.random() * totalWeight
    for (const item of items) {
      rand -= item.weight
      if (rand <= 0) return item
    }
    return items[items.length - 1]
  }

  shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}

window.Random = new RandomUtil()
