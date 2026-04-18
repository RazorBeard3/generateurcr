// Génération locale d'un CR sans API — extraction par règles puis conversion en markdown

// ─── Mots-clés de classification ───────────────────────────────────────────

const DECISION_KEYWORDS = [
  'décidé', 'décision', 'validé', 'approuvé', 'retenu', 'choisi',
  'confirmé', 'acté', 'convenu', 'adopté', 'arrêté', 'accord sur',
]

const ACTION_KEYWORDS = [
  'va ', 'doit ', 'devra', 'prend en charge', 'responsable de',
  "s'occupe", 'chargé de', 'réalisera', 'fera ', 'enverra',
  'préparera', 'organisera', 'contactera', 'mettra à jour',
  'livrera', 'finalisera', 'prépare', 'rédige', 'relance',
]

const BLOCKER_KEYWORDS = [
  'bloquant', 'bloque', 'non résolu', 'en attente de', 'impossible',
  'empêche', 'bloqué', 'difficulté', 'manque', 'pas accès',
  'accès manquant', 'pas encore disponible', 'retard', 'problème',
]

const NEXT_STEPS_KEYWORDS = [
  'prochain', 'prochaine', 'suite', 'prévu', 'planifié',
  'prochaine réunion', 'prochain point', 'à venir', 'sera organisé',
  'il faudra', 'on planifie', 'prévu pour', 'point de suivi',
]

const NOTE_MARKERS = ['note :', 'nb :', 'remarque :', 'à noter :', 'attention :']

const PARTICIPANT_MARKERS = [
  'présents :', 'participants :', 'présentes :', 'avec :',
  'réunion avec', 'meeting avec',
]

const URGENCY_KEYWORDS = ['urgent', 'critique', 'dès que possible', 'immédiatement', 'prioritaire']
const IMPORTANCE_KEYWORDS = ['important', 'essentiel', 'indispensable']

// Mots courants à ne pas confondre avec des noms propres
const COMMON_CAPS = new Set([
  'Le', 'La', 'Les', 'De', 'Du', 'Des', 'Un', 'Une', 'Et', 'En',
  'Au', 'Aux', 'Ce', 'Cette', 'Ces', 'Mon', 'Son', 'Nous', 'Vous',
  'Ils', 'Elle', 'Elles', 'On', 'Je', 'Tu', 'Il',
])

// ─── Utilitaires ────────────────────────────────────────────────────────────

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 8)
}

function matchesKeywords(sentence, keywords) {
  const lower = sentence.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function cleanSentence(sentence) {
  return sentence.replace(/^[-*•]\s*/, '').trim()
}

// ─── Extraction des participants ─────────────────────────────────────────────

function extractParticipants(text) {
  const lower = text.toLowerCase()

  // Chercher un marqueur explicite ("présents : Marie, Jean")
  for (const marker of PARTICIPANT_MARKERS) {
    const idx = lower.indexOf(marker)
    if (idx !== -1) {
      const after = text.slice(idx + marker.length, idx + marker.length + 200)
      const line = after.split(/[.\n]/)[0]
      return line.split(/[,;&]/).map(p => p.trim()).filter(p => p.length > 1)
    }
  }

  // Fallback : noms propres répétés au moins 2 fois
  const namePattern = /\b([A-ZÉÀÈÙÂÊÎÔÛÏÜÄËÖ][a-zéàèùâêîôûïüäëö]{2,})\b/g
  const counts = {}
  let match
  while ((match = namePattern.exec(text)) !== null) {
    const name = match[1]
    if (!COMMON_CAPS.has(name)) {
      counts[name] = (counts[name] || 0) + 1
    }
  }

  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([name]) => name)
}

// ─── Extraction du responsable dans une phrase ───────────────────────────────

function extractOwner(sentence) {
  // Sauter le 1er mot (toujours en majuscule = début de phrase)
  const words = sentence.split(/\s+/)
  for (let i = 1; i < words.length; i++) {
    const word = words[i].replace(/[.,;:!?()\[\]]+$/, '')
    if (/^[A-ZÉÀÈÙÂÊÎÔÛÏÜÄËÖ][a-zéàèùâêîôûïüäëö]{2,}$/.test(word) && !COMMON_CAPS.has(word)) {
      // Vérifier si le mot suivant forme un prénom-nom
      if (i + 1 < words.length) {
        const next = words[i + 1].replace(/[.,;:!?()\[\]]+$/, '')
        if (/^[A-ZÉÀÈÙÂÊÎÔÛÏÜÄËÖ][a-zéàèùâêîôûïüäëö]{2,}$/.test(next) && !COMMON_CAPS.has(next)) {
          return `${word} ${next}`
        }
      }
      return word
    }
  }
  return null
}

// ─── Extraction d'une échéance dans une phrase ──────────────────────────────

function extractDeadline(sentence) {
  const patterns = [
    /(?:avant|pour|d['']ici)\s+le\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
    /le\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
    /(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)(?:\s+\d{4})?)/i,
    /fin\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
    /(semaine prochaine)/i,
    /(ce\s+(?:lundi|mardi|mercredi|jeudi|vendredi))/i,
    /(demain)/i,
    /(cette semaine|ce mois)/i,
  ]

  for (const pattern of patterns) {
    const match = sentence.match(pattern)
    if (match) return match[1] || match[0]
  }
  return null
}

// ─── Extraction de la priorité ──────────────────────────────────────────────

function extractPriority(sentence) {
  const lower = sentence.toLowerCase()
  if (URGENCY_KEYWORDS.some(k => lower.includes(k))) return 'haute'
  if (IMPORTANCE_KEYWORDS.some(k => lower.includes(k))) return 'moyenne'
  return null
}

// ─── Extraction du résumé exécutif ──────────────────────────────────────────

function extractSummary(sentences) {
  // Phrases qui décrivent l'objet de la réunion
  const purposePhrases = sentences.filter(s => {
    const l = s.toLowerCase()
    return l.includes('objectif') || l.includes('ordre du jour') ||
      l.includes('but de') || l.includes('réunion de') ||
      l.includes('point sur') || l.includes('sujet de')
  })

  if (purposePhrases.length > 0) {
    return purposePhrases.slice(0, 2).join(' ')
  }

  // Fallback : 3 premières phrases
  return sentences.slice(0, Math.min(3, sentences.length)).join(' ')
}

// ─── Extraction principale → structure JSON ──────────────────────────────────

function extractStructure(transcription, config = {}) {
  const { meetingType = '', context = '' } = config
  const sentences = splitSentences(transcription)

  const decisions = sentences
    .filter(s => matchesKeywords(s, DECISION_KEYWORDS))
    .map(cleanSentence)

  const actions = sentences
    .filter(s => matchesKeywords(s, ACTION_KEYWORDS))
    .map(s => ({
      action: cleanSentence(s),
      owner: extractOwner(s),
      deadline: extractDeadline(s),
      priority: extractPriority(s),
    }))

  const blockers = sentences
    .filter(s => matchesKeywords(s, BLOCKER_KEYWORDS))
    .map(cleanSentence)

  const nextSteps = sentences
    .filter(s => matchesKeywords(s, NEXT_STEPS_KEYWORDS))
    .map(cleanSentence)

  const notes = sentences
    .filter(s => matchesKeywords(s, NOTE_MARKERS))
    .map(cleanSentence)

  return {
    title: meetingType ? `Compte rendu — ${meetingType}` : 'Compte rendu de réunion',
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    project: null,
    meetingType: meetingType || null,
    context: context || null,
    participants: extractParticipants(transcription),
    executiveSummary: extractSummary(sentences),
    decisions,
    actions,
    blockers,
    nextSteps,
    notes,
  }
}

// ─── Conversion structure JSON → Markdown ───────────────────────────────────

function structureToMarkdown(structure, sections = []) {
  // Si aucune section demandée, tout afficher
  const has = sections.length === 0
    ? () => true
    : (keyword) => sections.some(s => s.toLowerCase().includes(keyword))

  const lines = []

  // En-tête
  lines.push(`# ${structure.title}`, '')
  if (structure.date) lines.push(`**Date :** ${structure.date}  `)
  if (structure.meetingType) lines.push(`**Type :** ${structure.meetingType}  `)
  if (structure.context) lines.push(`**Contexte :** ${structure.context}  `)
  if (structure.participants?.length > 0) {
    lines.push(`**Participants :** ${structure.participants.join(', ')}  `)
  }
  lines.push('', '> *Généré en mode local (aucune clé API configurée)*', '')

  // Résumé global
  if (has('résumé')) {
    lines.push('## Résumé global', '')
    lines.push(structure.executiveSummary || 'Aucun résumé disponible.', '')
  }

  // Décisions prises
  if (has('décision')) {
    lines.push('## Décisions prises', '')
    if (structure.decisions.length > 0) {
      structure.decisions.forEach(d => lines.push(`- ${d}`))
    } else {
      lines.push('Aucune décision identifiée automatiquement.')
    }
    lines.push('')
  }

  // Actions à mener
  if (has('action')) {
    lines.push('## Actions à mener', '')
    if (structure.actions.length > 0) {
      structure.actions.forEach(a => {
        const meta = [a.owner, a.deadline].filter(Boolean)
        const metaStr = meta.length > 0 ? ` *(${meta.join(', ')})*` : ''
        const urgency = a.priority === 'haute' ? ' **[URGENT]**' : ''
        lines.push(`- [ ] ${a.action}${metaStr}${urgency}`)
      })
    } else {
      lines.push('Aucune action identifiée automatiquement.')
    }
    lines.push('')
  }

  // Responsables & Échéances
  if (has('responsable')) {
    lines.push('## Responsables & Échéances', '')
    const withOwner = structure.actions.filter(a => a.owner)
    if (withOwner.length > 0) {
      withOwner.forEach(a => {
        const deadline = a.deadline ? ` — ${a.deadline}` : ''
        lines.push(`- **${a.owner}** : ${a.action}${deadline}`)
      })
    } else {
      lines.push('Voir les actions ci-dessus.')
    }
    lines.push('')
  }

  // Points bloquants
  if (has('bloquant')) {
    lines.push('## Points bloquants', '')
    if (structure.blockers.length > 0) {
      structure.blockers.forEach(b => lines.push(`- ${b}`))
    } else {
      lines.push('Aucun point bloquant identifié.')
    }
    lines.push('')
  }

  // Prochaines étapes
  if (has('prochaine') || has('étape')) {
    lines.push('## Prochaines étapes', '')
    if (structure.nextSteps.length > 0) {
      structure.nextSteps.forEach(n => lines.push(`- ${n}`))
    } else {
      lines.push('Aucune prochaine étape identifiée.')
    }
    lines.push('')
  }

  // Notes (ajoutées seulement si présentes, toujours)
  if (structure.notes?.length > 0) {
    lines.push('## Notes', '')
    structure.notes.forEach(n => lines.push(`- ${n}`))
    lines.push('')
  }

  return lines.join('\n')
}

// ─── Point d'entrée principal ────────────────────────────────────────────────

function buildReport(transcription, config = {}) {
  const structure = extractStructure(transcription, config)
  const markdown = structureToMarkdown(structure, config.sections || [])
  return { structure, markdown }
}

module.exports = { buildReport, extractStructure, structureToMarkdown }
