const express = require('express')
const { generateReport } = require('../services/reporting')

const router = express.Router()

router.post('/generate-cr', async (req, res) => {
  const { transcription, config } = req.body

  if (!transcription || transcription.trim().length < 10) {
    return res.status(400).json({ error: 'Transcription trop courte ou manquante.' })
  }

  try {
    const { mode, structured, markdown } = await generateReport(transcription, config || {})
    // cr: alias de markdown pour la compatibilité frontend
    res.json({ cr: markdown, mode, structured, markdown })
  } catch (err) {
    console.error('Erreur génération CR :', err.message)
    res.status(500).json({ error: `La génération a échoué : ${err.message}` })
  }
})

module.exports = router
