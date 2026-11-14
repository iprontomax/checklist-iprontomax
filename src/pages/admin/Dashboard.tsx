import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, BadgeCheck, Ban, CheckCircle2, ClipboardCheck, HardHat, Send, Truck, TriangleAlert, Users } from 'lucide-react'
import { missingForDate, useStore } from '../../lib/store'
import { addDays, cx, fmtDate, fmtDateTime, today } from '../../lib/utils'
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'

type Period = 'diario' | 'semanal' | 'mensal'

export function Dashboard() {
  const { db } = useStore()
  const [period, setPeriod] = useState<Period>('diario')
  const [ref, setRef] = useState(today())
  const span = period === 'diario' ? 1 : period === 'semanal' ? 7 : 30
  const from = addDays(ref, -(span - 1))

  const inRange = db.checklists.filter((c) => c.date >= from && c.date <= ref)
  const techs = db.users.filter((u) => u.role === 'tecnico' && u.active)
  const techsDone = new Set(inRange.map((c) => c.techId)).size
  const blocked = inRange.filter((c) => c.result === 'bloqueado').length
  const toValidate = db.checklists.filter((c) => !c.validated).length
  const openPend = db.pendencias.filter((p) => p.status !== 'resolvida').length

  const chart = useMemo(() => {
    const days = Math.max(14, span)
    return Array.from({ length: days }, (_, i) => {
      const d = addDays(ref, -(days - 1 - i))
      const list = db.checklists.filter((c) => c.date === d)
      return {
        dia: fmtDate(d).slice(0, 5),
        Liberados: list.filter((c) => c.result === 'liberado').length,
        Bloqueados: list.filter((c) => c.result === 'bloqueado').length,
      }
    })
  }, [db.checklists, ref, span])

  const kpis = [
    { label: 'Checklists realizados', value: inRange.length, icon: <ClipboardCheck size={18} />, link: '/admin/checklists', cta: 'Ver checklists' },
    { label: "Checklists de EPI's", value: inRange.filter((c) => c.type === 'epi').length, icon: <HardHat size={18} />, link: '/admin/checklists', cta: 'Checklists diários' },
    { label: 'Checklists de veículos', value: inRange.filter((c) => c.type === 'veiculo').length, icon: <Truck size={18} />, link: '/admin/cadastros', cta: 'Ver veículos' },
    { label: 'Técnicos no período', value: <>{techsDone}<span className="text-muted"> / {techs.length}</span></>, icon: <Users size={18} />, link: '/admin/relatorios', cta: 'Fizeram checklist / total' },
    { label: 'Validações pendentes', value: toValidate, icon: <BadgeCheck size={18} />, link: '/admin/checklists', cta: 'Abrir validações', tone: toValidate ? 'warn' : undefined },
    { label: 'Pendências abertas', value: openPend, icon: <TriangleAlert size={18} />, link: '/admin/pendencias', cta: 'Abrir pendências', tone: openPend ? 'danger' : undefined },
  ]

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Resumo operacional" title={<>Panorama do dia · <span className="num">{fmtDate(ref)}</span></>} sub="Acompanhe os checklists e as pendências do período selecionado." />

      <Card className="animate-in grid gap-4 p-5 sm:grid-cols-[1fr_1fr] sm:p-6">
        <Field label="Período">
          <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="diario">Diário</option>
            <option value="semanal">Últimos 7 dias</option>
            <option value="mensal">Últimos 30 dias</option>
          </Select>
        </Field>
        <Field label="Data de referência">
          <Input type="date" value={ref} max={today()} onChange={(e) => e.target.value && setRef(e.target.value)} />
        </Field>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card className="animate-in">
            <CardHeader eyebrow="Indicadores" title="Resumo do período" sub={period === 'diario' ? fmtDate(ref) : `${fmtDate(from)} a ${fmtDate(ref)}`} />
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3 sm:px-6 sm:pb-6">
              {kpis.map((k) => (
                <Link key={k.label} to={k.link} className="group rounded-2xl border border-line bg-surface-2 p-4 transition hover:-translate-y-0.5 hover:border-brand/50">
                  <div className="flex items-center justify-between text-muted">
                    <span className="text-xs font-semibold">{k.label}</span>
                    <span className={cx(k.tone === 'warn' ? 'text-warn' : k.tone === 'danger' ? 'text-danger' : 'text-brand')}>{k.icon}</span>
                  </div>
                  <div className="num mt-2 text-3xl font-extrabold tracking-tight">{k.value}</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand">{k.cta} <ArrowUpRight size={12} className="transition group-hover:translate-x-0.5" /></div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="animate-in">
            <CardHeader
              eyebrow="Tendência"
              title="Checklists por dia"
              action={<div className="flex gap-3 text-xs font-semibold text-muted"><Legend c="var(--brand)" t="Liberados" /><Legend c="var(--danger)" t="Bloqueados" /></div>}
              sub={`${blocked} bloqueio(s) no período selecionado`}
            />
            <div className="h-64 px-2 pb-4 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="dia" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-2)' }}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--fg)', fontSize: 12 }}
                  />
                  <Bar dataKey="Liberados" stackId="a" fill="var(--brand)" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Bloqueados" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="animate-in">
            <CardHeader eyebrow="Atividade · período selecionado" title="Últimos eventos" action={<Link to="/admin/logs"><Button size="sm">Ver relatório</Button></Link>} />
            <div className="max-h-80 overflow-auto px-5 pb-5 sm:px-6">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
                  <tr><th className="py-2 font-semibold">Quando</th><th className="py-2 font-semibold">Evento</th><th className="hidden py-2 font-semibold sm:table-cell">Responsável</th></tr>
                </thead>
                <tbody>
                  {db.logs.slice(0, 25).map((l) => (
                    <tr key={l.id} className="border-t border-line">
                      <td className="num py-2.5 pr-3 whitespace-nowrap text-muted">{fmtDateTime(l.at)}</td>
                      <td className="py-2.5 pr-3">{l.event}</td>
                      <td className="hidden py-2.5 sm:table-cell">{l.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Alerts date={ref} />
      </div>
    </div>
  )
}

function Legend({ c, t }: { c: string; t: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: c }} />{t}</span>
}

function Alerts({ date }: { date: string }) {
  const { db, justifyAbsence, forwardAbsence, toast } = useStore()
  const rows = missingForDate(db, date)
  const missing = rows.filter((r) => (!r.epi || !r.vei) && !r.handled)
  const blockedToday = db.checklists.filter((c) => c.date === date && c.result === 'bloqueado')
  const [text, setText] = useState<Record<string, string>>({})
  const [to, setTo] = useState<Record<string, string>>({})
  const admins = db.users.filter((u) => u.role === 'admin' && u.active)

  return (
    <Card className="animate-in h-fit xl:sticky xl:top-24">
      <CardHeader
        eyebrow="Automação · conformidade"
        title="Alertas"
        sub="Pendências geradas pelos prazos de checklist."
        action={<Link to="/admin/pendencias"><Button size="sm">Ver pendências</Button></Link>}
      />
      <div className="max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto px-5 pb-5 sm:px-6">
        {missing.length === 0 && blockedToday.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4 text-sm font-semibold text-brand">
            <CheckCircle2 size={20} /> Toda a equipe enviou os checklists de {fmtDate(date)}.
          </div>
        )}

        {blockedToday.map((c) => {
          const tech = db.users.find((u) => u.id === c.techId)
          const fails = c.answers.filter((a) => a.answer === 'nao' && a.mandatory)
          return (
            <div key={c.id} className="rounded-2xl border border-danger/40 bg-danger-soft/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold"><Ban size={16} className="text-danger" /> Saída bloqueada</div>
                <Badge tone="danger">{tech?.name}</Badge>
              </div>
              <p className="mt-1.5 text-sm">Checklist {c.type === 'epi' ? 'de EPI' : 'de veículo'}: {fails.map((f) => f.name).join(', ')}.</p>
            </div>
          )
        })}

        {missing.map(({ user, epi, vei }) => (
          <div key={user.id} className="rounded-2xl border border-warn/40 bg-warn-soft/40 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold">Checklist diário pendente</div>
                <div className="mt-0.5 text-[11px] font-semibold text-warn">
                  {[!epi && 'EPI ausente', !vei && 'Veículo ausente'].filter(Boolean).join(' · ')} · {fmtDate(date)}
                </div>
              </div>
              <Badge tone="warn">{user.name}</Badge>
            </div>
            <p className="mt-2 text-sm text-fg/90">O técnico {user.name} ainda não enviou o checklist diário de hoje.</p>
            <Textarea
              className="mt-3"
              rows={2}
              placeholder="Justificar (ex.: férias, atestado, folga)"
              value={text[user.id] ?? ''}
              onChange={(e) => setText({ ...text, [user.id]: e.target.value })}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (!text[user.id]?.trim()) return toast('Escreva a justificativa.', 'err')
                  justifyAbsence(user.id, date, text[user.id])
                  toast(`Ausência de ${user.name} justificada.`)
                }}
              >
                Justificar
              </Button>
              <Select className="h-8 w-auto flex-1 text-xs" value={to[user.id] ?? ''} onChange={(e) => setTo({ ...to, [user.id]: e.target.value })}>
                <option value="">Enviar para…</option>
                {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
              <Button
                size="sm"
                onClick={() => {
                  if (!to[user.id]) return toast('Selecione um usuário.', 'err')
                  forwardAbsence(user.id, date, to[user.id])
                  toast('Alerta encaminhado como pendência.')
                }}
              >
                <Send size={14} /> Enviar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
