import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, Clock, FolderOpen, Settings, FileText, ChevronRight, MonitorCheck } from 'lucide-react'
import { cn, getProjectColor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/historique', icon: Clock,           label: 'Historique' },
  { to: '/projets',   icon: FolderOpen,      label: 'Projets' },
]

export function Sidebar({ projects = [], onClose }) {
  const navigate = useNavigate()

  return (
    <aside className="flex flex-col h-full bg-background border-r w-64 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Générateur CR</p>
          <p className="text-xs text-muted-foreground mt-0.5">Comptes rendus IA</p>
        </div>
      </div>

      {/* Nouveau CR */}
      <div className="px-3 pt-4 pb-2">
        <Button
          className="w-full justify-start gap-2"
          onClick={() => { navigate('/nouveau'); onClose?.() }}
        >
          <Plus className="h-4 w-4" />
          Nouveau CR
        </Button>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Projets */}
        {projects.length > 0 && (
          <div className="pt-4">
            <p className="px-3 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Projets
            </p>
            {projects.map(project => {
              const colors = getProjectColor(project.color)
              return (
                <NavLink
                  key={project.id}
                  to={`/historique?projet=${project.id}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )
                  }
                >
                  <span className={cn('h-2 w-2 rounded-full shrink-0', colors.dot)} />
                  <span className="truncate">{project.name}</span>
                </NavLink>
              )
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-0.5">
        <NavLink
          to="/projets"
          onClick={onClose}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Gérer les projets
        </NavLink>
        <NavLink
          to="/setup"
          onClick={onClose}
          className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          )}
        >
          <MonitorCheck className="h-4 w-4" />
          Environnement local
        </NavLink>
      </div>
    </aside>
  )
}
