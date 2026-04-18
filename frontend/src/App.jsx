import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { NewCR } from '@/pages/NewCR'
import { History } from '@/pages/History'
import { Projects } from '@/pages/Projects'
import { CRDetail } from '@/pages/CRDetail'
import { Setup } from '@/pages/Setup'

function AppRoutes() {
  const { session } = useAuth()

  // undefined = Supabase vérifie encore la session → spinner minimal
  if (session === undefined) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-sm text-gray-400">Chargement...</p>
    </div>
  )

  // null = non connecté → page de connexion
  if (session === null) return <Auth />

  // connecté → app normale
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/"           element={<Dashboard />} />
        <Route path="/nouveau"    element={<NewCR />} />
        <Route path="/historique" element={<History />} />
        <Route path="/projets"    element={<Projects />} />
        <Route path="/cr/:id"     element={<CRDetail />} />
        <Route path="/setup"      element={<Setup />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
