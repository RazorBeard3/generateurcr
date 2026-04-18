import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Play, Pause, Upload, Trash2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'

export function AudioRecorder({ onAudioReady }) {
  const [state, setState] = useState('idle') // idle | requesting | recording | paused | done
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function startRecording() {
    setError(null)
    setState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setState('done')
        onAudioReady?.(blob, duration)
        // Libérer le micro
        streamRef.current?.getTracks().forEach(t => t.stop())
      }

      recorder.start(1000)
      setState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
    } catch (err) {
      setState('idle')
      if (err.name === 'NotAllowedError') {
        setError('Accès au micro refusé. Autorisez l\'accès dans les paramètres du navigateur.')
      } else {
        setError(`Impossible d'accéder au micro : ${err.message}`)
      }
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  function pauseRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      clearInterval(timerRef.current)
      setState('paused')
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
      setState('recording')
    }
  }

  function reset() {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setAudioBlob(null)
    setDuration(0)
    setState('idle')
    onAudioReady?.(null, 0)
  }

  function formatDuration(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Zone d'enregistrement */}
      <div className={cn(
        'flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed p-10 transition-colors',
        state === 'recording' && 'border-red-400 bg-red-50 dark:bg-red-950/20',
        state === 'done' && 'border-green-400 bg-green-50 dark:bg-green-950/20',
        state === 'idle' || state === 'requesting' ? 'border-border hover:border-muted-foreground/50' : '',
      )}>

        {/* Icône principale */}
        <div className={cn(
          'relative flex h-20 w-20 items-center justify-center rounded-full transition-all',
          state === 'recording' && 'bg-red-100 dark:bg-red-900/40',
          state === 'done' && 'bg-green-100 dark:bg-green-900/40',
          (state === 'idle' || state === 'paused') && 'bg-muted',
        )}>
          {/* Anneau animé quand on enregistre */}
          {state === 'recording' && (
            <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
          )}

          {state === 'done'
            ? <CheckCircle className="h-9 w-9 text-green-600" />
            : state === 'recording' || state === 'paused'
            ? <Mic className="h-9 w-9 text-red-600" />
            : <Mic className="h-9 w-9 text-muted-foreground" />
          }
        </div>

        {/* Timer */}
        {(state === 'recording' || state === 'paused' || state === 'done') && (
          <div className="text-center">
            <p className={cn(
              'text-4xl font-mono font-bold tabular-nums',
              state === 'recording' && 'text-red-600',
              state === 'paused' && 'text-muted-foreground',
              state === 'done' && 'text-green-600',
            )}>
              {formatDuration(duration)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {state === 'recording' && 'Enregistrement en cours…'}
              {state === 'paused' && 'En pause'}
              {state === 'done' && 'Enregistrement terminé'}
            </p>
          </div>
        )}

        {/* Visualiseur animé */}
        {state === 'recording' && (
          <div className="flex items-center gap-1 h-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-red-500"
                style={{
                  height: '100%',
                  animation: `pulse_bar 0.8s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                  transformOrigin: 'center',
                }}
              />
            ))}
          </div>
        )}

        {/* Message idle */}
        {state === 'idle' && (
          <div className="text-center">
            <p className="text-sm font-medium">Cliquez pour enregistrer</p>
            <p className="text-xs text-muted-foreground mt-1">Formats supportés : WebM, MP4</p>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-center gap-3">
        {state === 'idle' && (
          <Button onClick={startRecording} className="gap-2" size="lg">
            <Mic className="h-5 w-5" />
            Démarrer l'enregistrement
          </Button>
        )}

        {state === 'requesting' && (
          <Button disabled loading size="lg">
            Accès au micro…
          </Button>
        )}

        {state === 'recording' && (
          <>
            <Button variant="outline" onClick={pauseRecording} className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button variant="destructive" onClick={stopRecording} className="gap-2">
              <Square className="h-4 w-4 fill-current" />
              Arrêter
            </Button>
          </>
        )}

        {state === 'paused' && (
          <>
            <Button onClick={resumeRecording} className="gap-2">
              <Play className="h-4 w-4" />
              Reprendre
            </Button>
            <Button variant="destructive" onClick={stopRecording} className="gap-2">
              <Square className="h-4 w-4 fill-current" />
              Terminer
            </Button>
          </>
        )}

        {state === 'done' && (
          <Button variant="outline" onClick={reset} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Recommencer
          </Button>
        )}
      </div>

      {/* Lecteur audio une fois terminé */}
      {state === 'done' && audioUrl && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu de l'enregistrement</p>
          <audio controls src={audioUrl} className="w-full h-9" />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <MicOff className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
