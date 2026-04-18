const Anthropic = require('@anthropic-ai/sdk')
const { format } = require('../formatting/reportFormatter')

const client = new Anthropic()

function parseJSON(text) {
  try { return JSON.parse(text.trim()) } catch {}
  const match = text.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) } catch {} }
  throw new Error('Réponse Claude non parsable en JSON')
}

async function generateReport(transcription, config = {}) {
  const {
    meetingType = '',
    context = '',
    tone = 'Professionnel',
    sections = [],
  } = config

  const contextLine = context ? `Contexte : ${context}\n` : ''
  const meetingLine = meetingType ? `Type de réunion : ${meetingType}\n` : ''

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `Tu es un moteur d'extraction pour comptes rendus professionnels.
Tu lis une transcription et tu extrais uniquement ce qui est présent.
Tu réponds UNIQUEMENT avec un JSON valide. Zéro texte avant ou après.
Zéro invention. Information absente → null ou tableau vide.`,
    messages: [{
      role: 'user',
      content: `Transcription à analyser :
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
}`,
    }],
  })

  const partial = parseJSON(message.content[0].text)

  const structured = {
    title: meetingType ? `Compte rendu — ${meetingType}` : 'Compte rendu de réunion',
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    project: null,
    meetingType: meetingType || null,
    context: context || null,
    participants: [],
    ...partial,
  }

  const markdown = format(structured, sections)
  return { mode: 'hosted-claude', structured, markdown }
}

module.exports = { generateReport }
