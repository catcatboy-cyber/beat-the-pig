const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { content } = event
  if (!content) return { code: 0, suggest: 'pass' }

  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: content
    })
    return result
  } catch (err) {
    // 如果 API 调用失败，放行（避免阻断用户操作）
    return { code: 0, suggest: 'pass', errMsg: err.message }
  }
}
