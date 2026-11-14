import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useStore } from './lib/store'
import type { Role } from './lib/types'
import { cx } from './lib/utils'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { TechHome } from './pages/tech/TechHome'
import { ChecklistPage } from './pages/tech/ChecklistPage'
import { TechHistory } from './pages/tech/TechHistory'
import { Dashboard } from './pages/admin/Dashboard'
import { Checklists } from './pages/admin/Checklists'
import { Pendencias } from './pages/admin/Pendencias'
import { Agenda } from './pages/admin/Agenda'
import { Relatorios } from './pages/admin/Relatorios'
import { Cadastros } from './pages/admin/Cadastros'
import { Logs } from './pages/admin/Logs'

function Guard({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/tecnico'} replace />
  return <>{children}</>
}

function Toaster() {
  const { toasts } = useStore()
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'animate-in pointer-events-auto flex items-start gap-3 rounded-2xl border bg-surface px-4 py-3 text-sm font-medium shadow-2xl',
            t.tone === 'ok' && 'border-brand/40', t.tone === 'err' && 'border-danger/40', t.tone === 'info' && 'border-info/40',
          )}
        >
          {t.tone === 'ok' && <CheckCircle2 size={18} className="mt-px shrink-0 text-brand" />}
          {t.tone === 'err' && <XCircle size={18} className="mt-px shrink-0 text-danger" />}
          {t.tone === 'info' && <Info size={18} className="mt-px shrink-0 text-info" />}
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function App() {
  const { user } = useStore()
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/tecnico" element={<Guard role="tecnico"><Layout /></Guard>}>
          <Route index element={<TechHome />} />
          <Route path="epi" element={<ChecklistPage type="epi" />} />
          <Route path="veiculo" element={<ChecklistPage type="veiculo" />} />
          <Route path="historico" element={<TechHistory />} />
        </Route>
        <Route path="/admin" element={<Guard role="admin"><Layout /></Guard>}>
          <Route index element={<Dashboard />} />
          <Route path="checklists" element={<Checklists />} />
          <Route path="pendencias" element={<Pendencias />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="cadastros" element={<Cadastros />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/tecnico') : '/login'} replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
