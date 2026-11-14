import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { AgendaEvent } from '../../lib/types'
import { cx, fmtDate, longDate, MONTHS, pad, today, WEEKDAYS } from '../../lib/utils'
import { Button, Card, Field, Input, Modal, PageHeader, Select, Textarea } from '../../components/ui'

const COLORS: Record<AgendaEvent['color'], string> = {
  brand: 'bg-brand', warn: 'bg-warn', danger: 'bg-danger', info: 'bg-info',
}
const CHIP: Record<AgendaEvent['color'], string> = {
  brand: 'bg-brand-soft text-brand', warn: 'bg-warn-soft text-warn', danger: 'bg-danger-soft text-danger', info: 'bg-info-soft text-info',
}

export function Agenda() {
  const { db } = useStore()
  const t = today()
  const [ym, setYm] = useState(() => ({ y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) - 1 }))
  const [sel, setSel] = useState(t)
  const [editing, setEditing] = useState<Partial<AgendaEvent> | null>(null)

  const first = new Date(ym.y, ym.m, 1)
  const startPad = first.getDay()
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((startPad + daysIn) / 7) * 7 }, (_, i) => {
    const day = i - startPad + 1
    return day >= 1 && day <= daysIn ? `${ym.y}-${pad(ym.m + 1)}-${pad(day)}` : null
  })

  // pendências com prazo aparecem no calendário
  const dueItems = db.pendencias.filter((p) => p.status !== 'resolvida' && p.dueDate && !db.agenda.some((e) => e.pendenciaId === p.id))
  const eventsOn = (d: string) => db.agenda.filter((e) => e.date === d).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const dueOn = (d: string) => dueItems.filter((p) => p.dueDate === d)
  const shift = (n: number) => setYm(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  const upcoming = db.agenda.filter((e) => e.date >= t).sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))).slice(0, 6)

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Agenda"
        sub="Compromissos, manutenções e prazos de pendências."
        action={<Button variant="primary" onClick={() => setEditing({ date: sel, color: 'brand' })}><Plus size={16} /> Novo evento</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="animate-in overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-lg font-extrabold tracking-tight">{MONTHS[ym.m]} <span className="num text-muted">{ym.y}</span></h2>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => shift(-1)} aria-label="Mês anterior"><ChevronLeft size={16} /></Button>
              <Button size="sm" variant="outline" onClick={() => { setYm({ y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) - 1 }); setSel(t) }}>Hoje</Button>
              <Button size="sm" variant="ghost" onClick={() => shift(1)} aria-label="Próximo mês"><ChevronRight size={16} /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-[11px] font-bold tracking-wider text-muted uppercase">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="min-h-20 border-r border-b border-line bg-surface-2/40 sm:min-h-28" />
              const evs = eventsOn(d)
              const dues = dueOn(d)
              return (
                <button
                  key={i}
                  onClick={() => setSel(d)}
                  onDoubleClick={() => setEditing({ date: d, color: 'brand' })}
                  className={cx('min-h-20 border-r border-b border-line p-1.5 text-left align-top transition sm:min-h-28 sm:p-2', sel === d ? 'bg-brand-soft/40' : 'hover:bg-surface-2')}
                >
                  <span className={cx('num grid size-7 place-items-center rounded-full text-xs font-bold', d === t ? 'bg-brand text-brand-ink' : sel === d ? 'text-brand' : '')}>{Number(d.slice(8))}</span>
                  <div className="mt-1 space-y-1">
                    {evs.slice(0, 2).map((e) => (
                      <div key={e.id} className={cx('hidden truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:block', CHIP[e.color])}>{e.time && <span className="num">{e.time} </span>}{e.title}</div>
                    ))}
                    {dues.slice(0, 1).map((p) => (
                      <div key={p.id} className="hidden truncate rounded-md border border-dashed border-danger/50 px-1.5 py-0.5 text-[10px] font-semibold text-danger sm:block">⚑ {p.title}</div>
                    ))}
                    <div className="flex gap-0.5 sm:hidden">
                      {evs.map((e) => <span key={e.id} className={cx('size-1.5 rounded-full', COLORS[e.color])} />)}
                      {dues.length > 0 && <span className="size-1.5 rounded-full bg-danger" />}
                    </div>
                    {evs.length + dues.length > 3 && <div className="hidden text-[10px] text-muted sm:block">+{evs.length + dues.length - 3}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="animate-in p-5">
            <div className="text-[11px] font-bold tracking-[0.16em] text-brand uppercase">Dia selecionado</div>
            <div className="mt-1 text-lg font-extrabold first-letter:uppercase">{longDate(sel)}</div>
            <div className="mt-4 space-y-2">
              {eventsOn(sel).length + dueOn(sel).length === 0 && <p className="text-sm text-muted">Sem eventos. Dê dois cliques num dia para agendar.</p>}
              {eventsOn(sel).map((e) => <EventRow key={e.id} e={e} onClick={() => setEditing(e)} />)}
              {dueOn(sel).map((p) => (
                <div key={p.id} className="flex items-start gap-3 rounded-xl border border-dashed border-danger/50 px-3 py-2.5">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" />
                  <div><div className="text-sm font-semibold">{p.title}</div><div className="text-[11px] text-muted">Prazo de pendência</div></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="animate-in p-5">
            <div className="text-[11px] font-bold tracking-[0.16em] text-brand uppercase">Próximos</div>
            <div className="mt-3 space-y-2">
              {upcoming.map((e) => <EventRow key={e.id} e={e} onClick={() => setEditing(e)} showDate />)}
              {upcoming.length === 0 && <p className="text-sm text-muted">Nada agendado.</p>}
            </div>
          </Card>
        </div>
      </div>
      {editing && <EventForm initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function EventRow({ e, onClick, showDate }: { e: AgendaEvent; onClick: () => void; showDate?: boolean }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-left transition hover:bg-surface-3">
      <span className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', COLORS[e.color])} />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{e.title}</div>
        <div className="flex items-center gap-1 text-[11px] text-muted"><Clock size={11} />{showDate && fmtDate(e.date) + ' · '}{e.time ?? 'Dia todo'}</div>
        {e.notes && <div className="mt-0.5 truncate text-[11px] text-muted">{e.notes}</div>}
      </div>
    </button>
  )
}

function EventForm({ initial, onClose }: { initial: Partial<AgendaEvent>; onClose: () => void }) {
  const { saveEvent, deleteEvent, toast } = useStore()
  const [f, setF] = useState<Partial<AgendaEvent>>(initial)
  const save = () => {
    if (!f.title?.trim() || !f.date) return toast('Informe título e data.', 'err')
    saveEvent({ ...f, title: f.title.trim(), date: f.date, color: f.color ?? 'brand' } as AgendaEvent)
    toast('Evento salvo.')
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={f.id ? 'Editar evento' : 'Novo evento'}
      footer={
        <>
          {f.id && <Button variant="ghost" className="mr-auto text-danger" onClick={() => { deleteEvent(f.id!); toast('Evento removido.', 'info'); onClose() }}><Trash2 size={16} /> Excluir</Button>}
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título"><Input autoFocus value={f.title ?? ''} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Revisão do veículo" /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Data"><Input type="date" value={f.date ?? ''} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Hora (opcional)"><Input type="time" value={f.time ?? ''} onChange={(e) => setF({ ...f, time: e.target.value || undefined })} /></Field>
          <Field label="Cor">
            <Select value={f.color} onChange={(e) => setF({ ...f, color: e.target.value as AgendaEvent['color'] })}>
              <option value="brand">Verde</option><option value="info">Azul</option><option value="warn">Amarelo</option><option value="danger">Vermelho</option>
            </Select>
          </Field>
        </div>
        <Field label="Observações"><Textarea value={f.notes ?? ''} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}
