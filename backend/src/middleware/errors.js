// Retourne une erreur 500 générique au client et logue le détail côté serveur.
// Ne jamais exposer err.message directement — il peut contenir des noms de tables,
// des messages d'API tierces ou des détails d'infrastructure.
function sendServerError(res, err, context) {
  console.error(`[${context}]`, err.message)
  res.status(500).json({ error: 'Une erreur est survenue. Réessayez ou contactez le support.' })
}

module.exports = { sendServerError }
