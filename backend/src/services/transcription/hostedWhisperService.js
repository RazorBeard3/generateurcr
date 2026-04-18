// Service de transcription hébergé via AssemblyAI (API v2)
// Hypothèses :
//   - langue forcée à 'fr' (AssemblyAI détecte mal le français sans ce paramètre)
//   - fichier audio déjà sur disque (géré par multer en amont dans la route)
//   - timeout à 10 minutes (suffisant pour ~2h d'audio)

const fs = require('fs')

const BASE_URL = 'https://api.assemblyai.com/v2'
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes max

async function transcribeAudio(audioFilePath) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY manquante dans les variables d\'environnement.')

  const headers = { Authorization: apiKey }

  // 1. Upload du fichier audio vers AssemblyAI
  const audioData = fs.readFileSync(audioFilePath)
  const uploadRes = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/octet-stream' },
    body: audioData,
  })
  if (!uploadRes.ok) throw new Error(`AssemblyAI upload échoué (${uploadRes.status})`)
  const { upload_url } = await uploadRes.json()

  // 2. Lancer la transcription
  const transcriptRes = await fetch(`${BASE_URL}/transcript`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url: upload_url, language_code: 'fr', speech_models: ['universal-2'] }),
  })
  if (!transcriptRes.ok) throw new Error(`AssemblyAI transcription échouée (${transcriptRes.status})`)
  const { id } = await transcriptRes.json()

  // 3. Polling jusqu'à complétion (ou timeout 10 min)
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

    const pollRes = await fetch(`${BASE_URL}/transcript/${id}`, { headers })
    if (!pollRes.ok) throw new Error(`AssemblyAI polling échoué (${pollRes.status})`)
    const result = await pollRes.json()

    if (result.status === 'completed') {
      return { text: result.text, language: 'fr' }
    }
    if (result.status === 'error') {
      throw new Error(`AssemblyAI : ${result.error}`)
    }

    console.log(`[AssemblyAI] Statut : ${result.status}...`)
  }

  throw new Error('AssemblyAI : délai de 10 minutes dépassé.')
}

module.exports = { transcribeAudio }
