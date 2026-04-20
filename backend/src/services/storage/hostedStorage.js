// Toutes les méthodes sont async.
// userId est obligatoire sur toutes les opérations — refus explicite si absent.
//
// listCRs({ projectId?, search?, userId }) → Promise<CR[]>
// getCR(id, userId)                        → Promise<CR | null>
// createCR(data, userId)                   → Promise<CR>
// updateCR(id, data, userId)               → Promise<CR | null>
// deleteCR(id, userId)                     → Promise<void>
//
// listProjects(userId)                     → Promise<Project[]>
// createProject(data, userId)              → Promise<Project>
// updateProject(id, data, userId)          → Promise<Project | null>
// deleteProject(id, userId)               → Promise<void>

const { createClient } = require('@supabase/supabase-js')

const COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'yellow', 'teal']

function getClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.')
  return createClient(url, key)
}

function assertNoError(error, context) {
  if (error) throw new Error(`Supabase [${context}] : ${error.message}`)
}

function requireUserId(userId) {
  if (!userId) throw new Error('userId manquant — opération refusée.')
}

// --- CRs ---

async function listCRs({ projectId, search, userId } = {}) {
  requireUserId(userId)
  const sb = getClient()
  let query = sb.from('crs').select('*').order('createdAt', { ascending: false }).eq('user_id', userId)
  if (projectId) query = query.eq('projectId', projectId)
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  const { data, error } = await query
  assertNoError(error, 'listCRs')
  return data
}

async function getCR(id, userId) {
  requireUserId(userId)
  const { data, error } = await getClient()
    .from('crs').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
  assertNoError(error, 'getCR')
  return data
}

async function createCR(data, userId) {
  requireUserId(userId)
  // transcription et audioPath ne sont pas stockés durablement
  const { transcription: _t, audioPath: _a, ...rest } = data
  const payload = { ...rest, user_id: userId, createdAt: new Date().toISOString() }
  const { data: created, error } = await getClient()
    .from('crs').insert(payload).select().single()
  assertNoError(error, 'createCR')
  return created
}

async function updateCR(id, data, userId) {
  requireUserId(userId)
  const { data: updated, error } = await getClient()
    .from('crs')
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq('id', id).eq('user_id', userId)
    .select().single()
  assertNoError(error, 'updateCR')
  return updated || null
}

async function deleteCR(id, userId) {
  requireUserId(userId)
  const { error } = await getClient()
    .from('crs').delete().eq('id', id).eq('user_id', userId)
  assertNoError(error, 'deleteCR')
}

// --- Projets ---

async function listProjects(userId) {
  requireUserId(userId)
  const { data, error } = await getClient()
    .from('projects').select('*').order('createdAt', { ascending: true }).eq('user_id', userId)
  assertNoError(error, 'listProjects')
  return data
}

async function createProject(data, userId) {
  requireUserId(userId)
  const sb = getClient()
  const { data: existing } = await sb.from('projects').select('color').eq('user_id', userId)
  const usedColors = (existing || []).map(p => p.color)
  const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[(existing?.length || 0) % COLORS.length]

  const payload = { ...data, color, user_id: userId, createdAt: new Date().toISOString() }
  const { data: created, error } = await sb.from('projects').insert(payload).select().single()
  assertNoError(error, 'createProject')
  return created
}

async function updateProject(id, data, userId) {
  requireUserId(userId)
  const { data: updated, error } = await getClient()
    .from('projects').update(data).eq('id', id).eq('user_id', userId).select().single()
  assertNoError(error, 'updateProject')
  return updated || null
}

async function deleteProject(id, userId) {
  requireUserId(userId)
  const { error } = await getClient()
    .from('projects').delete().eq('id', id).eq('user_id', userId)
  assertNoError(error, 'deleteProject')
}

module.exports = { listCRs, getCR, createCR, updateCR, deleteCR, listProjects, createProject, updateProject, deleteProject }
