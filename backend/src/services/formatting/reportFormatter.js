// Conversion d'un JSON structuré en markdown

function format(structure, sections = []) {
  const has = sections.length === 0
    ? () => true
    : (keyword) => sections.some(s => s.toLowerCase().includes(keyword))

  const lines = []

  // En-tête
  lines.push(`# ${structure.title || 'Compte rendu'}`, '')
  if (structure.date)        lines.push(`**Date :** ${structure.date}  `)
  if (structure.meetingType) lines.push(`**Type :** ${structure.meetingType}  `)
  if (structure.context)     lines.push(`**Contexte :** ${structure.context}  `)
  if (structure.participants?.length > 0) {
    lines.push(`**Participants :** ${structure.participants.join(', ')}  `)
  }
  lines.push('')

  // Résumé
  if (has('résumé')) {
    lines.push('## Résumé exécutif', '')
    lines.push(structure.executiveSummary || 'Aucun résumé disponible.', '')
  }

  // Décisions
  if (has('décision')) {
    lines.push('## Décisions prises', '')
    if (structure.decisions?.length > 0) {
      structure.decisions.forEach(d => lines.push(`- ${d}`))
    } else {
      lines.push('Aucune décision identifiée.')
    }
    lines.push('')
  }

  // Actions
  if (has('action')) {
    lines.push('## Actions à mener', '')
    if (structure.actions?.length > 0) {
      structure.actions.forEach(a => {
        const meta = [a.owner, a.deadline].filter(Boolean)
        const metaStr = meta.length > 0 ? ` *(${meta.join(', ')})*` : ''
        const urgency = a.priority === 'haute' ? ' **[URGENT]**' : ''
        lines.push(`- [ ] ${a.action}${metaStr}${urgency}`)
      })
    } else {
      lines.push('Aucune action identifiée.')
    }
    lines.push('')
  }

  // Responsables
  if (has('responsable')) {
    lines.push('## Responsables & Échéances', '')
    const withOwner = (structure.actions || []).filter(a => a.owner)
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
    if (structure.blockers?.length > 0) {
      structure.blockers.forEach(b => lines.push(`- ${b}`))
    } else {
      lines.push('Aucun point bloquant identifié.')
    }
    lines.push('')
  }

  // Prochaines étapes
  if (has('prochaine') || has('étape')) {
    lines.push('## Prochaines étapes', '')
    if (structure.nextSteps?.length > 0) {
      structure.nextSteps.forEach(n => lines.push(`- ${n}`))
    } else {
      lines.push('Aucune prochaine étape identifiée.')
    }
    lines.push('')
  }

  // Notes (toujours incluses si présentes)
  if (structure.notes?.length > 0) {
    lines.push('## Notes complémentaires', '')
    structure.notes.forEach(n => lines.push(`- ${n}`))
    lines.push('')
  }

  return lines.join('\n')
}

module.exports = { format }
