class CollisionSystemClass {
  constructor() {
    this.recentHits = []
  }

  check(weapon, pigs) {
    this.recentHits = []
    if (!weapon) return this.recentHits

    var hitArea = weapon.getHitArea()
    if (!hitArea) return this.recentHits

    if (!InputManager.isTouching() && !weapon._discharging && !weapon._launched && !weapon._thrown) {
      return this.recentHits
    }

    var areas = Array.isArray(hitArea) ? hitArea : [hitArea]

    for (var ai = 0; ai < areas.length; ai++) {
      var area = areas[ai]
      if (!area) continue

      for (var pi = 0; pi < pigs.length; pi++) {
        var pig = pigs[pi]
        if (!pig.alive || pig.invincibleTimer > 0) continue

        var hit = false
        var knockDir = { x: 0, y: 0 }

        if (area.type === 'sector') {
          hit = this._sectorVsAABB(area, pig.aabb)
          if (hit) {
            knockDir = {
              x: area.direction.x,
              y: Math.min(-0.3, area.direction.y)
            }
          }
        } else if (area.type === 'circle') {
          hit = this._circleVsAABB(area, pig.aabb)
          if (hit) {
            var dx = pig.aabb.x + pig.aabb.w / 2 - area.x
            var dy = pig.aabb.y + pig.aabb.h / 2 - area.y
            var dist = Math.sqrt(dx * dx + dy * dy) || 1
            knockDir = {
              x: dx / dist,
              y: Math.min(-0.5, dy / dist)
            }
            if (area.isSmash) {
              knockDir.y = -1
              knockDir.x *= 0.5
            }
          }
        }

        if (hit) {
          // 子弹消费（穿透除外）
          if (area._bulletRef) {
            if (!area._bulletRef._penetrate) {
              area._bulletRef.alive = false
            }
          }
          // 火箭命中引爆
          if (area._explodeOnHit && area._rocketRef) {
            area._rocketRef._explode()
          }
          // 臭弹命中溅射
          if (area._splashOnHit && area._poopRef) {
            area._poopRef._splash(area._poopRef._poopX, area._poopRef._poopY)
          }

          var dmgDealt = pig.takeDamage(
            weapon.damage,
            knockDir,
            weapon.knockbackForce
          )
          if (dmgDealt) {
            this.recentHits.push({
              pig: pig,
              weaponType: weapon.id,
              x: pig.x,
              y: pig.y,
              isSmash: area.isSmash || false,
              isExplosive: area.isExplosion || false,
              isPoison: area.isPoison || false
            })
          }
        }
      }
    }

    return this.recentHits
  }

  _sectorVsAABB(sector, aabb) {
    // 简化扇形 vs AABB：检查扇形的行进矩形是否与 AABB 相交
    const minX = Math.min(sector.x, sector.cx)
    const maxX = Math.max(sector.x, sector.cx)
    const minY = Math.min(sector.y, sector.cy)
    const maxY = Math.max(sector.y, sector.cy)

    // 扩展边界（考虑扫帚宽度）
    const sweepW = 30
    const expandedMinX = minX - sweepW
    const expandedMaxX = maxX + sweepW
    const expandedMinY = minY - sweepW
    const expandedMaxY = maxY + sweepW

    if (
      aabb.x + aabb.w < expandedMinX ||
      aabb.x > expandedMaxX ||
      aabb.y + aabb.h < expandedMinY ||
      aabb.y > expandedMaxY
    ) {
      return false
    }

    // 进一步检查：AABB 中心是否在扇形角度范围内
    const cx = aabb.x + aabb.w / 2
    const cy = aabb.y + aabb.h / 2
    const midX = (sector.x + sector.cx) / 2
    const midY = (sector.y + sector.cy) / 2
    const dx = cx - midX
    const dy = cy - midY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > sector.radius + aabb.w * 0.7) return false

    // 角度检查
    const angle = Math.atan2(dy, dx)
    let angleDiff = angle - (sector.angle + sector.sweepAngle / 2)
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    return Math.abs(angleDiff) < sector.sweepAngle / 2 + 0.3
  }

  _circleVsAABB(circle, aabb) {
    // 圆形 vs AABB
    const cx = Math.max(aabb.x, Math.min(circle.x, aabb.x + aabb.w))
    const cy = Math.max(aabb.y, Math.min(circle.y, aabb.y + aabb.h))
    const dx = circle.x - cx
    const dy = circle.y - cy
    return (dx * dx + dy * dy) < (circle.radius * circle.radius)
  }

  getRecentHits() {
    return this.recentHits
  }
}

window.CollisionSystem = new CollisionSystemClass()
