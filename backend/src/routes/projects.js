const express = require('express')
const storage = require('../services/storage/hostedStorage')
const { sendServerError } = require('../middleware/errors')

const router = express.Router()

router.get('/projects', async (req, res) => {
  try {
    res.json(await storage.listProjects(req.userId))
  } catch (err) {
    sendServerError(res, err, 'listProjects')
  }
})

router.post('/projects', async (req, res) => {
  try {
    res.status(201).json(await storage.createProject(req.body, req.userId))
  } catch (err) {
    sendServerError(res, err, 'createProject')
  }
})

router.put('/projects/:id', async (req, res) => {
  try {
    const updated = await storage.updateProject(req.params.id, req.body, req.userId)
    if (!updated) return res.status(404).json({ error: 'Projet introuvable.' })
    res.json(updated)
  } catch (err) {
    sendServerError(res, err, 'updateProject')
  }
})

router.delete('/projects/:id', async (req, res) => {
  try {
    await storage.deleteProject(req.params.id, req.userId)
    res.json({ success: true })
  } catch (err) {
    sendServerError(res, err, 'deleteProject')
  }
})

module.exports = router
