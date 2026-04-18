// Contrat identique à localJsonStorage.js
// Toutes les méthodes sont async et doivent respecter les mêmes retours.
//
// listCRs({ projectId?, search?, userId? }) → Promise<CR[]>
// getCR(id, userId?)                        → Promise<CR | null>
// createCR(data, userId?)                   → Promise<CR>          id et createdAt fournis par Supabase
// updateCR(id, data, userId?)               → Promise<CR | null>   null si id introuvable
// deleteCR(id, userId?)                     → Promise<void>
//
// listProjects(userId?)                     → Promise<Project[]>
// createProject(data, userId?)              → Promise<Project>     id, color et createdAt fournis par Supabase
// updateProject(id, data, userId?)          → Promise<Project | null>
// deleteProject(id, userId?)                → Promise<void>
//
// userId est nullable (transition) — si null, pas de filtre par user_id

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

// --- CRs ---

async function listCRs({ projectId, search, userId } = {}) {
  const sb = getClient()
  let query = sb.from('crs').select('*').order('createdAt', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  if (projectId) query = query.eq('projectId', projectId)
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  const { data, error } = await query
  assertNoError(error, 'listCRs')
  return data
}

async function getCR(id, userId) {
  let query = getClient().from('crs').select('*').eq('id', id)
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query.maybeSingle()
  assertNoError(error, 'getCR')
  return data
}

async function createCR(data, userId) {
  const payload = { ...data, createdAt: new Date().toISOString() }
  if (userId) payload.user_id = userId
  const { data: created, error } = await getClient()
    .from('crs')
    .insert(payload)
    .select()
    .single()
  assertNoError(error, 'createCR')
  return created
}

async function updateCR(id, data, userId) {
  let query = getClient()
    .from('crs')
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq('id', id)
  if (userId) query = query.eq('user_id', userId)
  const { data: updated, error } = await query.select().single()
  assertNoError(error, 'updateCR')
  return updated || null
}

async function deleteCR(id, userId) {
  let query = getClient().from('crs').delete().eq('id', id)
  if (userId) query = query.eq('user_id', userId)
  const { error } = await query
  assertNoError(error, 'deleteCR')
}

// --- Projets ---

async function listProjects(userId) {
  let query = getClient().from('projects').select('*').order('createdAt', { ascending: true })
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query
  assertNoError(error, 'listProjects')
  return data
}

async function createProject(data, userId) {
  const sb = getClient()
  let colorQuery = sb.from('projects').select('color')
  if (userId) colorQuery = colorQuery.eq('user_id', userId)
  const { data: existing } = await colorQuery
  const usedColors = (existing || []).map(p => p.color)
  const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[(existing?.length || 0) % COLORS.length]

  const payload = { ...data, color, createdAt: new Date().toISOString() }
  if (userId) payload.user_id = userId

  const { data: created, error } = await sb
    .from('projects')
    .insert(payload)
    .select()
    .single()
  assertNoError(error, 'createProject')
  return created
}

async function updateProject(id, data, userId) {
  let query = getClient().from('projects').update(data).eq('id', id)
  if (userId) query = query.eq('user_id', userId)
  const { data: updated, error } = await query.select().single()
  assertNoError(error, 'updateProject')
  return updated || null
}

async function deleteProject(id, userId) {
  let query = getClient().from('projects').delete().eq('id', id)
  if (userId) query = query.eq('user_id', userId)
  const { error } = await query
  assertNoError(error, 'deleteProject')
}

module.exports = { listCRs, getCR, createCR, updateCR, deleteCR, listProjects, createProject, updateProject, deleteProject }
