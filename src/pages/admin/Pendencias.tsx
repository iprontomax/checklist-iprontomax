import { useState } from 'react'
import { CalendarPlus, Clock, MessageSquare, Plus, Search, Trash2, Truck, User as UserIcon } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { Pendencia, PendStatus, Priority } from '../../lib/types'
import { cx, fmtDate, fmtDateTime, today } from '../../lib/utils'
import { Badge, Button, Field, Input, Modal, PageHeader, Select, Textarea, type Tone } from '../../components/ui'

const COLS: { id: PendStatus; title: string; dot: string }[] = [
  { id: 'aberta', title: 'Abertas', dot: 'bg-danger' },
  { id: 'andamento', title: 'Em andamento', dot: 'bg-warn' },
  { id: 'resolvida', title: 'Resolvidas', dot: 'bg-brand' },
]
const PRIO: Record<Priority, { label: string; tone: Tone }> = {
  alta: { label: 'Alta', tone: 'danger' }, media: { label: 'Média', tone: 'warn' }, baixa: { label: 'Baixa', tone: 'muted' },
}
const ORIGIN = { checklist: 'Checklist', ausencia: 'Ausência', manual: 'Manual' }

export function Pendencias() {
  const { db, movePendencia } = useStore()
  const [q, setQ] = useState('')
  const [prio, setPrio] = useState('')
  const [editing, setEditing] = useState<Partial<Pendencia> | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<PendStatus | null>(null)

  const list = db.pendencias.filter(
    (p) => (!prio || p.priority === prio) && (!q || (p.title + ' ' + p.description).toLowerCase().includes(q.toLowerCase())),
  )
  const viewing = db.pendencias.find((p) => p.id === viewId) ?? null

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        title="Pendências"
        sub="Arraste os cartões entre as colunas para atualizar o status."
        action={<Button variant="primary" onClick={() => setEditing({ priority: 'media', status: 'aberta', dueDate: today() })}><Plus size={16} /> Nova pendência</Button>}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <Input className="pl-10" placeholder="Buscar pendência" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select className="w-auto" value={prio} onChange={(e) => setPrio(e.target.value)}>
          <option value="">Todas as prioridades</option><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map((col) => {
          const items = list.filter((p) => p.status === col.id)
          const shown = col.id === 'resolvida' ? items.slice(0, 15) : items
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setOver(col.id) }}
              onDragLeave={() => setOver(null)}
              onDrop={() => { if (dragId) movePendencia(dragId, col.id); setDragId(null); setOver(null) }}
              className={cx('animate-in rounded-3xl border bg-surface/60 p-3 transition', over === col.id ? 'border-brand bg-brand-soft/30' : 'border-line')}
            >
              <div className="flex items-center gap-2 px-2 pt-1 pb-3">
                <span className={cx('size-2.5 rounded-full', col.dot)} />
                <span className="font-bold">{col.title}</span>
                <span className="num ml-auto rounded-full bg-surface-3 px-2 text-xs font-bold text-muted">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {shown.map((p) => {
                  const late = p.status !== 'resolvida' && p.dueDate && p.dueDate < today()
                  const tech = db.users.find((u) => u.id === p.techId)
                  const v = db.vehicles.find((x) => x.id === p.vehicleId)
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => setDragId(p.id)}
                      onClick={() => setViewId(p.id)}
                      className="cursor-grab rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:border-brand/50 active:cursor-grabbing"
                    >
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={PRIO[p.priority].tone}>{PRIO[p.priority].label}</Badge>
                        <Badge tone="muted">{ORIGIN[p.origin]}</Badge>
                      </div>
                      <div className="mt-2 text-sm leading-snug font-bold">{p.title}</div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                        {p.dueDate && <span className={cx('inline-flex items-center gap-1', late && 'font-bold text-danger')}><Clock size={12} />{fmtDate(p.dueDate)}{late && ' · atrasada'}</span>}
                        {tech && <span className="inline-flex items-center gap-1"><UserIcon size={12} />{tech.name.split(' ')[0]}</span>}
                        {v && <span className="inline-flex items-center gap-1"><Truck size={12} />{v.plate}</span>}
                        {p.history.length > 1 && <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{p.history.length}</span>}
                      </div>
                    </div>
                  )
                })}
                {items.length === 0 && <div className="rounded-2xl border border-dashed border-line py-8 text-center text-xs text-muted">Nada aqui</div>}
                {items.length > shown.length && <div className="py-2 text-center text-xs text-muted">+ {items.length - shown.length} resolvidas anteriores</div>}
              </div>
            </div>
          )
        })}
      </div>

      {editing && <PendForm initial={editing} onClose={() => setEditing(null)} />}
      {viewing && <PendView p={viewing} onClose={() => setViewId(null)} onEdit={() => { setEditing(viewing); setViewId(null) }} />}
    </div>
  )
}

function PendForm({ initial, onClose }: { initial: Partial<Pendencia>; onClose: () => void }) {
  const { db, savePendencia, toast } = useStore()
  const [f, setF] = useState<Partial<Pendencia>>(initial)
  const set = (p: Partial<Pendencia>) => setF((x) => ({ ...x, ...p }))
  const save = () => {
    if (!f.title?.trim()) return toast('Informe o título.', 'err')
    savePendencia({ ...f, title: f.title.trim() })
    toast(f.id ? 'Pendência atualizada.' : 'Pendência criada.')
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={f.id ? 'Editar pendência' : 'Nova pendência'} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={save}>Salvar</Button></>}>
      <div className="space-y-4">
        <Field label="Título"><Input value={f.title ?? ''} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Trocar pneu dianteiro" autoFocus /></Field>
        <Field label="Descrição"><Textarea value={f.description ?? ''} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prioridade">
            <Select value={f.priority} onChange={(e) => set({ priority: e.target.value as Priority })}><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option></Select>
          </Field>
          <Field label="Prazo"><Input type="date" value={f.dueDate ?? ''} onChange={(e) => set({ dueDate: e.target.value })} /></Field>
          <Field label="Técnico relacionado">
            <Select value={f.techId ?? ''} onChange={(e) => set({ techId: e.target.value || undefined })}>
              <option value="">—</option>{db.users.filter((u) => u.role === 'tecnico').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Veículo relacionado">
            <Select value={f.vehicleId ?? ''} onChange={(e) => set({ vehicleId: e.target.value || undefined })}>
              <option value="">—</option>{db.vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
            </Select>
          </Field>
          <Field label="Responsável">
            <Select value={f.assignedTo ?? ''} onChange={(e) => set({ assignedTo: e.target.value || undefined })}>
              <option value="">—</option>{db.users.filter((u) => u.role === 'admin').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set({ status: e.target.value as PendStatus })}><option value="aberta">Aberta</option><option value="andamento">Em andamento</option><option value="resolvida">Resolvida</option></Select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}

function PendView({ p, onClose, onEdit }: { p: Pendencia; onClose: () => void; onEdit: () => void }) {
  const { db, movePendencia, commentPendencia, deletePendencia, saveEvent, toast } = useStore()
  const [comment, setComment] = useState('')
  const [sched, setSched] = useState({ date: p.dueDate ?? today(), time: '08:00' })
  const tech = db.users.find((u) => u.id === p.techId)
  const v = db.vehicles.find((x) => x.id === p.vehicleId)
  const resp = db.users.find((u) => u.id === p.assignedTo)
  const ev = db.agenda.find((e) => e.pendenciaId === p.id)

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={p.title}
      footer={
        <>
          <Button variant="ghost" className="mr-auto text-danger" onClick={() => { if (confirm('Excluir esta pendência?')) { deletePendencia(p.id); onClose(); toast('Pendência excluída.', 'info') } }}><Trash2 size={16} /> Excluir</Button>
          <Button variant="outline" onClick={onEdit}>Editar</Button>
          {p.status !== 'resolvida' && <Button variant="primary" onClick={() => { movePendencia(p.id, 'resolvida'); toast('Pendência resolvida.') }}>Marcar como resolvida</Button>}
        </>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={PRIO[p.priority].tone}>Prioridade {PRIO[p.priority].label.toLowerCase()}</Badge>
        <Badge tone="muted">Origem: {ORIGIN[p.origin]}</Badge>
        <Badge tone={p.status === 'resolvida' ? 'brand' : p.status === 'andamento' ? 'warn' : 'danger'}>{COLS.find((c) => c.id === p.status)!.title.replace(/s$/, '')}</Badge>
      </div>
      {p.description && <p className="mt-4 text-sm leading-relaxed">{p.description}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[['Técnico', tech?.name], ['Veículo', v?.plate], ['Responsável', resp?.name], ['Prazo', p.dueDate && fmtDate(p.dueDate)]].map(([l, val]) => (
          <div key={l} className="rounded-xl bg-surface-2 px-3.5 py-2.5"><div className="text-[11px] font-semibold text-muted">{l}</div><div className="mt-0.5 text-sm font-bold">{val || '—'}</div></div>
        ))}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {COLS.map((c) => (
          <button key={c.id} onClick={() => movePendencia(p.id, c.id)} className={cx('flex items-center justify-center gap-2 rounded-xl border-2 py-2 text-xs font-bold transition', p.status === c.id ? 'border-brand bg-brand-soft text-fg' : 'border-line text-muted hover:text-fg')}>
            <span className={cx('size-2 rounded-full', c.dot)} />{c.title.replace(/s$/, '')}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-line p-4">
        <div className="flex items-center gap-2 text-sm font-bold"><CalendarPlus size={16} className="text-brand" /> Agenda</div>
        {ev ? (
          <p className="mt-2 text-sm text-muted">Agendado para <b className="text-fg">{fmtDate(ev.date)}{ev.time ? ` às ${ev.time}` : ''}</b>.</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field label="Data"><Input type="date" value={sched.date} onChange={(e) => setSched({ ...sched, date: e.target.value })} /></Field>
            <Field label="Hora"><Input type="time" value={sched.time} onChange={(e) => setSched({ ...sched, time: e.target.value })} /></Field>
            <Button onClick={() => { saveEvent({ title: p.title, date: sched.date, time: sched.time, pendenciaId: p.id, color: p.priority === 'alta' ? 'danger' : 'warn' }); toast('Adicionado à agenda.') }}>Agendar</Button>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-3 text-sm font-bold">Histórico</div>
        <ol className="relative space-y-3 border-l-2 border-line pl-5">
          {p.history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-surface bg-brand" />
              <div className="text-sm">{h.text}</div>
              <div className="text-[11px] text-muted">{h.by} · {fmtDateTime(h.at)}</div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex gap-2">
          <Input placeholder="Adicionar comentário…" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) { commentPendencia(p.id, comment.trim()); setComment('') } }} />
          <Button onClick={() => { if (comment.trim()) { commentPendencia(p.id, comment.trim()); setComment('') } }}>Enviar</Button>
        </div>
      </div>
    </Modal>
  )
}
