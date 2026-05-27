const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { nickname, maxCombo, totalKills, totalDamage } = event

  try {
    // 查询是否已有记录
    const { data } = await db.collection('users').where({ _openid: openid }).get()

    if (data.length > 0) {
      // 更新（只更新比原有值大的）
      const doc = data[0]
      const updateData = {}
      if (maxCombo > (doc.maxCombo || 0)) updateData.maxCombo = maxCombo
      if (totalKills > (doc.totalKills || 0)) updateData.totalKills = totalKills
      if (totalDamage > (doc.totalDamage || 0)) updateData.totalDamage = totalDamage
      if (nickname) updateData.nickname = nickname
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = db.serverDate()
        await db.collection('users').doc(doc._id).update({ data: updateData })
      }
    } else {
      // 新建
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickname: nickname || '小猪',
          maxCombo: maxCombo || 0,
          totalKills: totalKills || 0,
          totalDamage: totalDamage || 0,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }
    return { code: 0 }
  } catch (err) {
    return { code: -1, errMsg: err.message }
  }
}
