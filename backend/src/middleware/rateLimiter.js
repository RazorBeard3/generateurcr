const rateLimit = require('express-rate-limit')

const HOUR_MS = 60 * 60 * 1000

function createLimiter(max, label) {
  return rateLimit({
    windowMs: HOUR_MS,
    max,
    // Limite par utilisateur (req.userId posé par authMiddleware), pas par IP
    keyGenerator: (req) => req.userId,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: `Limite atteinte pour ${label} (${max} par heure). Réessayez plus tard.`,
      })
    },
  })
}

const transcribeLimiter = createLimiter(10, 'la transcription')
const generateLimiter   = createLimiter(20, 'la génération de CR')

module.exports = { transcribeLimiter, generateLimiter }
