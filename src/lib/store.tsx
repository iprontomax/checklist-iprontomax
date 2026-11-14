import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AgendaEvent, CatalogItem, Checklist, DB, Pendencia, PendStatus, Role, User, Vehicle } from './types'
import { buildSeed, DB_VERSION } from './seed'
import { today, uid } from './utils'

const DB_KEY = 'ipm-db'
const SESSION_KEY = 'ipm-session'

function load(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const db = JSON.parse(raw) as DB
      if (db.version === DB_VERSION) return db
    }
  } catch { /* armazenamento indisponível */ }
  return buildSeed()
}

export interface Toast { id: string; text: string; tone: 'ok' | 'err' | 'info' }

type NewChecklist = Omit<Checklist, 'id' | 'createdAt' | 'result' | 'validated' | 'date'>

interface Store {
  db: DB
  user: User | null
  toasts: Toast[]
  toast: (text: string, tone?: Toast['tone']) => void
  login: (username: string, password: string, role: Role) => string | null
  logout: () => void
  submitChecklist: (c: NewChecklist) => Checklist
  validateChecklist: (id: string) => void
  savePendencia: (p: Partial<Pendencia> & { title: string }) => Pendencia
  movePendencia: (id: string, status: PendStatus) => void
  commentPendencia: (id: string, text: string) => void
  deletePendencia: (id: string) => void
  justifyAbsence: (techId: string, date: string, text: string) => void
  forwardAbsence: (techId: string, date: string, toUserId: string) => void
  saveEvent: (e: Omit<AgendaEvent, 'id'> & { id?: string }) => void
  deleteEvent: (id: string) => void
  saveUser: (u: Omit<User, 'id'> & { id?: string }) => void
  saveVehicle: (v: Omit<Vehicle, 'id'> & { id?: string }) => void
  saveItem: (i: Omit<CatalogItem, 'id'> & { id?: string }) => void
  removeItem: (id: string) => void
  markNotificationsRead: () => void
  resetDemo: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try { return localStorage.getItem(SESSION_KEY) } catch { return null }
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const warned = useRef(false)

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = uid()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    } catch {
      if (!warned.current) {
        warned.current = true
        toast('Armazenamento do navegador cheio — fotos antigas podem não ser salvas.', 'err')
      }
    }
  }, [db, toast])

  const user = useMemo(() => db.users.find((u) => u.id === sessionId && u.active) ?? null, [db.users, sessionId])
  const actor = user?.name ?? 'Sistema'

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next: DB = structuredClone(prev)
      fn(next)
      return next
    })
  }, [])

  const log = (d: DB, event: string, by = actor, ref?: string) => {
    d.logs.unshift({ id: uid('lg'), at: new Date().toISOString(), event, actor: by, ref })
    if (d.logs.length > 600) d.logs.length = 600
  }

  const login: Store['login'] = (username, password, role) => {
    const u = db.users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase())
    if (!u || u.password !== password) {
      update((d) => log(d, 'Falha de login', 'Sistema'))
      return 'Usuário ou senha inválidos.'
    }
    if (!u.active) return 'Este usuário está desativado.'
    if (u.role !== role) return role === 'admin' ? 'Este usuário não tem acesso administrativo.' : 'Use o acesso de administrador para este usuário.'
    try { localStorage.setItem(SESSION_KEY, u.id) } catch { /* ignore */ }
    setSessionId(u.id)
    update((d) => log(d, 'Login realizado', u.name))
    return null
  }

  const logout = () => {
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    if (user) update((d) => log(d, 'Logout', user.name))
    setSessionId(null)
  }

  const submitChecklist: Store['submitChecklist'] = (c) => {
    const failed = c.answers.filter((a) => a.mandatory && a.answer === 'nao')
    const ck: Checklist = {
      ...c, id: uid('ck'), date: today(), createdAt: new Date().toISOString(),
      result: failed.length ? 'bloqueado' : 'liberado', validated: false,
    }
    update((d) => {
      d.checklists.push(ck)
      const tech = d.users.find((u) => u.id === ck.techId)
      const label = ck.type === 'epi' ? 'de EPI' : 'de veículo'
      log(d, `Checklist ${label} enviado (${ck.result})`, tech?.name, ck.id)
      if (ck.type === 'veiculo' && ck.vehicleId) {
        const v = d.vehicles.find((x) => x.id === ck.vehicleId)
        if (v) {
          if (ck.km && ck.km > v.km) v.km = ck.km
          v.status = failed.length ? 'bloqueado' : 'em_rota'
        }
      }
      failed.forEach((a) => {
        d.pendencias.unshift({
          id: uid('p'), title: `${a.name} — ${ck.type === 'epi' ? 'reposição' : 'manutenção'}`,
          description: `Bloqueio gerado pelo checklist ${label} de ${tech?.name}.${a.note ? ' Obs.: ' + a.note : ''}`,
          status: 'aberta', priority: 'alta', origin: 'checklist', checklistId: ck.id, techId: ck.techId,
          vehicleId: ck.type === 'veiculo' ? ck.vehicleId : undefined, dueDate: today(), createdAt: ck.createdAt,
          history: [{ at: ck.createdAt, by: 'Sistema', text: 'Pendência criada automaticamente pelo checklist.' }],
        })
      })
      if (failed.length) {
        d.notifications.unshift({
          id: uid('n'), at: ck.createdAt, userId: 'admins', read: false, link: '/admin/pendencias',
          text: `${tech?.name} foi BLOQUEADO no checklist ${label}: ${failed.map((f) => f.name).join(', ')}.`,
        })
      }
    })
    return ck
  }

  const validateChecklist = (id: string) =>
    update((d) => {
      const c = d.checklists.find((x) => x.id === id)
      if (c) { c.validated = true; c.validatedBy = user?.id; log(d, 'Checklist validado', actor, id) }
    })

  const savePendencia: Store['savePendencia'] = (p) => {
    const now = new Date().toISOString()
    let saved!: Pendencia
    update((d) => {
      const existing = p.id ? d.pendencias.find((x) => x.id === p.id) : undefined
      if (existing) {
        Object.assign(existing, p)
        existing.history.push({ at: now, by: actor, text: 'Pendência editada.' })
        saved = existing
        log(d, 'Pendência atualizada', actor, existing.id)
      } else {
        saved = {
          status: 'aberta', priority: 'media', origin: 'manual', description: '', history: [], ...p,
          id: uid('p'), createdAt: now,
        }
        saved.history.push({ at: now, by: actor, text: 'Pendência criada.' })
        d.pendencias.unshift(saved)
        log(d, 'Pendência criada', actor, saved.id)
      }
    })
    return saved
  }

  const statusLabel: Record<PendStatus, string> = { aberta: 'Aberta', andamento: 'Em andamento', resolvida: 'Resolvida' }
  const movePendencia = (id: string, status: PendStatus) =>
    update((d) => {
      const p = d.pendencias.find((x) => x.id === id)
      if (!p || p.status === status) return
      p.status = status
      p.resolvedAt = status === 'resolvida' ? new Date().toISOString() : undefined
      p.history.push({ at: new Date().toISOString(), by: actor, text: `Status alterado para "${statusLabel[status]}".` })
      if (status === 'resolvida' && p.vehicleId) {
        const stillBlocked = d.pendencias.some((o) => o.id !== p.id && o.vehicleId === p.vehicleId && o.status !== 'resolvida' && o.origin === 'checklist')
        const v = d.vehicles.find((x) => x.id === p.vehicleId)
        if (v && v.status === 'bloqueado' && !stillBlocked) v.status = 'disponivel'
      }
      log(d, `Pendência movida: ${statusLabel[status]}`, actor, id)
    })

  const commentPendencia = (id: string, text: string) =>
    update((d) => {
      const p = d.pendencias.find((x) => x.id === id)
      if (p) p.history.push({ at: new Date().toISOString(), by: actor, text })
    })

  const deletePendencia = (id: string) =>
    update((d) => {
      d.pendencias = d.pendencias.filter((p) => p.id !== id)
      d.agenda = d.agenda.map((e) => (e.pendenciaId === id ? { ...e, pendenciaId: undefined } : e))
      log(d, 'Pendência excluída', actor, id)
    })

  const justifyAbsence = (techId: string, date: string, text: string) =>
    update((d) => {
      const tech = d.users.find((u) => u.id === techId)
      const now = new Date().toISOString()
      d.pendencias.unshift({
        id: uid('p'), title: `Checklist ausente — ${tech?.name}`, description: `Justificativa (${date}): ${text}`,
        status: 'resolvida', priority: 'baixa', origin: 'ausencia', techId, createdAt: now, resolvedAt: now, dueDate: date,
        history: [{ at: now, by: actor, text: `Ausência justificada: ${text}` }],
      })
      log(d, 'Ausência de checklist justificada', actor)
    })

  const forwardAbsence = (techId: string, date: string, toUserId: string) =>
    update((d) => {
      const tech = d.users.find((u) => u.id === techId)
      const to = d.users.find((u) => u.id === toUserId)
      const now = new Date().toISOString()
      d.pendencias.unshift({
        id: uid('p'), title: `Checklist ausente — ${tech?.name}`, description: `O técnico não enviou o checklist diário de ${date}. Verificar o motivo.`,
        status: 'aberta', priority: 'media', origin: 'ausencia', techId, assignedTo: toUserId, createdAt: now, dueDate: date,
        history: [{ at: now, by: actor, text: `Encaminhada para ${to?.name}.` }],
      })
      d.notifications.unshift({ id: uid('n'), at: now, userId: toUserId, read: false, text: `${actor} encaminhou para você: checklist ausente de ${tech?.name}.` })
      log(d, `Alerta encaminhado para ${to?.name}`, actor)
    })

  const saveEvent: Store['saveEvent'] = (e) =>
    update((d) => {
      if (e.id) d.agenda = d.agenda.map((x) => (x.id === e.id ? { ...x, ...e, id: x.id } : x))
      else d.agenda.push({ ...e, id: uid('a') })
      log(d, e.id ? 'Evento da agenda atualizado' : 'Evento agendado', actor)
    })

  const deleteEvent = (id: string) => update((d) => { d.agenda = d.agenda.filter((x) => x.id !== id) })

  const saveUser: Store['saveUser'] = (u) =>
    update((d) => {
      if (u.id) d.users = d.users.map((x) => (x.id === u.id ? { ...x, ...u, id: x.id } : x))
      else d.users.push({ ...u, id: uid('u') })
      log(d, u.id ? `Usuário editado: ${u.name}` : `Usuário cadastrado: ${u.name}`, actor)
    })

  const saveVehicle: Store['saveVehicle'] = (v) =>
    update((d) => {
      if (v.id) d.vehicles = d.vehicles.map((x) => (x.id === v.id ? { ...x, ...v, id: x.id } : x))
      else d.vehicles.push({ ...v, id: uid('v') })
      log(d, v.id ? `Veículo editado: ${v.plate}` : `Veículo cadastrado: ${v.plate}`, actor)
    })

  const saveItem: Store['saveItem'] = (i) =>
    update((d) => {
      if (i.id) d.catalog = d.catalog.map((x) => (x.id === i.id ? { ...x, ...i, id: x.id } : x))
      else d.catalog.push({ ...i, id: uid('i') })
      log(d, `Item do checklist salvo: ${i.name}`, actor)
    })

  const removeItem = (id: string) =>
    update((d) => {
      d.catalog = d.catalog.filter((x) => x.id !== id)
      log(d, 'Item do checklist removido', actor)
    })

  const markNotificationsRead = () =>
    update((d) => {
      d.notifications.forEach((n) => {
        if (n.userId === user?.id || (user?.role === 'admin' && n.userId === 'admins')) n.read = true
      })
    })

  const resetDemo = () => {
    setDb(buildSeed())
    toast('Dados de demonstração restaurados.', 'info')
  }

  const value: Store = {
    db, user, toasts, toast, login, logout, submitChecklist, validateChecklist, savePendencia, movePendencia,
    commentPendencia, deletePendencia, justifyAbsence, forwardAbsence, saveEvent, deleteEvent, saveUser,
    saveVehicle, saveItem, removeItem, markNotificationsRead, resetDemo,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fora do StoreProvider')
  return s
}

/** Técnicos ativos que ainda não enviaram os dois checklists na data. */
export function missingForDate(db: DB, date: string) {
  return db.users
    .filter((u) => u.role === 'tecnico' && u.active)
    .map((u) => {
      const epi = db.checklists.find((c) => c.techId === u.id && c.date === date && c.type === 'epi')
      const vei = db.checklists.find((c) => c.techId === u.id && c.date === date && c.type === 'veiculo')
      const handled = db.pendencias.some((p) => p.origin === 'ausencia' && p.techId === u.id && p.dueDate === date)
      return { user: u, epi, vei, handled }
    })
}
