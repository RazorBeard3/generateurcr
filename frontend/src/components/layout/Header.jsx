import { Moon, Sun, Menu, Bell } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/Button'

export function Header({ onMenuClick, title }) {
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Bouton menu mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo + Titre de la page */}
      <div className="hidden sm:flex items-center gap-2.5">
        <img src="/logo.svg" alt="Logo" className="h-7 w-7 rounded-md" />
        {title && <h1 className="text-base font-semibold">{title}</h1>}
      </div>

      <div className="flex-1" />

      {/* Actions droite */}
      <div className="flex items-center gap-1">
        {/* Toggle dark mode */}
        <Button variant="ghost" size="icon" onClick={toggle} title="Changer le thème">
          {theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>
      </div>
    </header>
  )
}
