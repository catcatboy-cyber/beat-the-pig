const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const collections = ['users', 'user_data', 'imported_pigs', 'events']
  const results = []

  for (const name of collections) {
    try {
      await db.createCollection(name)
      results.push({ collection: name, status: 'created' })
    } catch (e) {
      if (e.errCode === -502005) {
        results.push({ collection: name, status: 'already exists' })
      } else {
        results.push({ collection: name, status: 'error', msg: e.message })
      }
    }
  }

  return { code: 0, results }
}
