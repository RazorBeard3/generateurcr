const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { transcribeAudio } = require('../services/transcription/hostedWhisperService')
const { transcribeLimiter } = require('../middleware/rateLimiter')
const { sendServerError } = require('../middleware/errors')

const router = express.Router()

// Formats audio/vidéo acceptés (alignés avec AudioUploader.jsx côté frontend)
const ALLOWED_MIME = new Set([
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/mpeg',
  'audio/mp3', 'audio/m4a', 'audio/aac', 'audio/wav', 'audio/x-wav',
  'audio/flac', 'audio/opus', 'audio/x-flac',
  'video/mp4', 'video/quicktime', 'video/webm',
])

const ALLOWED_EXT = new Set([
  '.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.webm', '.flac', '.aac', '.opus', '.mov',
])

function fileFilter(req, file, cb) {
  const mime = (file.mimetype || '').toLowerCase()
  const ext = path.extname(file.originalname || '').toLowerCase()
  // iOS envoie parfois un MIME vide ou audio/* générique — on accepte via l'extension en fallback
  if (ALLOWED_MIME.has(mime) || mime.startsWith('audio/') || ALLOWED_EXT.has(ext)) {
    return cb(null, true)
  }
  cb(new Error(`Format non supporté (${mime || ext}). Formats acceptés : mp3, mp4, m4a, wav, ogg, webm, flac, aac, mov.`))
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    cb(null, unique + path.extname(file.originalname || '.webm'))
  },
})

const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 Mo
})

// Wrapper pour capturer les erreurs multer (fileFilter, taille) en JSON
function uploadSingle(req, res, next) {
  upload.single('audio')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximum : 150 Mo.' })
    }
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}

router.post('/transcribe', transcribeLimiter, uploadSingle, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier audio fourni.' })
  }

  console.log(`[Transcription] Fichier reçu : ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(1)} Mo)`)

  const filePath = req.file.path
  try {
    const result = await transcribeAudio(filePath)
    console.log(`[Transcription] OK — langue: ${result.language}, mots: ${result.text.split(' ').length}`)
    res.json({
      transcription: result.text,
      language: result.language,
    })
  } catch (err) {
    sendServerError(res, err, 'transcribeAudio')
  } finally {
    fs.unlink(filePath, (e) => { if (e) console.warn('[Transcription] Suppression fichier échouée :', e.message) })
  }
})

module.exports = router
