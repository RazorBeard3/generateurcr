// En dev : proxy Vite → localhost:3001
// En prod web (Vercel) : VITE_API_URL pointe vers le backend Render
// En prod Tauri : localhost:3001 (sidecar)
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : import.meta.env.DEV
    ? '/api'
    : 'http://localhost:3001/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.message || `Erreur ${res.status}`)
  }
  return data
}

// Transcription audio
export async function transcribeAudio(audioBlob, filename = 'recording.webm') {
  const formData = new FormData()
  formData.append('audio', audioBlob, filename)
  const res = await fetch(`${BASE}/transcribe`, { method: 'POST', body: formData })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Échec de la transcription')
  return data
}

// Génération de CR
export async function generateCR(transcription, config) {
  return request('/generate-cr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcription, config }),
  })
}

// CRs
export const crsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/crs${qs ? `?${qs}` : ''}`)
  },
  get: (id) => request(`/crs/${id}`),
  create: (data) => request('/crs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/crs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/crs/${id}`, { method: 'DELETE' }),
}

// Projets
export const projectsApi = {
  list: () => request('/projects'),
  create: (data) => request('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
}

// Health check
export const checkBackend = () => request('/health').catch(() => null)
