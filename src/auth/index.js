const jwt = require('jsonwebtoken')
function getUserInfo() {
  const openId = process.env.WX_OPENID || ''
  const appId = process.env.WX_APPID || ''
  const uid = process.env.TCB_UUID || ''

  return {
    openId,
    appId,
    uid
  }
}

function validateUid(uid) {
  if (typeof uid !== 'string') {
    throw new TypeError('uid must be a string')
  }
  if (!/^[a-zA-Z0-9]{4,32}$/.test(uid)) {
    throw new Error(`Invalid uid: "${uid}"`)
  }
}

exports.auth = function() {
  return {
    getUserInfo,
    createTicket: (uid, options = {}) => {
      validateUid(uid)
      const timestamp = new Date().getTime()
      const { credentials, envName } = this.config
      const {
        refresh = 3600 * 1000,
        expire = timestamp + 7 * 24 * 60 * 60 * 1000
      } = options
      var token = jwt.sign(
        {
          alg: 'RS256',
          env: envName,
          iat: timestamp,
          exp: timestamp + 10 * 60 * 1000, // ticket十分钟有效
          uid,
          refresh,
          expire
        },
        credentials.private_key,
        { algorithm: 'RS256' }
      )

      return credentials.private_key_id + '/@@/' + token
    }
  }
}
