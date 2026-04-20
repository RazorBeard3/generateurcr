require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3001

// Créer le dossier uploads pour les fichiers audio temporaires
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))

// Routes API
// Publiques (sans auth) : GET /api/health, GET /api/setup/check
// Protégées (avec auth)  : /api/transcribe, /api/generate-cr, /api/crs, /api/projects
const authMiddleware = require('./src/middleware/auth')
app.use('/api/setup', require('./src/routes/setup'))
app.use('/api', authMiddleware)
app.use('/api', require('./src/routes/transcribe'))
app.use('/api', require('./src/routes/generate'))
app.use('/api', require('./src/routes/crs'))
app.use('/api', require('./src/routes/projects'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Backend démarré → http://localhost:${PORT}`)
  console.log(`Clé Anthropic : ${process.env.ANTHROPIC_API_KEY ? 'configurée' : 'MANQUANTE - créez un fichier .env'}`)
})
