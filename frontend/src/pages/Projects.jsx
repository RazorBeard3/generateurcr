import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Pencil, Trash2, FolderOpen, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { projectsApi, crsApi } from '@/lib/api'
import { getProjectColor, cn } from '@/lib/utils'

const COLORS = ['blue', 'green', 'purple', 'orange', 'red', 'pink', 'yellow', 'teal']

export function Projects() {
  const { projects, setProjects } = useOutletContext()
  const [crs, setCRs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ name: '', color: 'blue' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    crsApi.list().then(setCRs).catch(() => {})
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', color: 'blue' })
    setError('')
    setShowForm(true)
  }

  function openEdit(project) {
    setEditing(project)
    setForm({ name: project.name, color: project.color || 'blue' })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const updated = await projectsApi.update(editing.id, form)
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await projectsApi.create(form)
        setProjects(prev => [...prev, created])
      }
      setShowForm(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(project) {
    try {
      await projectsApi.delete(project.id)
      setProjects(prev => prev.filter(p => p.id !== project.id))
    } catch {
      // silencieux
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organisez vos comptes rendus par thématique
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      {/* Liste */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Aucun projet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Créez un projet pour organiser vos comptes rendus.
          </p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer un projet
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => {
            const colors = getProjectColor(project.color)
            const count = crs.filter(c => c.projectId === project.id).length
            return (
              <Card key={project.id} className="group">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold',
                    colors.bg, colors.text
                  )}>
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} compte{count > 1 ? 's rendu' : ' rendu'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(project)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDelete(project)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal création/édition */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Modifier le projet' : 'Nouveau projet'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nom du projet"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="ex: Marketing, Technique, RH…"
            error={error}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />

          <div>
            <p className="text-sm font-medium mb-2">Couleur</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => {
                const c = getProjectColor(color)
                return (
                  <button
                    key={color}
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110',
                      c.dot.replace('bg-', 'bg-'),
                      form.color === color && 'ring-2 ring-offset-2 ring-ring scale-110'
                    )}
                  >
                    {form.color === color && <Check className="h-4 w-4 text-white" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation suppression */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Supprimer ce projet ?"
        description={`Le projet "${confirmDelete?.name}" sera supprimé. Les comptes rendus associés ne seront pas supprimés.`}
        confirmLabel="Supprimer"
      />
    </div>
  )
}
