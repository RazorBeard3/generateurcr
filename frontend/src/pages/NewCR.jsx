import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import {
  Mic, Upload, FileText, Settings, Sparkles, Save,
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Copy, Check, Download
} from 'lucide-react'
import { AudioRecorder } from '@/components/AudioRecorder'
import { AudioUploader } from '@/components/AudioUploader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Progress, Spinner } from '@/components/ui/Progress'
import { ShareModal } from '@/components/ShareModal'
import { transcribeAudio, generateCR, crsApi } from '@/lib/api'
import { cn, downloadFile, stripMarkdown } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Audio',         icon: Mic },
  { id: 2, label: 'Transcription', icon: FileText },
  { id: 3, label: 'Configuration', icon: Settings },
  { id: 4, label: 'Génération',    icon: Sparkles },
  { id: 5, label: 'Sauvegarde',    icon: Save },
]

const SECTIONS_DEFAULT = [
  'Résumé global',
  'Décisions prises',
  'Actions à mener',
  'Responsables & Échéances',
  'Points bloquants',
  'Prochaines étapes',
]

const MEETING_TYPES = [
  'Réunion d\'équipe', 'Sprint Review', 'Sprint Planning', 'Réunion de lancement',
  'Comité de direction', 'Point client', 'Rétrospective', 'Atelier de travail',
  'Réunion commerciale', 'Réunion RH', 'Autre',
]

const TONES = ['Professionnel', 'Formel', 'Décontracté', 'Technique', 'Synthétique']

const OUTPUT_TYPES = [
  'Document structuré', 'Email', 'Rapport exécutif', 'Fiche action', 'Synthèse courte',
]

export function NewCR() {
  const navigate = useNavigate()
  const { projects } = useOutletContext()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(1)
  const [audioTab, setAudioTab] = useState(searchParams.get('tab') === 'import' ? 'import' : 'record')

  // Données du workflow
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState(null)

  // Config CR
  const [config, setConfig] = useState({
    context: '',
    meetingType: '',
    tone: 'Professionnel',
    sections: [...SECTIONS_DEFAULT],
    formatRules: '',
    outputType: 'Document structuré',
    specificInstructions: '',
  })

  // Résultat
  const [crContent, setCRContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState(null)
  const [noApiKey, setNoApiKey] = useState(false)

  // Sauvegarde
  const [saveForm, setSaveForm] = useState({ title: '', projectId: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedCR, setSavedCR] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Progression
  const progress = (step / STEPS.length) * 100

  // -- Étape 2 : transcription automatique à l'arrivée sur l'étape
  useEffect(() => {
    if (step === 2 && !transcription && !transcribing) {
      handleTranscribe()
    }
  }, [step])

  // -- Étape 4 : génération automatique
  useEffect(() => {
    if (step === 4 && !crContent && !generating) {
      handleGenerate()
    }
  }, [step])

  async function handleTranscribe() {
    const blob = audioBlob || audioFile
    if (!blob) {
      setTranscriptionError('Aucun fichier audio fourni.')
      return
    }
    setTranscribing(true)
    setTranscriptionError(null)
    try {
      const filename = audioFile?.name || 'recording.webm'
      const result = await transcribeAudio(blob, filename)
      setTranscription(result.transcription)
    } catch (err) {
      setTranscriptionError(err.message)
    } finally {
      setTranscribing(false)
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenerationError(null)
    try {
      const result = await generateCR(transcription, config)
      setCRContent(result.cr)
    } catch (err) {
      setGenerationError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!saveForm.title.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      const project = projects.find(p => p.id === saveForm.projectId)
      const cr = await crsApi.create({
        title: saveForm.title,
        projectId: saveForm.projectId || null,
        projectName: project?.name || null,
        projectColor: project?.color || null,
        meetingType: config.meetingType,
        transcription,
        content: crContent,
        config,
        audioPath: null,
      })
      setSavedCR(cr)
      setSaved(true)
    } catch (err) {
      setSaveError(err.message || 'La sauvegarde a échoué. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  function canGoNext() {
    if (step === 1) return !!(audioBlob || audioFile)
    if (step === 2) return transcription.trim().length > 0
    if (step === 3) return config.sections.length > 0
    if (step === 4) return crContent.trim().length > 0
    return true
  }

  function toggleSection(s) {
    setConfig(c => ({
      ...c,
      sections: c.sections.includes(s)
        ? c.sections.filter(x => x !== s)
        : [...c.sections, s],
    }))
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(crContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold">Nouveau compte rendu</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Étape {step} sur {STEPS.length} — {STEPS[step - 1].label}
        </p>
      </div>

      {/* Indicateur de progression */}
      <div className="space-y-3">
        <Progress value={progress} />
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map(s => {
            const Icon = s.icon
            const isDone = s.id < step
            const isCurrent = s.id === step
            return (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  isDone    && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary bg-primary/10',
                  !isDone && !isCurrent && 'border-muted-foreground/30 text-muted-foreground/40'
                )}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── ÉTAPE 1 : AUDIO ─── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Source audio</CardTitle>
            <CardDescription>Enregistrez ou importez un fichier audio à transcrire</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={audioTab} onValueChange={setAudioTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="record">
                  <Mic className="h-4 w-4 mr-2" />
                  Enregistrer
                </TabsTrigger>
                <TabsTrigger value="import">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer un fichier
                </TabsTrigger>
              </TabsList>
              <TabsContent value="record">
                <AudioRecorder
                  onAudioReady={(blob) => {
                    setAudioBlob(blob)
                    setAudioFile(null)
                  }}
                />
              </TabsContent>
              <TabsContent value="import">
                <AudioUploader
                  onFileReady={(file) => {
                    setAudioFile(file)
                    setAudioBlob(null)
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* ─── ÉTAPE 2 : TRANSCRIPTION ─── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Transcription</CardTitle>
            <CardDescription>
              Whisper medium analyse votre audio. La première fois, le modèle doit être téléchargé (~1.5 GB).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {transcribing && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Spinner size="xl" />
                <div className="text-center">
                  <p className="font-medium">Transcription en cours…</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Whisper medium traite votre audio. Cela peut prendre 1 à 2 minutes.
                  </p>
                </div>
              </div>
            )}

            {transcriptionError && (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-destructive">Erreur de transcription</p>
                  <p className="text-sm text-destructive/80 mt-0.5">{transcriptionError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleTranscribe}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            )}

            {!transcribing && (
              <>
                {transcription && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium text-green-600">Transcription terminée</p>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {transcription.split(' ').length} mots
                    </span>
                  </div>
                )}
                <Textarea
                  label={transcription ? 'Transcription brute (modifiable)' : 'Transcription — saisissez manuellement'}
                  value={transcription}
                  onChange={e => setTranscription(e.target.value)}
                  rows={12}
                  hint={transcriptionError
                    ? 'Whisper indisponible. Collez ou tapez la transcription manuellement pour continuer.'
                    : 'Vous pouvez corriger la transcription avant de générer le CR.'}
                  placeholder="Collez ou tapez ici le contenu de votre réunion…"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── ÉTAPE 3 : CONFIGURATION ─── */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contexte de la réunion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Type de réunion"
                list="meeting-types"
                value={config.meetingType}
                onChange={e => setConfig(c => ({ ...c, meetingType: e.target.value }))}
                placeholder="ex: Sprint Review, Comité de direction…"
              />
              <datalist id="meeting-types">
                {MEETING_TYPES.map(t => <option key={t} value={t} />)}
              </datalist>

              <Textarea
                label="Contexte métier"
                value={config.context}
                onChange={e => setConfig(c => ({ ...c, context: e.target.value }))}
                rows={3}
                placeholder="Décrivez le projet, l'équipe, l'objectif de cette réunion…"
                hint="Plus le contexte est précis, meilleur sera le CR."
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Ton souhaité"
                  options={TONES.map(t => ({ value: t, label: t }))}
                  value={config.tone}
                  onChange={e => setConfig(c => ({ ...c, tone: e.target.value }))}
                />
                <Select
                  label="Type d'output"
                  options={OUTPUT_TYPES.map(t => ({ value: t, label: t }))}
                  value={config.outputType}
                  onChange={e => setConfig(c => ({ ...c, outputType: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Structure du compte rendu</CardTitle>
              <CardDescription>Sélectionnez les rubriques à inclure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SECTIONS_DEFAULT.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSection(s)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      config.sections.includes(s)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-input hover:bg-accent'
                    )}
                  >
                    {config.sections.includes(s) && <Check className="inline h-3 w-3 mr-1" />}
                    {s}
                  </button>
                ))}
              </div>

              <Textarea
                label="Règles rédactionnelles (optionnel)"
                value={config.formatRules}
                onChange={e => setConfig(c => ({ ...c, formatRules: e.target.value }))}
                rows={2}
                placeholder="ex: Utiliser des listes à puces, limiter à 500 mots, inclure un titre…"
              />

              <Textarea
                label="Consignes spécifiques (optionnel)"
                value={config.specificInstructions}
                onChange={e => setConfig(c => ({ ...c, specificInstructions: e.target.value }))}
                rows={2}
                placeholder="ex: Mettre en avant les décisions urgentes, anonymiser les participants…"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── ÉTAPE 4 : GÉNÉRATION ─── */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Compte rendu généré</CardTitle>
            <CardDescription>Claude génère votre CR à partir de la transcription et de votre configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generating && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Spinner size="xl" />
                <div className="text-center">
                  <p className="font-medium">Génération en cours…</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Claude rédige votre compte rendu. Cela prend généralement 15 à 30 secondes.
                  </p>
                </div>
              </div>
            )}

            {generationError && (
              <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-destructive">Erreur de génération</p>
                  <p className="text-sm text-destructive/80 mt-0.5">{generationError}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleGenerate}>
                    Réessayer
                  </Button>
                </div>
              </div>
            )}

            {!generating && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {crContent && !generationError && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-sm font-medium text-green-600">CR généré avec succès</p>
                      </>
                    )}
                    {!crContent && !generationError && (
                      <p className="text-sm text-muted-foreground">Rédigez ou collez votre CR ci-dessous.</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {crContent && (
                      <>
                        <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
                          {copied ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier</>}
                        </Button>
                        <Button
                          variant="outline" size="sm" className="gap-1.5"
                          onClick={() => downloadFile(crContent, 'compte-rendu.md')}
                        >
                          <Download className="h-3.5 w-3.5" /> .md
                        </Button>
                        <Button
                          variant="outline" size="sm" className="gap-1.5"
                          onClick={() => downloadFile(stripMarkdown(crContent), 'compte-rendu.txt')}
                        >
                          <Download className="h-3.5 w-3.5" /> .txt
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={handleGenerate} loading={generating}>
                      {crContent ? 'Regénérer' : 'Générer'}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={crContent}
                  onChange={e => setCRContent(e.target.value)}
                  rows={20}
                  className="font-mono text-xs"
                  hint={generationError
                    ? 'Claude indisponible. Rédigez ou collez votre CR manuellement pour continuer.'
                    : 'Vous pouvez modifier le CR avant de le sauvegarder.'}
                  placeholder="Le compte rendu généré apparaîtra ici. Vous pouvez aussi le rédiger manuellement…"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── ÉTAPE 5 : SAUVEGARDE ─── */}
      {step === 5 && (
        <div className="space-y-4">
          {!saved ? (
            <Card>
              <CardHeader>
                <CardTitle>Sauvegarder le compte rendu</CardTitle>
                <CardDescription>Donnez un titre et associez-le à un projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Titre du compte rendu"
                  value={saveForm.title}
                  onChange={e => setSaveForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="ex: Réunion lancement campagne Q1"
                  autoFocus
                />
                <Select
                  label="Projet / Thématique"
                  placeholder="— Aucun projet —"
                  options={projects.map(p => ({ value: p.id, label: p.name }))}
                  value={saveForm.projectId}
                  onChange={e => setSaveForm(f => ({ ...f, projectId: e.target.value }))}
                  hint="Vous pouvez créer de nouveaux projets dans l'onglet Projets."
                />
                {saveError && (
                  <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{saveError}</p>
                  </div>
                )}
                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={!saveForm.title.trim()}
                  className="w-full"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="flex flex-col items-center py-10 gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">CR sauvegardé !</h3>
                  <p className="text-sm text-muted-foreground mt-1">{saveForm.title}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <Button onClick={() => navigate(`/cr/${savedCR?.id}`)} variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" /> Voir le CR
                  </Button>
                  <Button onClick={() => setShareOpen(true)} variant="outline" className="gap-2">
                    Partager
                  </Button>
                  <Button onClick={() => navigate('/')} variant="ghost">
                    Retour au dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Navigation */}
      {!saved && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          {step < STEPS.length && (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canGoNext()}
              className="gap-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        cr={savedCR ? { ...savedCR, content: crContent } : null}
      />
    </div>
  )
}
