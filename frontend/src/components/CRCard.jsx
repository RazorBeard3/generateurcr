import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Trash2, Share2, FileText, MoreVertical, Eye } from 'lucide-react'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ConfirmDialog } from './ui/Dialog'
import { formatRelativeDate, truncate, stripMarkdown, getProjectColor, cn } from '@/lib/utils'
import { crsApi } from '@/lib/api'

export function CRCard({ cr, onDeleted, onShare }) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const colors = getProjectColor(cr.projectColor || cr.color || 'blue')
  const excerpt = truncate(stripMarkdown(cr.content), 130)

  async function handleDelete() {
    setDeleting(true)
    try {
      await crsApi.delete(cr.id)
      onDeleted?.(cr.id)
    } catch {
      // silencieux pour la V1
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="group relative hover:shadow-md transition-shadow overflow-hidden">
        {/* Bordure colorée à gauche */}
        <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-lg', colors.dot)} />

        <CardContent className="pl-5 pr-4 py-4">
          <div className="flex items-start justify-between gap-3">
            {/* Contenu principal */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/cr/${cr.id}`)}
            >
              {/* En-tête : badge projet + date */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {cr.projectName && (
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', colors.bg, colors.text)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                    {cr.projectName}
                  </span>
                )}
                {cr.meetingType && (
                  <Badge variant="outline" className="text-xs">{cr.meetingType}</Badge>
                )}
              </div>

              {/* Titre */}
              <h3 className="font-semibold text-sm leading-tight mb-1.5 line-clamp-1">
                {cr.title || 'Sans titre'}
              </h3>

              {/* Aperçu */}
              {excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {excerpt}
                </p>
              )}

              {/* Métadonnées */}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeDate(cr.createdAt)}
                </span>
                {cr.duration && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {cr.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setMenuOpen(v => !v)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border bg-card shadow-lg py-1">
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { navigate(`/cr/${cr.id}`); setMenuOpen(false) }}
                    >
                      <Eye className="h-4 w-4" /> Voir
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => { onShare?.(cr); setMenuOpen(false) }}
                    >
                      <Share2 className="h-4 w-4" /> Partager
                    </button>
                    <hr className="my-1 border-border" />
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Supprimer ce compte rendu ?"
        description={`"${cr.title || 'Sans titre'}" sera définitivement supprimé.`}
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
      />
    </>
  )
}
