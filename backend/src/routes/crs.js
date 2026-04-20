const express = require('express')
const storage = require('../services/storage/hostedStorage')
const { sendServerError } = require('../middleware/errors')

const router = express.Router()

router.get('/crs', async (req, res) => {
  try {
    res.json(await storage.listCRs({ projectId: req.query.projectId, search: req.query.search, userId: req.userId }))
  } catch (err) {
    sendServerError(res, err, 'listCRs')
  }
})

router.get('/crs/:id', async (req, res) => {
  try {
    const cr = await storage.getCR(req.params.id, req.userId)
    if (!cr) return res.status(404).json({ error: 'CR introuvable.' })
    res.json(cr)
  } catch (err) {
    sendServerError(res, err, 'getCR')
  }
})

router.post('/crs', async (req, res) => {
  try {
    res.status(201).json(await storage.createCR(req.body, req.userId))
  } catch (err) {
    sendServerError(res, err, 'createCR')
  }
})

router.put('/crs/:id', async (req, res) => {
  try {
    const updated = await storage.updateCR(req.params.id, req.body, req.userId)
    if (!updated) return res.status(404).json({ error: 'CR introuvable.' })
    res.json(updated)
  } catch (err) {
    sendServerError(res, err, 'updateCR')
  }
})

router.delete('/crs/:id', async (req, res) => {
  try {
    await storage.deleteCR(req.params.id, req.userId)
    res.json({ success: true })
  } catch (err) {
    sendServerError(res, err, 'deleteCR')
  }
})

module.exports = router
