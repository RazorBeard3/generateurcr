const express = require('express')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)
const router = express.Router()

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'generateur-cr'

async function checkOllama() {
  try {
    const res = await fetch(OLLAMA_URL)
    return res.ok
  } catch {
    return false
  }
}

async function checkModel() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`)
    if (!res.ok) return false
    const data = await res.json()
    return (data.models || []).some(m => m.name.startsWith(OLLAMA_MODEL))
  } catch {
    return false
  }
}

async function checkCommand(cmd) {
  try {
    await execAsync(cmd)
    return true
  } catch {
    return false
  }
}

router.get('/setup/check', async (req, res) => {
  const [ollama, model, python, whisper, ffmpeg] = await Promise.all([
    checkOllama(),
    checkModel(),
    checkCommand('python3 --version'),
    checkCommand('python3 -c "import whisper"'),
    checkCommand('ffmpeg -version'),
  ])

  res.json({ ollama, model, python, whisper, ffmpeg })
})

module.exports = router
