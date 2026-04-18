// Middleware d'authentification — Phase 1
//
// Routes publiques (pas de middleware) : GET /api/health, GET /api/setup/check
// Routes protégées (toutes les autres) : nécessitent un Bearer token Supabase
//
// En mode local (STORAGE_MODE != 'hosted') : req.userId = null, on laisse passer
// En mode hosted : vérifie le JWT Supabase, met req.userId = user.id
// user_id est nullable (transition) — les données sans user_id restent accessibles en lecture

const { createClient } = require('@supabase/supabase-js')

function getSupabaseClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function authMiddleware(req, res, next) {
  // En mode local, pas d'auth
  if (process.env.STORAGE_MODE !== 'hosted') {
    req.userId = null
    return next()
  }

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
    res.status(500).json({ error: 'Erreur vérification auth : ' + err.message })
  }
}

module.exports = authMiddleware
