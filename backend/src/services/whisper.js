const { spawn } = require('child_process')
const path = require('path')

function transcribeAudio(audioFilePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../whisper/transcribe.py')
    const python = spawn('python3', [scriptPath, audioFilePath])

    let stdout = ''
    let stderr = ''

    python.stdout.on('data', data => (stdout += data.toString()))

    // Affiche la progression Whisper en temps réel dans la console Node.js
    python.stderr.on('data', data => {
      stderr += data.toString()
      process.stdout.write('[Whisper] ' + data.toString())
    })

    python.on('close', code => {
      const rawOut = stdout.trim()
      const rawErr = stderr.trim()

      // Toujours tenter de parser stdout en JSON (succès ou erreur)
      if (rawOut) {
        try {
          const result = JSON.parse(rawOut)
          if (result.error) {
            return reject(new Error(result.error))
          }
          if (result.text !== undefined) {
            return resolve({ text: result.text, language: result.language || 'fr' })
          }
        } catch {
          // stdout non-JSON : cas inattendu, on continue vers le fallback
        }
      }

      // Si le process a planté et stdout était vide, extraire un message lisible depuis stderr
      if (code !== 0) {
        // Chercher une ligne d'erreur JSON dans stderr
        for (const line of rawErr.split('\n').reverse()) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const parsed = JSON.parse(trimmed)
            if (parsed.error) return reject(new Error(parsed.error))
          } catch {
            // Pas du JSON : retourner la dernière ligne non vide comme message
            if (trimmed.length > 0) return reject(new Error(trimmed))
          }
        }
        return reject(new Error('La transcription a échoué (code ' + code + ').'))
      }

      reject(new Error('Réponse Whisper vide ou inattendue.'))
    })

    python.on('error', err => {
      if (err.code === 'ENOENT') {
        reject(new Error('python3 est introuvable. Vérifiez que Python 3 est installé et dans votre PATH.'))
      } else {
        reject(new Error('Impossible de lancer Python : ' + err.message))
      }
    })
  })
}

module.exports = { transcribeAudio }
