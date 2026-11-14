import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, CalendarDays, ClipboardCheck, FileBarChart, HardHat, History, Home, LayoutDashboard, ListChecks,
  LogOut, Menu, Moon, ScrollText, Sun, Truck, TriangleAlert, Users, X,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { cx, fmtDateTime } from '../lib/utils'
import { Logo } from './Logo'
import { Avatar } from './ui'

interface NavItem { to: string; label: string; icon: ReactNode; end?: boolean; badge?: number }

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('ipm-theme', next ? 'dark' : 'light') } catch { /* ignore */ }
    setDark(next)
  }
  return { dark, toggle }
}

export function Layout() {
  const { user, db, logout, markNotificationsRead } = useStore()
  const { dark, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const [bell, setBell] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const loc = useLocation()
  const nav = useNavigate()

  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (!user) return null
  const isAdmin = user.role === 'admin'
  const openPend = db.pendencias.filter((p) => p.status !== 'resolvida').length
  const notes = db.notifications.filter((n) => n.userId === user.id || (isAdmin && n.userId === 'admins'))
  const unread = notes.filter((n) => !n.read).length

  const groups: { title: string; items: NavItem[] }[] = isAdmin
    ? [
        { title: 'Painel', items: [{ to: '/admin', label: 'Visão geral', icon: <LayoutDashboard size={17} />, end: true }] },
        {
          title: 'Operação',
          items: [
            { to: '/admin/checklists', label: 'Checklists', icon: <ListChecks size={17} /> },
            { to: '/admin/pendencias', label: 'Pendências', icon: <TriangleAlert size={17} />, badge: openPend },
            { to: '/admin/agenda', label: 'Agenda', icon: <CalendarDays size={17} /> },
          ],
        },
        {
          title: 'Gestão',
          items: [
            { to: '/admin/relatorios', label: 'Relatórios', icon: <FileBarChart size={17} /> },
            { to: '/admin/cadastros', label: 'Cadastros', icon: <Users size={17} /> },
            { to: '/admin/logs', label: 'Logs do sistema', icon: <ScrollText size={17} /> },
          ],
        },
      ]
    : [
        { title: 'Meu dia', items: [{ to: '/tecnico', label: 'Início', icon: <Home size={17} />, end: true }] },
        {
          title: 'Checklists',
          items: [
            { to: '/tecnico/epi', label: "EPI's e materiais", icon: <HardHat size={17} /> },
            { to: '/tecnico/veiculo', label: 'Veículo', icon: <Truck size={17} /> },
            { to: '/tecnico/historico', label: 'Meu histórico', icon: <History size={17} /> },
          ],
        },
      ]

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-5">
        <Logo className="w-36" />
        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          <ClipboardCheck size={13} className="text-[#22d6a8]" /> Checklist operacional
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{g.title}</div>
            <div className="space-y-1">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    cx(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                      isActive ? 'bg-[#22d6a8]/12 text-white ring-1 ring-[#22d6a8]/35' : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-[#22d6a8]' : ''}>{it.icon}</span>
                      <span className="flex-1">{it.label}</span>
                      {!!it.badge && <span className="num rounded-full bg-[#f5b942]/15 px-2 text-[11px] font-bold text-[#f5b942]">{it.badge}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <Avatar name={user.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{user.name}</div>
          <div className="text-[11px] text-slate-400">{isAdmin ? 'Administrador' : 'Técnico'}</div>
        </div>
        <button
          onClick={() => { logout(); nav('/login') }}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          title="Sair"
          aria-label="Sair"
        >
          <LogOut size={17} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-[264px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-white/5 bg-[#0a1322] lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="animate-in absolute inset-y-0 left-0 w-[280px] bg-[#0a1322]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-5 right-4 p-1.5 text-slate-400" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-8">
        <button className="-ml-1 rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <Menu size={20} />
        </button>
        <img src="/logo-iprontomax.png" alt="iProntoMax" className="h-7 rounded-md bg-[#0a1322] px-1.5 py-1 lg:hidden" />
        <div className="flex-1" />
        <span className="hidden rounded-full border border-line px-3 py-1 text-[11px] font-bold text-muted sm:inline">
          {isAdmin ? 'Administrador' : 'Técnico'}
        </span>
        <button onClick={toggle} className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:text-fg" aria-label="Alternar tema" title={dark ? 'Modo claro' : 'Modo escuro'}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBell((b) => !b); if (!bell && unread) setTimeout(markNotificationsRead, 1500) }}
            className="relative grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:text-fg"
            aria-label="Notificações"
          >
            <Bell size={18} />
            {unread > 0 && <span className="num absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-warn px-1 text-[10px] font-bold text-black">{unread}</span>}
          </button>
          {bell && (
            <div className="animate-in absolute right-0 mt-2 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
              <div className="border-b border-line px-4 py-3 text-sm font-bold">Notificações</div>
              <div className="max-h-80 overflow-y-auto">
                {notes.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted">Nada por aqui.</div>}
                {notes.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setBell(false); if (n.link) nav(n.link) }}
                    className="flex w-full gap-3 border-b border-line/60 px-4 py-3 text-left last:border-0 hover:bg-surface-2"
                  >
                    <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-surface-3' : 'bg-brand')} />
                    <span>
                      <span className="block text-sm">{n.text}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">{fmtDateTime(n.at)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
