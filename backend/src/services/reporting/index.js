const mode = process.env.REPORT_MODE || 'local'

let service

if (mode === 'hosted') {
  service = require('./hostedReportService')
} else {
  service = require('./localOllamaService')
}

module.exports = service
