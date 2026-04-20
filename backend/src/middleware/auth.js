const { createClient } = require('@supabase/supabase-js')
const { sendServerError } = require('./errors')

function getSupabaseClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function authMiddleware(req, res, next) {
  const header = req.headers['authorization']
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant. Connectez-vous.' })
  }

  const token = header.slice(7)
  try {
    const { data: { user }, error } = await getSupabaseClient().auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Token invalide ou expiré.' })
    req.userId = user.id
    next()
  } catch (err) {
    sendServerError(res, err, 'authMiddleware')
  }
}

module.exports = authMiddleware
