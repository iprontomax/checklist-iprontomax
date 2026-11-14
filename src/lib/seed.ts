import type { AgendaEvent, CatalogItem, Checklist, ChecklistAnswer, DB, LogEntry, Pendencia, User, Vehicle } from './types'
import { addDays, parseDate, today } from './utils'

export const DB_VERSION = 1

/** Contas de demonstração (somente para testes locais). */
export const DEMO_USERS: User[] = [
  { id: 'u-admin', name: 'Administrador', username: 'admin', password: 'admin123', role: 'admin', active: true },
  { id: 'u-carlos', name: 'Carlos Silva', username: 'carlos', password: '123456', role: 'tecnico', vehicleId: 'v1', phone: '(11) 98888-1001', active: true },
  { id: 'u-joao', name: 'João Pereira', username: 'joao', password: '123456', role: 'tecnico', vehicleId: 'v2', phone: '(11) 98888-1002', active: true },
  { id: 'u-marcos', name: 'Marcos Oliveira', username: 'marcos', password: '123456', role: 'tecnico', vehicleId: 'v3', phone: '(11) 98888-1003', active: true },
  { id: 'u-rafael', name: 'Rafael Souza', username: 'rafael', password: '123456', role: 'tecnico', vehicleId: 'v4', phone: '(11) 98888-1004', active: true },
  { id: 'u-lucas', name: 'Lucas Almeida', username: 'lucas', password: '123456', role: 'tecnico', vehicleId: 'v5', phone: '(11) 98888-1005', active: true },
]

const VEHICLES: Vehicle[] = [
  { id: 'v1', plate: 'RTA2B41', model: 'Fiat Strada Endurance', year: 2023, km: 48210, status: 'disponivel' },
  { id: 'v2', plate: 'QWE7C19', model: 'Fiat Fiorino', year: 2022, km: 73544, status: 'disponivel' },
  { id: 'v3', plate: 'SKD4F88', model: 'VW Saveiro Robust', year: 2024, km: 21907, status: 'disponivel' },
  { id: 'v4', plate: 'PLM1H03', model: 'Chevrolet Montana', year: 2024, km: 15380, status: 'disponivel' },
  { id: 'v5', plate: 'RBX9J52', model: 'Fiat Strada Freedom', year: 2021, km: 98112, status: 'disponivel' },
]

const CATALOG: CatalogItem[] = [
  { id: 'e1', name: 'Capacete de segurança com jugular', category: 'epi', mandatory: true, defaultQty: 1 },
  { id: 'e2', name: 'Cinto paraquedista + talabarte duplo', category: 'epi', mandatory: true, defaultQty: 1 },
  { id: 'e3', name: 'Luvas de proteção', category: 'epi', mandatory: true, defaultQty: 2 },
  { id: 'e4', name: 'Óculos de proteção', category: 'epi', mandatory: true, defaultQty: 1 },
  { id: 'e5', name: 'Botina de segurança', category: 'epi', mandatory: true, defaultQty: 1 },
  { id: 'e6', name: 'Uniforme com faixa refletiva', category: 'epi', mandatory: false, defaultQty: 1 },
  { id: 'm1', name: 'Escada extensível', category: 'material', mandatory: true, defaultQty: 1 },
  { id: 'm2', name: 'Máquina de fusão + clivador', category: 'material', mandatory: true, defaultQty: 1 },
  { id: 'm3', name: 'Power meter (medidor óptico)', category: 'material', mandatory: false, defaultQty: 1 },
  { id: 'm4', name: 'Conectores SC/APC', category: 'material', mandatory: false, defaultQty: 20 },
  { id: 'm5', name: 'Drop de fibra (bobina)', category: 'material', mandatory: false, defaultQty: 1 },
  { id: 'c1', name: 'Pneus calibrados e sem desgaste', category: 'veiculo', mandatory: true },
  { id: 'c2', name: 'Freios funcionando', category: 'veiculo', mandatory: true },
  { id: 'c3', name: 'Faróis, lanternas e setas', category: 'veiculo', mandatory: true },
  { id: 'c4', name: 'Nível de óleo do motor', category: 'veiculo', mandatory: true },
  { id: 'c5', name: 'Água do radiador', category: 'veiculo', mandatory: false },
  { id: 'c6', name: 'Documentação (CRLV) no veículo', category: 'veiculo', mandatory: true },
  { id: 'c7', name: 'Estepe, macaco e triângulo', category: 'veiculo', mandatory: true },
  { id: 'c8', name: 'Suporte de escada fixado', category: 'veiculo', mandatory: true },
  { id: 'c9', name: 'Lataria sem avarias novas', category: 'veiculo', mandatory: false },
  { id: 'c10', name: 'Limpeza interna', category: 'veiculo', mandatory: false },
]

/** Gera uma "assinatura" vetorial para os registros de exemplo. */
export function fakeSignature(seed: number) {
  const r = rng(seed)
  let d = `M ${20 + r() * 20} ${60 + r() * 20}`
  let x = 40
  for (let i = 0; i < 9; i++) {
    x += 18 + r() * 22
    d += ` Q ${x - 10} ${10 + r() * 40} ${x} ${45 + r() * 40}`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="110"><path d="${d}" fill="none" stroke="#1d2b44" stroke-width="2.4" stroke-linecap="round"/></svg>`
  return 'data:image/svg+xml;base64,' + btoa(svg)
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function buildSeed(): DB {
  const r = rng(20261114)
  const t = today()
  const techs = DEMO_USERS.filter((u) => u.role === 'tecnico')
  const checklists: Checklist[] = []
  const pendencias: Pendencia[] = []
  const logs: LogEntry[] = []
  let n = 0

  for (let back = 35; back >= 0; back--) {
    const date = addDays(t, -back)
    if (parseDate(date).getDay() === 0) continue
    techs.forEach((tech, ti) => {
      // hoje: apenas parte da equipe já enviou
      if (back === 0 && ti >= 2) return
      if (back > 0 && r() < 0.07) return
      ;(['epi', 'veiculo'] as const).forEach((type) => {
        const items = CATALOG.filter((c) => (type === 'epi' ? c.category !== 'veiculo' : c.category === 'veiculo'))
        let failed: ChecklistAnswer | undefined
        const answers: ChecklistAnswer[] = items.map((c) => {
          const roll = r()
          const answer = roll < 0.025 && c.mandatory ? 'nao' : roll > 0.985 && !c.mandatory ? 'na' : 'sim'
          const a: ChecklistAnswer = {
            itemId: c.id, name: c.name, answer, qty: c.defaultQty, photos: [], mandatory: c.mandatory,
            note: answer === 'nao' ? (type === 'epi' ? 'Item danificado, precisa de reposição.' : 'Problema identificado na inspeção.') : undefined,
          }
          if (answer === 'nao' && c.mandatory && !failed) failed = a
          return a
        })
        const hh = 6 + Math.floor(r() * 2)
        const mm = Math.floor(r() * 60)
        const created = parseDate(date)
        created.setHours(hh, mm)
        const id = `ck${++n}`
        const ck: Checklist = {
          id, type, techId: tech.id, vehicleId: tech.vehicleId, date, createdAt: created.toISOString(), answers,
          km: type === 'veiculo' ? 0 : undefined,
          fuel: type === 'veiculo' ? 25 + Math.round(r() * 75) : undefined,
          signature: fakeSignature(n), result: failed ? 'bloqueado' : 'liberado',
          validated: back > 1, validatedBy: back > 1 ? 'u-admin' : undefined,
        }
        checklists.push(ck)
        logs.push({ id: 'lg' + n, at: ck.createdAt, event: `Checklist ${type === 'epi' ? 'de EPI' : 'de veículo'} enviado`, actor: tech.name, ref: id })
        if (failed) {
          const resolved = back > 3
          pendencias.push({
            id: 'p' + n, title: `${failed.name} — ${type === 'epi' ? 'reposição' : 'manutenção'}`,
            description: `Bloqueio gerado pelo checklist de ${tech.name}. ${failed.note ?? ''}`,
            status: resolved ? 'resolvida' : back > 1 ? 'andamento' : 'aberta',
            priority: 'alta', origin: 'checklist', checklistId: id, techId: tech.id, vehicleId: type === 'veiculo' ? tech.vehicleId : undefined,
            assignedTo: 'u-admin', dueDate: addDays(date, 2), createdAt: ck.createdAt,
            resolvedAt: resolved ? new Date(created.getTime() + 86400000).toISOString() : undefined,
            history: [{ at: ck.createdAt, by: 'Sistema', text: 'Pendência criada automaticamente pelo checklist.' }],
          })
        }
      })
    })
  }

  // km acumulado coerente
  const kmBy: Record<string, number> = {}
  VEHICLES.forEach((v) => (kmBy[v.id] = v.km - 36 * 85))
  checklists.filter((c) => c.type === 'veiculo').forEach((c) => {
    kmBy[c.vehicleId!] += 40 + Math.round(r() * 90)
    c.km = kmBy[c.vehicleId!]
  })
  const vehicles = VEHICLES.map((v) => ({ ...v, km: kmBy[v.id] }))

  pendencias.push(
    {
      id: 'pm1', title: 'Troca de óleo — Fiat Fiorino', description: 'Revisão dos 75.000 km. Agendar com a oficina parceira.',
      status: 'aberta', priority: 'media', origin: 'manual', vehicleId: 'v2', assignedTo: 'u-admin', dueDate: addDays(t, 3),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), history: [],
    },
    {
      id: 'pm2', title: 'Reposição de conectores SC/APC', description: 'Estoque baixo no almoxarifado — comprar 500 unidades.',
      status: 'andamento', priority: 'baixa', origin: 'manual', assignedTo: 'u-admin', dueDate: addDays(t, 6),
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), history: [],
    },
  )

  const agenda: AgendaEvent[] = [
    { id: 'a1', title: 'Revisão Fiat Fiorino (QWE7C19)', date: addDays(t, 3), time: '08:00', color: 'warn', pendenciaId: 'pm1', notes: 'Oficina Auto Center Norte' },
    { id: 'a2', title: 'Treinamento NR-35 — trabalho em altura', date: addDays(t, 5), time: '13:30', color: 'info', notes: 'Toda a equipe técnica' },
    { id: 'a3', title: 'Entrega de EPIs novos', date: addDays(t, 1), time: '07:30', color: 'brand' },
    { id: 'a4', title: 'Licenciamento RBX9J52', date: addDays(t, 12), color: 'danger' },
  ]

  logs.push({ id: 'lg-login', at: new Date().toISOString(), event: 'Base de demonstração criada', actor: 'Sistema' })
  logs.sort((a, b) => b.at.localeCompare(a.at))

  return {
    version: DB_VERSION,
    users: DEMO_USERS,
    vehicles,
    catalog: CATALOG,
    checklists,
    pendencias,
    agenda,
    logs: logs.slice(0, 400),
    notifications: [
      { id: 'n1', at: new Date().toISOString(), userId: 'admins', text: '3 técnicos ainda não enviaram o checklist de hoje.', read: false, link: '/admin' },
      { id: 'n2', at: new Date().toISOString(), userId: 'u-carlos', text: 'Lembrete: treinamento NR-35 nesta semana.', read: false },
    ],
  }
}
