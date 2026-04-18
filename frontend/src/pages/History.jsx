import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { Search, Filter, Plus, FileText } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { CRCard } from '@/components/CRCard'
import { ShareModal } from '@/components/ShareModal'
import { crsApi } from '@/lib/api'
import { cn, getProjectColor } from '@/lib/utils'

export function History() {
  const navigate = useNavigate()
  const { projects } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const [crs, setCRs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState(searchParams.get('projet') || '')
  const [sortBy, setSortBy] = useState('date_desc')
  const [shareTarget, setShareTarget] = useState(null)

  useEffect(() => {
    setLoading(true)
    crsApi.list()
      .then(setCRs)
      .catch(() => setCRs([]))
      .finally(() => setLoading(false))
  }, [])

  // Appliquer les filtres en local
  const filtered = crs
    .filter(cr => {
      if (selectedProject && cr.projectId !== selectedProject) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          cr.title?.toLowerCase().includes(q) ||
          cr.content?.toLowerCase().includes(q) ||
          cr.projectName?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'date_asc')  return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'title')     return (a.title || '').localeCompare(b.title || '')
      return 0
    })

  const projectOptions = [
    { value: '', label: 'Tous les projets' },
    ...projects.map(p => ({ value: p.id, label: p.name })),
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Historique</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {crs.length} compte{crs.length > 1 ? 's rendu' : ' rendu'} sauvegardé{crs.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/nouveau')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau CR
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <Select
          options={projectOptions}
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="sm:w-48"
        />
        <Select
          options={[
            { value: 'date_desc', label: 'Plus récent' },
            { value: 'date_asc',  label: 'Plus ancien' },
            { value: 'title',     label: 'Titre A→Z' },
          ]}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="sm:w-40"
        />
      </div>

      {/* Filtre actif par projet */}
      {selectedProject && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtré par :</span>
          {(() => {
            const p = projects.find(p => p.id === selectedProject)
            if (!p) return null
            const colors = getProjectColor(p.color)
            return (
              <button
                onClick={() => setSelectedProject('')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  colors.bg, colors.text
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                {p.name}
                <span className="ml-1 opacity-60">×</span>
              </button>
            )
          })()}
        </div>
      )}

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">
            {search || selectedProject ? 'Aucun résultat' : 'Aucun compte rendu'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || selectedProject
              ? 'Essayez d\'autres critères de recherche.'
              : 'Créez votre premier compte rendu.'}
          </p>
          {!search && !selectedProject && (
            <Button onClick={() => navigate('/nouveau')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau CR
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cr => (
            <CRCard
              key={cr.id}
              cr={cr}
              onDeleted={id => setCRs(prev => prev.filter(c => c.id !== id))}
              onShare={setShareTarget}
            />
          ))}
        </div>
      )}

      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        cr={shareTarget}
      />
    </div>
  )
}
