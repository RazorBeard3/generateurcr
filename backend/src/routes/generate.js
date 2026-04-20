const express = require('express')
const { generateReport } = require('../services/reporting/hostedReportService')
const { generateLimiter } = require('../middleware/rateLimiter')
const { sendServerError } = require('../middleware/errors')

const router = express.Router()

router.post('/generate-cr', generateLimiter, async (req, res) => {
  const { transcription, config } = req.body

  if (!transcription || transcription.trim().length < 10) {
    return res.status(400).json({ error: 'Transcription trop courte ou manquante.' })
  }

  try {
    const { mode, structured, markdown } = await generateReport(transcription, config || {})
    // cr: alias de markdown pour la compatibilité frontend
    res.json({ cr: markdown, mode, structured, markdown })
  } catch (err) {
    sendServerError(res, err, 'generateCR')
  }
})

module.exports = router
