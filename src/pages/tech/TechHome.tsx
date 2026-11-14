import { Link } from 'react-router-dom'
import { ArrowRight, Ban, CalendarDays, CheckCircle2, Clock, Gauge, HardHat, ShieldCheck, Truck, TriangleAlert } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { Checklist } from '../../lib/types'
import { addDays, cx, fmtDate, fmtTime, longDate, parseDate, today } from '../../lib/utils'
import { ResultBadge } from '../../components/ChecklistDetail'
import { Badge, Button, Card, CardHeader } from '../../components/ui'

export function TechHome() {
  const { user, db } = useStore()
  const t = today()
  const mine = db.checklists.filter((c) => c.techId === user!.id)
  const epi = mine.filter((c) => c.date === t && c.type === 'epi').at(-1)
  const vei = mine.filter((c) => c.date === t && c.type === 'veiculo').at(-1)
  const vehicle = db.vehicles.find((v) => v.id === user!.vehicleId)
  const blocked = epi?.result === 'bloqueado' || vei?.result === 'bloqueado'
  const done = !!epi && !!vei
  const status = blocked ? 'bloqueado' : done ? 'liberado' : 'pendente'
  const events = db.agenda.filter((e) => e.date >= t).sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))).slice(0, 4)
  const myPend = db.pendencias.filter((p) => p.techId === user!.id && p.status !== 'resolvida')

  // sequência de dias com checklist completo
  let streak = 0
  const dates = new Set(mine.filter((c) => c.result === 'liberado').map((c) => c.date + c.type))
  for (let i = done ? 0 : 1; i < 60; i++) {
    const iso = addDays(t, -i)
    if (parseDate(iso).getDay() === 0) continue
    if (dates.has(iso + 'epi') && dates.has(iso + 'veiculo')) streak++
    else break
  }

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <div className="text-sm font-medium text-muted first-letter:uppercase">{longDate(t)}</div>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Olá, {user!.name.split(' ')[0]} 👋</h1>
      </div>

      <div
        className={cx(
          'animate-in relative overflow-hidden rounded-3xl border p-6 sm:p-8',
          status === 'liberado' && 'border-brand/40 bg-gradient-to-br from-brand-soft to-surface',
          status === 'bloqueado' && 'border-danger/40 bg-gradient-to-br from-danger-soft to-surface',
          status === 'pendente' && 'border-warn/40 bg-gradient-to-br from-warn-soft to-surface',
        )}
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className={cx('grid size-16 shrink-0 place-items-center rounded-2xl',
            status === 'liberado' ? 'bg-brand text-brand-ink' : status === 'bloqueado' ? 'bg-danger text-white' : 'bg-warn text-black')}>
            {status === 'liberado' ? <ShieldCheck size={30} /> : status === 'bloqueado' ? <Ban size={30} /> : <Clock size={30} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Status de saída hoje</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {status === 'liberado' && 'Liberado para a rota'}
              {status === 'bloqueado' && 'Saída bloqueada'}
              {status === 'pendente' && 'Faça seu checklist'}
            </div>
            <p className="mt-1 text-sm text-muted">
              {status === 'liberado' && 'Tudo conferido e assinado. Bom trabalho e boa rota!'}
              {status === 'bloqueado' && 'Há itens obrigatórios com problema. A administração já foi avisada — aguarde a liberação.'}
              {status === 'pendente' && `Complete ${!epi && !vei ? 'os dois checklists' : 'o checklist restante'} antes de sair.`}
            </p>
          </div>
          {streak > 0 && status !== 'bloqueado' && (
            <div className="rounded-2xl bg-surface/70 px-4 py-3 text-center">
              <div className="num text-2xl font-extrabold">{streak}</div>
              <div className="text-[11px] font-semibold text-muted">dias seguidos<br />sem bloqueio</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChecklistCard
          icon={<HardHat size={22} />} title="EPI's e materiais" to="/tecnico/epi" checklist={epi}
          text="Capacete, cinto, luvas, escada, máquina de fusão e demais itens."
        />
        <ChecklistCard
          icon={<Truck size={22} />} title="Inspeção do veículo" to="/tecnico/veiculo" checklist={vei}
          text={vehicle ? `${vehicle.model} · ${vehicle.plate}` : 'Nenhum veículo vinculado'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-in">
          <CardHeader eyebrow="Meu veículo" title={vehicle?.plate ?? '—'} sub={vehicle?.model} />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:px-6">
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted"><Gauge size={13} /> Quilometragem</div>
              <div className="num mt-1 font-bold">{vehicle?.km.toLocaleString('pt-BR')} km</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[11px] font-semibold text-muted">Situação</div>
              <div className="mt-1 font-bold capitalize">{vehicle?.status.replace('_', ' ')}</div>
            </div>
          </div>
        </Card>

        <Card className="animate-in">
          <CardHeader eyebrow="Agenda" title="Próximos compromissos" />
          <div className="space-y-2 px-5 pb-5 sm:px-6">
            {events.length === 0 && <p className="text-sm text-muted">Sem compromissos.</p>}
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                <CalendarDays size={16} className="shrink-0 text-brand" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{e.title}</div>
                  <div className="text-[11px] text-muted">{fmtDate(e.date)}{e.time ? ` · ${e.time}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-in">
          <CardHeader eyebrow="Pendências" title="Abertas em meu nome" />
          <div className="space-y-2 px-5 pb-5 sm:px-6">
            {myPend.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 size={16} className="text-brand" /> Nenhuma pendência aberta.</p>
            )}
            {myPend.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-start gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-[11px] text-muted">{p.status === 'aberta' ? 'Aberta' : 'Em andamento'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ChecklistCard({ icon, title, text, to, checklist }: { icon: React.ReactNode; title: string; text: string; to: string; checklist?: Checklist }) {
  return (
    <Card className="animate-in flex flex-col p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{title}</h3>
            {checklist ? <ResultBadge result={checklist.result} /> : <Badge tone="warn">Pendente</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">{text}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{checklist ? `Enviado às ${fmtTime(checklist.createdAt)}` : 'Ainda não enviado hoje'}</span>
        <Link to={to}>
          <Button variant={checklist ? 'outline' : 'primary'}>{checklist ? 'Ver / refazer' : 'Iniciar checklist'} <ArrowRight size={16} /></Button>
        </Link>
      </div>
    </Card>
  )
}
