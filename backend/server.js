require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3001

// Créer les dossiers nécessaires au démarrage
const dirs = ['uploads', 'data']
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir)
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
})

// Initialiser les fichiers de données avec des données de démonstration
const crsPath = path.join(__dirname, 'data', 'crs.json')
const projectsPath = path.join(__dirname, 'data', 'projects.json')

if (!fs.existsSync(projectsPath)) {
  const defaultProjects = [
    { id: 'p1', name: 'Marketing', color: 'blue', createdAt: new Date().toISOString() },
    { id: 'p2', name: 'Technique', color: 'green', createdAt: new Date().toISOString() },
    { id: 'p3', name: 'Direction', color: 'purple', createdAt: new Date().toISOString() },
    { id: 'p4', name: 'RH', color: 'orange', createdAt: new Date().toISOString() },
  ]
  fs.writeFileSync(projectsPath, JSON.stringify(defaultProjects, null, 2))
}

if (!fs.existsSync(crsPath)) {
  const demoCRs = [
    {
      id: 'cr1',
      title: 'Réunion lancement campagne Q1',
      projectId: 'p1',
      projectName: 'Marketing',
      meetingType: 'Réunion de lancement',
      transcription: 'Nous avons discuté du lancement de la nouvelle campagne marketing pour le premier trimestre. Les principaux points abordés concernent le budget alloué, les canaux de diffusion et les KPIs à atteindre.',
      content: '## Résumé\nRéunion de lancement de la campagne Q1 avec l\'équipe marketing.\n\n## Décisions prises\n- Budget campagne validé à 15 000€\n- Focus sur les réseaux sociaux et email marketing\n- Lancement prévu le 15 janvier\n\n## Actions à mener\n- [ ] Créer les visuels (Marie, avant le 10 jan)\n- [ ] Préparer les séquences email (Paul, avant le 12 jan)\n- [ ] Configurer les outils analytics (Tech, avant le 13 jan)\n\n## Prochaines étapes\nPoint de suivi prévu le 20 janvier.',
      config: { tone: 'Professionnel', sections: ['Résumé', 'Décisions prises', 'Actions à mener', 'Prochaines étapes'] },
      audioPath: null,
      duration: '24 min',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'cr2',
      title: 'Sprint review - Sprint 12',
      projectId: 'p2',
      projectName: 'Technique',
      meetingType: 'Sprint Review',
      transcription: 'Revue du sprint 12. L\'équipe a présenté les fonctionnalités livrées : module de paiement, refonte de l\'authentification, et amélioration des performances.',
      content: '## Résumé\nSprint review du sprint 12. Vélocité : 42 points.\n\n## Fonctionnalités livrées\n- Module de paiement Stripe intégré\n- Refonte authentification (SSO)\n- Gain de performance de 35% sur les requêtes principales\n\n## Points bloquants\n- Problème de compatibilité Safari à résoudre\n\n## Actions à mener\n- [ ] Fix bug Safari (Dev front, sprint 13)\n- [ ] Documentation API (Tech Lead, avant fin sprint)\n\n## Prochaines étapes\nPlanning sprint 13 vendredi prochain.',
      config: { tone: 'Technique', sections: ['Résumé', 'Fonctionnalités livrées', 'Points bloquants', 'Actions à mener'] },
      audioPath: null,
      duration: '45 min',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'cr3',
      title: 'Comité de direction - Bilan T4',
      projectId: 'p3',
      projectName: 'Direction',
      meetingType: 'Comité de direction',
      transcription: 'Bilan du quatrième trimestre présenté par la direction. Croissance de 18% par rapport au T4 de l\'année précédente. Objectifs 2025 définis.',
      content: '## Résumé exécutif\nBilan très positif du T4 avec une croissance de 18% YoY.\n\n## Résultats clés\n- CA : 2,4M€ (+18% vs T4 N-1)\n- NPS : 72 (objectif 65)\n- Effectifs : 34 collaborateurs\n\n## Décisions stratégiques\n- Expansion sur le marché belge validée\n- Recrutement de 5 personnes au S1\n- Nouveau produit en R&D validé\n\n## Responsables & Échéances\n- Plan recrutement : DRH, jan 2025\n- Business plan Belgique : CEO, fév 2025',
      config: { tone: 'Formel', sections: ['Résumé exécutif', 'Résultats clés', 'Décisions stratégiques', 'Responsables & Échéances'] },
      audioPath: null,
      duration: '1h 12 min',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
  fs.writeFileSync(crsPath, JSON.stringify(demoCRs, null, 2))
}

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes API
app.use('/api', require('./src/routes/transcribe'))
app.use('/api', require('./src/routes/generate'))
app.use('/api', require('./src/routes/crs'))
app.use('/api', require('./src/routes/projects'))
app.use('/api', require('./src/routes/setup'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Backend démarré → http://localhost:${PORT}`)
  console.log(`Clé Anthropic : ${process.env.ANTHROPIC_API_KEY ? 'configurée' : 'MANQUANTE - créez un fichier .env'}`)
})
