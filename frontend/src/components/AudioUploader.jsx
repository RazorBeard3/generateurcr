import { useState, useRef } from 'react'
import { Upload, FileAudio, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'

const ACCEPTED = ['.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.webm', '.flac', '.aac', '.mov']
// Extensions uniquement — iOS Safari grise les fichiers audio si on mélange audio/* et video/mp4
const ACCEPTED_MIME = '.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.mov,.webm'
const MAX_SIZE_MB = 500

export function AudioUploader({ onFileReady }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  function handleFile(f) {
    setError(null)

    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux. Maximum : ${MAX_SIZE_MB} MB.`)
      return
    }

    const ext = '.' + f.name.split('.').pop().toLowerCase()
    const mimeOk = f.type.startsWith('audio/') || ['video/mp4', 'video/quicktime', 'video/webm'].includes(f.type)
    if (!ACCEPTED.includes(ext) && !mimeOk) {
      setError(`Format non supporté (${f.type || ext}). Formats acceptés : ${ACCEPTED.join(', ')}`)
      return
    }

    setFile(f)
    onFileReady?.(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function reset() {
    setFile(null)
    setError(null)
    onFileReady?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
          )}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {dragOver ? 'Déposez le fichier ici' : 'Glissez un fichier audio ou cliquez'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {ACCEPTED.join(', ')} · Max {MAX_SIZE_MB} MB
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" className="pointer-events-none">
            Choisir un fichier
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIME}
            className="hidden"
            onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]) }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border bg-muted/20 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileAudio className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
          </div>
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <Button variant="ghost" size="icon-sm" onClick={reset}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Lecteur audio si fichier sélectionné */}
      {file && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu</p>
          <audio controls src={URL.createObjectURL(file)} className="w-full h-9" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
