import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { projectsApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const PAGE_TITLES = {
  '/':           'Tableau de bord',
  '/nouveau':    'Nouveau compte rendu',
  '/historique': 'Historique',
  '/projets':    'Projets',
  '/setup':      'Environnement local',
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const location = useLocation()

  const pageTitle = PAGE_TITLES[location.pathname] || 'Compte rendu'

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [location.pathname]) // recharger si on navigue (ex: ajout de projet)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar projects={projects} />
      </div>

      {/* Sidebar mobile (overlay) */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar projects={projects} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ projects, setProjects }} />
        </main>
      </div>
    </div>
  )
}
