const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { type, limit = 50 } = event
  // type: 'combo' | 'kills' | 'gold'
  const sortField = type === 'combo' ? 'maxCombo'
    : type === 'kills' ? 'totalKills'
    : 'totalDamage'

  try {
    const { data } = await db.collection('users')
      .field({
        _openid: true,
        nickname: true,
        avatarUrl: true,
        maxCombo: true,
        totalKills: true,
        totalDamage: true
      })
      .orderBy(sortField, 'desc')
      .limit(limit)
      .get()

    return { code: 0, data }
  } catch (err) {
    return { code: -1, errMsg: err.message }
  }
}
