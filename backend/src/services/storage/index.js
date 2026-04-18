const mode = process.env.STORAGE_MODE || 'local'

module.exports = mode === 'hosted'
  ? require('./hostedStorage')
  : require('./localJsonStorage')
