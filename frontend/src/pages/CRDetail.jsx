import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Share2, Trash2, Edit3, Copy, Check,
  Clock, FileText, Tag, AlignLeft, CheckCircle, Download
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { ShareModal } from '@/components/ShareModal'
import { Spinner } from '@/components/ui/Progress'
import { crsApi } from '@/lib/api'
import { formatDateTime, getProjectColor, cn, downloadFile, slugify, stripMarkdown } from '@/lib/utils'

// Rendu markdown simple (sans dépendance externe)
function MarkdownRenderer({ content }) {
  if (!content) return null

  // Conversion markdown → HTML (basique mais suffisant)
  const html = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex gap-2"><span class="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 shrink-0 inline-block"></span><span>$1</span></li>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="flex gap-2"><span class="mt-0.5 h-4 w-4 rounded bg-primary shrink-0 inline-block"></span><span>$1</span></li>')
    .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/(<li>[\s\S]+?<\/li>)(?=\n<li>|\n\n|$)/g, '<ul>$&</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')

  return (
    <div
      className="cr-content prose-sm"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  )
}

export function CRDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cr, setCR] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    crsApi.get(id)
      .then(data => { setCR(data); setEditContent(data.content || '') })
      .catch(() => navigate('/historique'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const updated = await crsApi.update(id, { content: editContent })
      setCR(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    await crsApi.delete(id)
    navigate('/historique')
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(cr.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="xl" />
      </div>
    )
  }

  if (!cr) return null

  const colors = getProjectColor(cr.projectColor || cr.color || 'blue')

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* En-tête du CR */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          {cr.projectName && (
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', colors.bg, colors.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
              {cr.projectName}
            </span>
          )}
          <h1 className="text-2xl font-bold">{cr.title || 'Sans titre'}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDateTime(cr.createdAt)}
            </span>
            {cr.meetingType && (
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                {cr.meetingType}
              </span>
            )}
            {cr.duration && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {cr.duration}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
            {copied ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier</>}
          </Button>
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => downloadFile(cr.content || '', `${slugify(cr.title)}.md`)}
          >
            <Download className="h-3.5 w-3.5" /> .md
          </Button>
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => downloadFile(stripMarkdown(cr.content || ''), `${slugify(cr.title)}.txt`)}
          >
            <Download className="h-3.5 w-3.5" /> .txt
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Partager
          </Button>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />
              Modifier
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="cr">
        <TabsList>
          <TabsTrigger value="cr">
            <FileText className="h-4 w-4 mr-2" />
            Compte rendu
          </TabsTrigger>
          <TabsTrigger value="transcription">
            <AlignLeft className="h-4 w-4 mr-2" />
            Transcription
          </TabsTrigger>
          {cr.config && (
            <TabsTrigger value="config">
              <CheckCircle className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
          )}
        </TabsList>

        {/* CR */}
        <TabsContent value="cr">
          <Card>
            <CardContent className="pt-6">
              {editing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={25}
                    className="font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} loading={saving} className="gap-2">
                      <Check className="h-4 w-4" /> Enregistrer
                    </Button>
                    <Button variant="outline" onClick={() => { setEditing(false); setEditContent(cr.content || '') }}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={cr.content} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transcription */}
        <TabsContent value="transcription">
          <Card>
            <CardContent className="pt-6">
              {cr.transcription ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {cr.transcription}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Transcription non disponible.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config */}
        {cr.config && (
          <TabsContent value="config">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {cr.config.context && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Contexte</p>
                    <p className="text-sm">{cr.config.context}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {cr.config.tone && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ton</p>
                      <Badge variant="secondary">{cr.config.tone}</Badge>
                    </div>
                  )}
                  {cr.config.outputType && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Output</p>
                      <Badge variant="secondary">{cr.config.outputType}</Badge>
                    </div>
                  )}
                </div>
                {cr.config.sections?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sections</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cr.config.sections.map(s => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {cr.config.formatRules && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Règles de format</p>
                    <p className="text-sm text-muted-foreground">{cr.config.formatRules}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} cr={cr} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Supprimer ce compte rendu ?"
        description={`"${cr.title || 'Sans titre'}" sera définitivement supprimé.`}
        confirmLabel="Supprimer"
      />
    </div>
  )
}
