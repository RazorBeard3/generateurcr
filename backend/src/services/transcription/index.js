const mode = process.env.TRANSCRIPTION_MODE || 'local'

let service

if (mode === 'hosted') {
  service = require('./hostedWhisperService')
} else {
  service = require('./localWhisperService')
}

module.exports = service
