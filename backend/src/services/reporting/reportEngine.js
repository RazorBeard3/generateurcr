// Moteur central de génération de CR
// Flux : Ollama (JSON) → si échec → rulesService (JSON) → reportFormatter (markdown)

const { generateStructured } = require('../localLlm')
const { buildStructure } = require('./rulesService')
const { format } = require('../formatting/reportFormatter')

async function generateReport(transcription, config = {}) {
  let structured
  let mode

  try {
    const partial = await generateStructured(transcription, config)

    // Enrichir avec les métadonnées (date, titre, config)
    structured = {
      title: config.meetingType ? `Compte rendu — ${config.meetingType}` : 'Compte rendu de réunion',
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      project: null,
      meetingType: config.meetingType || null,
      context: config.context || null,
      participants: [],
      ...partial,
    }
    mode = 'local-llm'
  } catch (err) {
    // Ollama indisponible ou réponse non parsable → fallback règles
    if (err.code !== 'OLLAMA_UNAVAILABLE' && err.code !== 'OLLAMA_MODEL_NOT_FOUND') {
      console.warn('[reportEngine] Ollama a échoué, fallback rulesService :', err.message)
    } else {
      console.warn('[reportEngine]', err.message)
    }
    structured = buildStructure(transcription, config)
    mode = 'local-rules'
  }

  const markdown = format(structured, config.sections || [])
  return { mode, structured, markdown }
}

module.exports = { generateReport }
