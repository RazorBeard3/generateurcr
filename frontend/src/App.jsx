import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { NewCR } from '@/pages/NewCR'
import { History } from '@/pages/History'
import { Projects } from '@/pages/Projects'
import { CRDetail } from '@/pages/CRDetail'
import { Setup } from '@/pages/Setup'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </ThemeProvider>
  )
}
