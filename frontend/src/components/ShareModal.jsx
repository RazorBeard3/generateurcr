import { useState } from 'react'
import { Copy, Check, Mail, MessageSquare, Send, ExternalLink } from 'lucide-react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { buildShareLinks } from '@/lib/utils'

// Icônes SVG pour les plateformes
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function MessengerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z"/>
    </svg>
  )
}

export function ShareModal({ open, onClose, cr }) {
  const [copied, setCopied] = useState(false)
  const [copiedFull, setCopiedFull] = useState(false)

  if (!cr) return null

  const links = buildShareLinks(cr.title || 'Compte rendu', cr.content || '')

  async function copyToClipboard(text, setter) {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setter(true)
      setTimeout(() => setter(false), 2000)
    }
  }

  const fullText = `${cr.title || 'Compte rendu'}\n${'─'.repeat(40)}\n\n${cr.content || ''}`

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Partager le compte rendu"
      description={cr.title}
      size="lg"
    >
      <div className="space-y-5">

        {/* Partage direct */}
        <div>
          <p className="text-sm font-medium mb-3">Partage direct</p>
          <div className="grid grid-cols-2 gap-2">

            {/* WhatsApp */}
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors text-sm font-medium group"
            >
              <span className="text-green-500"><WhatsAppIcon /></span>
              <span>WhatsApp</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100" />
            </a>

            {/* Telegram */}
            <a
              href={links.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors text-sm font-medium group"
            >
              <span className="text-blue-500"><TelegramIcon /></span>
              <span>Telegram</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100" />
            </a>

            {/* Email */}
            <a
              href={links.email}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors text-sm font-medium group"
            >
              <Mail className="h-5 w-5 text-orange-500" />
              <span>Email</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100" />
            </a>

            {/* Messenger : copier + instructions */}
            <button
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors text-sm font-medium text-left"
              onClick={() => copyToClipboard(fullText, setCopied)}
            >
              <span className="text-blue-600"><MessengerIcon /></span>
              <span>Messenger</span>
              <span className="ml-auto text-xs text-muted-foreground">Copier</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Pour Messenger : copiez le texte ci-dessous, puis collez-le dans une conversation.
          </p>
        </div>

        {/* Copier le texte complet */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Texte complet</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => copyToClipboard(fullText, setCopiedFull)}
            >
              {copiedFull
                ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copié !</>
                : <><Copy className="h-3.5 w-3.5" /> Copier</>
              }
            </Button>
          </div>
          <Textarea
            value={fullText}
            readOnly
            rows={8}
            className="font-mono text-xs resize-none bg-muted/30"
          />
        </div>

      </div>
    </Dialog>
  )
}
