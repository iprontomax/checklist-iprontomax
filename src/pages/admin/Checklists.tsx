import { useMemo, useState } from 'react'
import { BadgeCheck, ClipboardList, Download, HardHat, Search, Truck } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { Checklist } from '../../lib/types'
import { addDays, downloadCSV, fmtDate, fmtTime, today } from '../../lib/utils'
import { ChecklistDetail, ResultBadge, typeLabel } from '../../components/ChecklistDetail'
import { Avatar, Badge, Button, Card, Empty, Input, PageHeader, Select } from '../../components/ui'

export function Checklists() {
  const { db, validateChecklist, toast } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [tech, setTech] = useState('')
  const [result, setResult] = useState('')
  const [valid, setValid] = useState('')
  const [from, setFrom] = useState(addDays(today(), -6))
  const [to, setTo] = useState(today())
  const [open, setOpen] = useState<Checklist | null>(null)

  const users = Object.fromEntries(db.users.map((u) => [u.id, u]))
  const vehicles = Object.fromEntries(db.vehicles.map((v) => [v.id, v]))

  const list = useMemo(
    () =>
      db.checklists
        .filter((c) =>
          c.date >= from && c.date <= to &&
          (!type || c.type === type) && (!tech || c.techId === tech) && (!result || c.result === result) &&
          (!valid || (valid === 'sim' ? c.validated : !c.validated)) &&
          (!q || (users[c.techId]?.name + ' ' + (vehicles[c.vehicleId ?? '']?.plate ?? '')).toLowerCase().includes(q.toLowerCase())),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.checklists, from, to, type, tech, result, valid, q],
  )
  const pendingValidation = list.filter((c) => !c.validated)

  const exportCsv = () =>
    downloadCSV(`checklists_${from}_${to}.csv`, [
      ['Data', 'Hora', 'Tipo', 'Técnico', 'Veículo', 'Km', 'Combustível', 'Resultado', 'Itens com problema', 'Validado'],
      ...list.map((c) => [
        fmtDate(c.date), fmtTime(c.createdAt), typeLabel(c.type), users[c.techId]?.name ?? '', vehicles[c.vehicleId ?? '']?.plate ?? '',
        c.km ?? '', c.fuel != null ? c.fuel + '%' : '', c.result,
        c.answers.filter((a) => a.answer === 'nao').map((a) => a.name).join(', '), c.validated ? 'Sim' : 'Não',
      ]),
    ])

  return (
    <div>
      <PageHeader
        eyebrow="Operação"
        title="Checklists"
        sub={`${list.length} checklists no filtro · ${pendingValidation.length} aguardando validação`}
        action={
          <>
            <Button variant="outline" onClick={exportCsv}><Download size={16} /> Exportar CSV</Button>
            <Button
              variant="primary"
              disabled={!pendingValidation.length}
              onClick={() => { pendingValidation.forEach((c) => validateChecklist(c.id)); toast(`${pendingValidation.length} checklists validados.`) }}
            >
              <BadgeCheck size={16} /> Validar todos ({pendingValidation.length})
            </Button>
          </>
        }
      />

      <Card className="animate-in mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-7">
        <div className="relative lg:col-span-2">
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
          <Input className="pl-10" placeholder="Buscar técnico ou placa" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos os tipos</option><option value="epi">EPI's e materiais</option><option value="veiculo">Veículo</option></Select>
        <Select value={tech} onChange={(e) => setTech(e.target.value)}>
          <option value="">Todos os técnicos</option>
          {db.users.filter((u) => u.role === 'tecnico').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Select value={result} onChange={(e) => setResult(e.target.value)}><option value="">Qualquer resultado</option><option value="liberado">Liberado</option><option value="bloqueado">Bloqueado</option></Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="De" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Até" />
        <Select value={valid} onChange={(e) => setValid(e.target.value)} className="lg:col-span-2"><option value="">Validados e não validados</option><option value="nao">Aguardando validação</option><option value="sim">Validados</option></Select>
      </Card>

      <Card className="animate-in overflow-hidden">
        {list.length === 0 ? (
          <Empty icon={<ClipboardList size={22} />} title="Nenhum checklist encontrado" text="Ajuste os filtros ou o período." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Técnico</th>
                  <th className="px-3 py-3 font-semibold">Tipo</th>
                  <th className="px-3 py-3 font-semibold">Data</th>
                  <th className="px-3 py-3 font-semibold">Veículo</th>
                  <th className="px-3 py-3 font-semibold">Itens OK</th>
                  <th className="px-3 py-3 font-semibold">Resultado</th>
                  <th className="px-5 py-3 font-semibold">Validação</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 200).map((c) => {
                  const ok = c.answers.filter((a) => a.answer !== 'nao').length
                  return (
                    <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer border-t border-line transition hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3"><Avatar name={users[c.techId]?.name ?? '?'} size={30} /><span className="font-semibold">{users[c.techId]?.name}</span></div>
                      </td>
                      <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-muted">{c.type === 'epi' ? <HardHat size={14} /> : <Truck size={14} />}{typeLabel(c.type)}</span></td>
                      <td className="num px-3 py-3 whitespace-nowrap">{fmtDate(c.date)} <span className="text-muted">{fmtTime(c.createdAt)}</span></td>
                      <td className="px-3 py-3 font-mono text-xs">{vehicles[c.vehicleId ?? '']?.plate ?? '—'}</td>
                      <td className="num px-3 py-3">{ok}/{c.answers.length}</td>
                      <td className="px-3 py-3"><ResultBadge result={c.result} /></td>
                      <td className="px-5 py-3">{c.validated ? <Badge tone="info"><BadgeCheck size={12} /> Validado</Badge> : <Badge tone="warn">Aguardando</Badge>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ChecklistDetail
        checklist={open ? db.checklists.find((c) => c.id === open.id) ?? null : null}
        db={db}
        onClose={() => setOpen(null)}
        onValidate={(id) => { validateChecklist(id); toast('Checklist validado.') }}
      />
    </div>
  )
}
