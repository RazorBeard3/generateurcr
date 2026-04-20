const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

async function checkSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  try {
    const sb = createClient(url, key)
    const { error } = await sb.from('crs').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

router.get('/setup/check', async (req, res) => {
  const allKeysPresent = !!(
    process.env.ASSEMBLYAI_API_KEY &&
    process.env.ANTHROPIC_API_KEY &&
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const supabaseReachable = await checkSupabase()

  res.json({ ready: allKeysPresent && supabaseReachable })
})

module.exports = router
