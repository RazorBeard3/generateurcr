import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Plus, Mic, Upload, TrendingUp, FileText, Clock, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CRCard } from '@/components/CRCard'
import { ShareModal } from '@/components/ShareModal'
import { crsApi } from '@/lib/api'
import { formatRelativeDate, getProjectColor, cn } from '@/lib/utils'

export function Dashboard() {
  const navigate = useNavigate()
  const { projects } = useOutletContext()
  const [crs, setCRs] = useState([])
  const [loading, setLoading] = useState(true)
  const [shareTarget, setShareTarget] = useState(null)

  useEffect(() => {
    crsApi.list()
      .then(setCRs)
      .catch(() => setCRs([]))
      .finally(() => setLoading(false))
  }, [])

  const recentCRs = crs.slice(0, 6)

  // Statistiques
  const stats = {
    total: crs.length,
    thisWeek: crs.filter(cr => {
      const d = new Date(cr.createdAt)
      const now = new Date()
      const diff = (now - d) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }).length,
    projects: projects.length,
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez et générez vos comptes rendus de réunion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/nouveau?tab=import')} className="gap-2">
            <Upload className="h-4 w-4" />
            Importer
          </Button>
          <Button onClick={() => navigate('/nouveau')} className="gap-2">
            <Mic className="h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={FileText}
          label="Total des CRs"
          value={stats.total}
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          icon={TrendingUp}
          label="Cette semaine"
          value={stats.thisWeek}
          color="text-green-600"
          bg="bg-green-50 dark:bg-green-950/30"
        />
        <StatCard
          icon={FolderOpen}
          label="Projets actifs"
          value={stats.projects}
          color="text-purple-600"
          bg="bg-purple-50 dark:bg-purple-950/30"
        />
      </div>

      {/* Actions rapides */}
      <div>
        <h2 className="text-base font-semibold mb-3">Démarrer rapidement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction
            icon={Mic}
            title="Nouvel enregistrement"
            description="Enregistrez une réunion et générez un CR automatiquement"
            onClick={() => navigate('/nouveau')}
            iconColor="text-red-500"
            iconBg="bg-red-50 dark:bg-red-950/30"
          />
          <QuickAction
            icon={Upload}
            title="Importer un fichier audio"
            description="Importez un enregistrement existant (MP3, MP4, WAV…)"
            onClick={() => navigate('/nouveau?tab=import')}
            iconColor="text-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-950/30"
          />
        </div>
      </div>

      {/* CRs récents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Comptes rendus récents</h2>
          {crs.length > 6 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/historique')}>
              Voir tout
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 rounded-lg border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : recentCRs.length === 0 ? (
          <EmptyState onNew={() => navigate('/nouveau')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCRs.map(cr => (
              <CRCard
                key={cr.id}
                cr={cr}
                onDeleted={id => setCRs(prev => prev.filter(c => c.id !== id))}
                onShare={setShareTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Projets */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Projets</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projets')}>
              Gérer
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {projects.map(p => {
              const colors = getProjectColor(p.color)
              const count = crs.filter(c => c.projectId === p.id).length
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/historique?projet=${p.id}`)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80',
                    colors.bg, colors.text
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
                  {p.name}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              )
            })}
          </div>
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

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', bg)}>
          <Icon className={cn('h-6 w-6', color)} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickAction({ icon: Icon, title, description, onClick, iconColor, iconBg }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 rounded-xl border p-5 text-left hover:bg-accent/50 transition-colors group"
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  )
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">Aucun compte rendu pour l'instant</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Enregistrez votre première réunion ou importez un fichier audio pour commencer.
      </p>
      <Button onClick={onNew} className="gap-2">
        <Plus className="h-4 w-4" />
        Créer un premier CR
      </Button>
    </div>
  )
}
