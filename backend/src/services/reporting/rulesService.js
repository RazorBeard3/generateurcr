// Fallback local : extraction par règles depuis la transcription → JSON structuré

const DECISION_KEYWORDS = [
  'décidé', 'décision', 'validé', 'approuvé', 'retenu', 'choisi',
  'confirmé', 'acté', 'convenu', 'adopté', 'accord sur',
]
const ACTION_KEYWORDS = [
  'va ', 'doit ', 'devra', 'prend en charge', 'responsable de',
  "s'occupe", 'chargé de', 'réalisera', 'fera ', 'enverra',
  'préparera', 'organisera', 'contactera', 'finalisera', 'relance',
]
const BLOCKER_KEYWORDS = [
  'bloquant', 'bloque', 'non résolu', 'en attente de', 'impossible',
  'empêche', 'bloqué', 'difficulté', 'manque', 'pas accès',
  'pas encore disponible', 'retard', 'problème',
]
const NEXT_STEP_KEYWORDS = [
  'prochain', 'prochaine', 'suite', 'prévu', 'planifié',
  'prochaine réunion', 'prochain point', 'à venir', 'il faudra',
  'on planifie', 'prévu pour',
]
const NOTE_MARKERS = ['note :', 'nb :', 'remarque :', 'à noter :', 'attention :']
const PARTICIPANT_MARKERS = ['présents :', 'participants :', 'présentes :', 'avec :']
const URGENCY_KEYWORDS = ['urgent', 'critique', 'dès que possible', 'immédiatement', 'prioritaire']
const COMMON_CAPS = new Set([
  'Le', 'La', 'Les', 'De', 'Du', 'Des', 'Un', 'Une', 'Et', 'En',
  'Au', 'Aux', 'Ce', 'Cette', 'Ces', 'Mon', 'Son', 'Nous', 'Vous',
  'Ils', 'Elle', 'Elles', 'On', 'Je', 'Tu', 'Il',
])

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 8)
}

function matches(sentence, keywords) {
  const lower = sentence.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

function clean(sentence) {
  return sentence.replace(/^[-*•]\s*/, '').trim()
}

// ─── Extraction des participants ─────────────────────────────────────────────

function extractParticipants(text) {
  const lower = text.toLowerCase()
  for (const marker of PARTICIPANT_MARKERS) {
    const idx = lower.indexOf(marker)
    if (idx !== -1) {
      const after = text.slice(idx + marker.length, idx + 200)
      return after.split(/[.\n]/)[0].split(/[,;&]/).map(p => p.trim()).filter(Boolean)
    }
  }
  // Noms propres répétés ≥ 2 fois
  const counts = {}
  const pattern = /\b([A-ZÉÀÈÙÂÊÎÔÛÏÜÄËÖ][a-zéàèùâêîôûïüäëö]{2,})\b/g
  let m
  while ((m = pattern.exec(text)) !== null) {
    if (!COMMON_CAPS.has(m[1])) counts[m[1]] = (counts[m[1]] || 0) + 1
  }
  return Object.entries(counts).filter(([, c]) => c >= 2).map(([n]) => n)
}

// ─── Extraction responsable / échéance / priorité ────────────────────────────

function extractOwner(sentence) {
  const words = sentence.split(/\s+/)
  for (let i = 1; i < words.length; i++) {
    const w = words[i].replace(/[.,;:!?()\[\]]+$/, '')
    if (/^[A-ZÉÀÈÙÂÊÎÔÛÏÜÄËÖ][a-zéàèùâêîôûïüäëö]{2,}$/.test(w) && !COMMON_CAPS.has(w)) {
      const next = words[i + 1]?.replace(/[.,;:!?()\[\]]+$/, '')
      if (next && /^[A-ZÉÀÈÙÂÊÎÔÛÏÜÄËÖ][a-zéàèùâêîôûïüäëö]{2,}$/.test(next) && !COMMON_CAPS.has(next)) {
        return `${w} ${next}`
      }
      return w
    }
  }
  return null
}

function extractDeadline(sentence) {
  const patterns = [
    /(?:avant|pour|d['']ici)\s+le\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
    /le\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i,
    /(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)(?:\s+\d{4})?)/i,
    /fin\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
    /(semaine prochaine|cette semaine|ce mois)/i,
    /(ce\s+(?:lundi|mardi|mercredi|jeudi|vendredi))/i,
    /(demain)/i,
  ]
  for (const p of patterns) {
    const m = sentence.match(p)
    if (m) return m[1] || m[0]
  }
  return null
}

function extractPriority(sentence) {
  return URGENCY_KEYWORDS.some(k => sentence.toLowerCase().includes(k)) ? 'haute' : null
}

// ─── Résumé exécutif ──────────────────────────────────────────────────────────

function extractSummary(sentences) {
  const purposePhrases = sentences.filter(s => {
    const l = s.toLowerCase()
    return l.includes('objectif') || l.includes('ordre du jour') ||
      l.includes('but de') || l.includes('réunion de') || l.includes('point sur')
  })
  const base = purposePhrases.length > 0 ? purposePhrases.slice(0, 2) : sentences.slice(0, 3)
  return base.join(' ')
}

// ─── Point d'entrée : retourne un JSON structuré ─────────────────────────────

function buildStructure(transcription, config = {}) {
  const { meetingType = '', context = '' } = config
  const sentences = splitSentences(transcription)

  return {
    title: meetingType ? `Compte rendu — ${meetingType}` : 'Compte rendu de réunion',
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    project: null,
    meetingType: meetingType || null,
    context: context || null,
    participants: extractParticipants(transcription),
    executiveSummary: extractSummary(sentences),
    decisions: sentences.filter(s => matches(s, DECISION_KEYWORDS)).map(clean),
    actions: sentences.filter(s => matches(s, ACTION_KEYWORDS)).map(s => ({
      action: clean(s),
      owner: extractOwner(s),
      deadline: extractDeadline(s),
      priority: extractPriority(s),
    })),
    blockers: sentences.filter(s => matches(s, BLOCKER_KEYWORDS)).map(clean),
    nextSteps: sentences.filter(s => matches(s, NEXT_STEP_KEYWORDS)).map(clean),
    notes: sentences.filter(s => matches(s, NOTE_MARKERS)).map(clean),
  }
}

module.exports = { buildStructure }
