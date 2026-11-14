import { useState } from 'react'
import { ClipboardList, HardHat, Truck } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { Checklist } from '../../lib/types'
import { fmtDate, fmtTime } from '../../lib/utils'
import { ChecklistDetail, ResultBadge, typeLabel } from '../../components/ChecklistDetail'
import { Card, Empty, PageHeader, Segmented } from '../../components/ui'

export function TechHistory() {
  const { db, user } = useStore()
  const [filter, setFilter] = useState<'todos' | 'epi' | 'veiculo'>('todos')
  const [open, setOpen] = useState<Checklist | null>(null)
  const list = db.checklists
    .filter((c) => c.techId === user!.id && (filter === 'todos' || c.type === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div>
      <PageHeader
        eyebrow="Histórico"
        title="Meus checklists"
        sub={`${list.length} registros`}
        action={<Segmented value={filter} onChange={setFilter} options={[{ value: 'todos', label: 'Todos' }, { value: 'epi', label: "EPI's" }, { value: 'veiculo', label: 'Veículo' }]} />}
      />
      <Card className="animate-in overflow-hidden">
        {list.length === 0 && <Empty icon={<ClipboardList size={22} />} title="Nenhum checklist ainda" />}
        <ul>
          {list.slice(0, 80).map((c) => (
            <li key={c.id}>
              <button onClick={() => setOpen(c)} className="flex w-full items-center gap-4 border-b border-line px-5 py-3.5 text-left transition last:border-0 hover:bg-surface-2">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand">
                  {c.type === 'epi' ? <HardHat size={18} /> : <Truck size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{typeLabel(c.type)}</div>
                  <div className="text-xs text-muted">{fmtDate(c.date)} às {fmtTime(c.createdAt)}</div>
                </div>
                <ResultBadge result={c.result} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <ChecklistDetail checklist={open} db={db} onClose={() => setOpen(null)} />
    </div>
  )
}
