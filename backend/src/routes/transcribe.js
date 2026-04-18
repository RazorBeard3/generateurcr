const express = require('express')
const multer = require('multer')
const path = require('path')
const { transcribeAudio } = require('../services/transcription')

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    cb(null, unique + path.extname(file.originalname || '.webm'))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
})

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier audio fourni.' })
  }

  console.log(`[Transcription] Fichier reçu : ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(1)} MB)`)

  try {
    const result = await transcribeAudio(req.file.path)
    console.log(`[Transcription] OK — langue: ${result.language}, mots: ${result.text.split(' ').length}`)
    res.json({
      transcription: result.text,
      language: result.language,
      audioPath: req.file.filename,
    })
  } catch (err) {
    console.error('[Transcription] Échec :', err.message)
    const hint = process.env.TRANSCRIPTION_MODE === 'hosted'
      ? 'Vérifiez que ASSEMBLYAI_API_KEY est configurée et que le fichier audio est valide.'
      : 'Vérifiez que Python 3, Whisper (pip install openai-whisper) et ffmpeg sont installés.'
    res.status(500).json({ error: err.message, hint })
  }
})

module.exports = router
