// Contrat identique à localJsonStorage.js
// Toutes les méthodes sont async et doivent respecter les mêmes retours.
//
// listCRs({ projectId?, search? }) → Promise<CR[]>
// getCR(id)                        → Promise<CR | null>
// createCR(data)                   → Promise<CR>          id et createdAt fournis par Supabase
// updateCR(id, data)               → Promise<CR | null>   null si id introuvable
// deleteCR(id)                     → Promise<void>
//
// listProjects()                   → Promise<Project[]>
// createProject(data)              → Promise<Project>     id, color et createdAt fournis par Supabase
// updateProject(id, data)          → Promise<Project | null>
// deleteProject(id)                → Promise<void>

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

async function listCRs({ projectId, search } = {}) {
  const sb = getClient()
  let query = sb.from('crs').select('*').order('createdAt', { ascending: false })
  if (projectId) query = query.eq('projectId', projectId)
  if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  const { data, error } = await query
  assertNoError(error, 'listCRs')
  return data
}

async function getCR(id) {
  const { data, error } = await getClient().from('crs').select('*').eq('id', id).maybeSingle()
  assertNoError(error, 'getCR')
  return data
}

async function createCR(data) {
  const { data: created, error } = await getClient()
    .from('crs')
    .insert({ ...data, createdAt: new Date().toISOString() })
    .select()
    .single()
  assertNoError(error, 'createCR')
  return created
}

async function updateCR(id, data) {
  const { data: updated, error } = await getClient()
    .from('crs')
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  assertNoError(error, 'updateCR')
  return updated || null
}

async function deleteCR(id) {
  const { error } = await getClient().from('crs').delete().eq('id', id)
  assertNoError(error, 'deleteCR')
}

// --- Projets ---

async function listProjects() {
  const { data, error } = await getClient().from('projects').select('*').order('createdAt', { ascending: true })
  assertNoError(error, 'listProjects')
  return data
}

async function createProject(data) {
  const sb = getClient()
  const { data: existing } = await sb.from('projects').select('color')
  const usedColors = (existing || []).map(p => p.color)
  const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[(existing?.length || 0) % COLORS.length]

  const { data: created, error } = await sb
    .from('projects')
    .insert({ ...data, color, createdAt: new Date().toISOString() })
    .select()
    .single()
  assertNoError(error, 'createProject')
  return created
}

async function updateProject(id, data) {
  const { data: updated, error } = await getClient()
    .from('projects')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  assertNoError(error, 'updateProject')
  return updated || null
}

async function deleteProject(id) {
  const { error } = await getClient().from('projects').delete().eq('id', id)
  assertNoError(error, 'deleteProject')
}

module.exports = { listCRs, getCR, createCR, updateCR, deleteCR, listProjects, createProject, updateProject, deleteProject }
