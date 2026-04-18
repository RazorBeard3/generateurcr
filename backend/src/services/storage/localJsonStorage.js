const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const crsPath = path.join(__dirname, '../../../data/crs.json')
const projectsPath = path.join(__dirname, '../../../data/projects.json')

const COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'yellow', 'teal']

function readFile(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) } catch { return [] }
}

function writeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// --- CRs ---

// listCRs({ projectId?, search?, userId? }) → CR[]  (userId ignoré en local)
function listCRs({ projectId, search } = {}) {
  let crs = readFile(crsPath)
  if (projectId) crs = crs.filter(c => c.projectId === projectId)
  if (search) {
    const q = search.toLowerCase()
    crs = crs.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.content?.toLowerCase().includes(q)
    )
  }
  return crs
}

// getCR(id, userId?) → CR | null  (userId ignoré en local)
function getCR(id) {
  return readFile(crsPath).find(c => c.id === id) || null
}

// createCR(data, userId?) → CR  (userId ignoré en local)
function createCR(data) {
  const crs = readFile(crsPath)
  const newCR = { id: uuidv4(), createdAt: new Date().toISOString(), ...data }
  crs.unshift(newCR)
  writeFile(crsPath, crs)
  return newCR
}

// updateCR(id, data, userId?) → CR mis à jour | null si introuvable  (userId ignoré en local)
function updateCR(id, data) {
  const crs = readFile(crsPath)
  const idx = crs.findIndex(c => c.id === id)
  if (idx === -1) return null
  crs[idx] = { ...crs[idx], ...data, updatedAt: new Date().toISOString() }
  writeFile(crsPath, crs)
  return crs[idx]
}

// deleteCR(id, userId?) → void  (userId ignoré en local)
function deleteCR(id) {
  writeFile(crsPath, readFile(crsPath).filter(c => c.id !== id))
}

// --- Projets ---

// listProjects(userId?) → Project[]  (userId ignoré en local)
function listProjects() {
  return readFile(projectsPath)
}

// createProject(data, userId?) → Project  (userId ignoré en local)
function createProject(data) {
  const projects = readFile(projectsPath)
  const usedColors = projects.map(p => p.color)
  const color = COLORS.find(c => !usedColors.includes(c)) || COLORS[projects.length % COLORS.length]
  const newProject = { id: uuidv4(), color, createdAt: new Date().toISOString(), ...data }
  projects.push(newProject)
  writeFile(projectsPath, projects)
  return newProject
}

// updateProject(id, data, userId?) → Project mis à jour | null si introuvable  (userId ignoré en local)
function updateProject(id, data) {
  const projects = readFile(projectsPath)
  const idx = projects.findIndex(p => p.id === id)
  if (idx === -1) return null
  projects[idx] = { ...projects[idx], ...data }
  writeFile(projectsPath, projects)
  return projects[idx]
}

// deleteProject(id, userId?) → void  (userId ignoré en local)
function deleteProject(id) {
  writeFile(projectsPath, readFile(projectsPath).filter(p => p.id !== id))
}

module.exports = { listCRs, getCR, createCR, updateCR, deleteCR, listProjects, createProject, updateProject, deleteProject }
