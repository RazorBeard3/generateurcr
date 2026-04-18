import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const CHECKS = [
  {
    key: 'ollama',
    label: 'Ollama',
    description: 'Serveur LLM local pour la génération de CR',
    hint: 'ollama serve',
  },
  {
    key: 'model',
    label: 'Modèle generateur-cr',
    description: 'Modèle IA spécialisé pour les comptes rendus',
    hint: 'ollama create generateur-cr -f backend/ollama/Modelfile',
  },
  {
    key: 'python',
    label: 'Python 3',
    description: 'Requis pour la transcription Whisper',
    hint: 'Installez Python 3 depuis python.org',
  },
  {
    key: 'whisper',
    label: 'Whisper',
    description: 'Moteur de transcription audio locale',
    hint: 'pip install openai-whisper',
  },
  {
    key: 'ffmpeg',
    label: 'ffmpeg',
    description: 'Traitement et conversion des fichiers audio',
    hint: 'brew install ffmpeg',
  },
]

export function Setup() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  async function runCheck() {
    setLoading(true)
    try {
      const res = await fetch('/api/setup/check')
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runCheck() }, [])

  const allOk = status && Object.values(status).every(Boolean)
  const hasError = status && Object.values(status).some(v => !v)

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Environnement local</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vérification des dépendances nécessaires au fonctionnement local
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={runCheck} disabled={loading} className="gap-2">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Relancer
        </Button>
      </div>

      {/* Bandeau global */}
      {!loading && allOk && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Tout est opérationnel. L'application fonctionne entièrement en local.
          </p>
        </div>
      )}
      {!loading && hasError && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Certains composants sont manquants. Suivez les instructions ci-dessous pour les installer.
          </p>
        </div>
      )}

      {/* Liste des checks */}
      <Card>
        <CardHeader>
          <CardTitle>Dépendances</CardTitle>
          <CardDescription>Chaque composant est vérifié en temps réel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CHECKS.map(({ key, label, description, hint }) => {
            const ok = status?.[key]
            return (
              <div key={key} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="mt-0.5 shrink-0">
                  {loading
                    ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    : ok
                      ? <CheckCircle className="h-5 w-5 text-green-500" />
                      : <XCircle className="h-5 w-5 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    {!loading && (
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded font-medium',
                        ok
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      )}>
                        {ok ? 'OK' : 'Non installé'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  {!loading && !ok && (
                    <p className="mt-1.5 text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded">
                      {hint}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
