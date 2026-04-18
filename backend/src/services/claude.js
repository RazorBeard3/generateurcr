const Anthropic = require('@anthropic-ai/sdk')

/**
 * Génère un compte rendu structuré à partir d'une transcription
 * et d'une configuration utilisateur, via Claude.
 */
async function generateCR(transcription, config) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const {
    context = '',
    meetingType = 'Réunion',
    tone = 'Professionnel',
    sections = ['Résumé', 'Décisions prises', 'Actions à mener', 'Prochaines étapes'],
    formatRules = '',
    outputType = 'Document structuré',
    specificInstructions = '',
  } = config

  const sectionsText = sections.map(s => `- ${s}`).join('\n')

  const systemPrompt = `Tu es un expert en rédaction de comptes rendus professionnels.
Tu produis des comptes rendus clairs, structurés, fidèles à la transcription fournie.
Tu utilises le markdown pour structurer le document (## pour les sections, - pour les listes, **gras** pour les éléments importants).
Tu es précis, concis et factuel. Tu n'inventes rien qui ne soit pas dans la transcription.`

  const userPrompt = `Génère un compte rendu complet à partir de la transcription suivante.

---
TRANSCRIPTION :
${transcription}
---

CONTEXTE MÉTIER : ${context || 'Non précisé'}
TYPE DE RÉUNION : ${meetingType}
TON SOUHAITÉ : ${tone}
TYPE D'OUTPUT : ${outputType}

SECTIONS OBLIGATOIRES À INCLURE :
${sectionsText}

${formatRules ? `RÈGLES RÉDACTIONNELLES :\n${formatRules}\n` : ''}
${specificInstructions ? `CONSIGNES SPÉCIFIQUES :\n${specificInstructions}\n` : ''}

Respecte strictement les sections demandées. Utilise le markdown.
Pour les actions, utilise le format : - [ ] Description (Responsable, Échéance)`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  return message.content[0].text
}

module.exports = { generateCR }
