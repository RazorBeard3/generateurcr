// Génération de CR via Ollama — retourne un JSON structuré

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'generateur-cr'

function parseJSON(text) {
  try { return JSON.parse(text.trim()) } catch {}
  const match = text.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) } catch {} }
  throw new Error('Réponse Ollama non parsable en JSON')
}

async function generateStructured(transcription, config = {}) {
  const { meetingType = '', context = '', tone = 'Professionnel' } = config

  const systemPrompt = `Tu es un moteur d'extraction pour comptes rendus professionnels.
Tu lis une transcription et tu extrais uniquement ce qui est présent.
Tu réponds UNIQUEMENT avec un JSON valide. Zéro texte avant ou après.
Zéro invention. Information absente → null ou tableau vide.`

  const contextLine = context ? `Contexte : ${context}\n` : ''
  const meetingLine = meetingType ? `Type de réunion : ${meetingType}\n` : ''

  const userPrompt = `Transcription à analyser :
${transcription}

${contextLine}${meetingLine}Ton souhaité : ${tone}

Retourne ce JSON (commence par { et termine par }) :
{
  "executiveSummary": "2-3 phrases max sur ce qui s'est passé et décidé",
  "decisions": ["décision actée 1"],
  "actions": [
    { "action": "tâche précise", "owner": "Nom ou null", "deadline": "date ou null", "priority": "haute ou null" }
  ],
  "blockers": ["problème bloquant 1"],
  "nextSteps": ["prochaine étape 1"],
  "notes": []
}`

  let response
  try {
    response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
      }),
    })
  } catch (err) {
    const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')
    if (isConnRefused || err.message?.includes('fetch failed')) {
      const error = new Error('Ollama non disponible. Lancez-le avec : ollama serve')
      error.code = 'OLLAMA_UNAVAILABLE'
      throw error
    }
    throw err
  }

  if (!response.ok) {
    if (response.status === 404) {
      const error = new Error(`Modèle "${OLLAMA_MODEL}" introuvable. Installez-le avec : ollama pull ${OLLAMA_MODEL}`)
      error.code = 'OLLAMA_MODEL_NOT_FOUND'
      throw error
    }
    throw new Error(`Ollama a répondu avec le statut ${response.status}`)
  }

  const data = await response.json()
  return parseJSON(data.response)
}

module.exports = { generateStructured }
