import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, Printer } from 'lucide-react'
import { useStore } from '../../lib/store'
import { addDays, downloadCSV, fmtDate, parseDate, today } from '../../lib/utils'
import { Avatar, Button, Card, CardHeader, Field, Input, PageHeader, Progress } from '../../components/ui'

const tip = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--fg)', fontSize: 12 }

export function Relatorios() {
  const { db } = useStore()
  const [from, setFrom] = useState(addDays(today(), -29))
  const [to, setTo] = useState(today())

  const data = useMemo(() => {
    const list = db.checklists.filter((c) => c.date >= from && c.date <= to)
    let workdays = 0
    for (let d = from; d <= to; d = addDays(d, 1)) if (parseDate(d).getDay() !== 0) workdays++
    const techs = db.users.filter((u) => u.role === 'tecnico')
    const perTech = techs.map((u) => {
      const mine = list.filter((c) => c.techId === u.id)
      const days = new Set(mine.map((c) => c.date)).size
      const blocked = mine.filter((c) => c.result === 'bloqueado').length
      return { user: u, total: mine.length, days, blocked, compliance: workdays ? Math.round((days / workdays) * 100) : 0 }
    }).sort((a, b) => b.compliance - a.compliance)

    const failCount: Record<string, number> = {}
    list.forEach((c) => c.answers.forEach((a) => { if (a.answer === 'nao') failCount[a.name] = (failCount[a.name] ?? 0) + 1 }))
    const topFails = Object.entries(failCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, n]) => ({ name, n }))

    const liberados = list.filter((c) => c.result === 'liberado').length
    const resolved = db.pendencias.filter((p) => p.resolvedAt && p.resolvedAt.slice(0, 10) >= from && p.resolvedAt.slice(0, 10) <= to)
    const avgHours = resolved.length
      ? Math.round(resolved.reduce((s, p) => s + (new Date(p.resolvedAt!).getTime() - new Date(p.createdAt).getTime()), 0) / resolved.length / 36e5)
      : 0
    return { list, perTech, topFails, liberados, bloqueados: list.length - liberados, workdays, resolved: resolved.length, avgHours }
  }, [db, from, to])

  const pie = [
    { name: 'Liberados', value: data.liberados, color: 'var(--brand)' },
    { name: 'Bloqueados', value: data.bloqueados, color: 'var(--danger)' },
  ]

  const exportCsv = () =>
    downloadCSV(`conformidade_${from}_${to}.csv`, [
      ['Técnico', 'Checklists', 'Dias com checklist', 'Dias úteis', 'Conformidade (%)', 'Bloqueios'],
      ...data.perTech.map((r) => [r.user.name, r.total, r.days, data.workdays, r.compliance, r.blocked]),
    ])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestão"
        title="Relatórios"
        sub={`Período de ${fmtDate(from)} a ${fmtDate(to)} · ${data.workdays} dias úteis`}
        action={<><Button variant="outline" onClick={() => window.print()}><Printer size={16} /> Imprimir</Button><Button variant="primary" onClick={exportCsv}><Download size={16} /> Exportar CSV</Button></>}
      />
      <Card className="no-print animate-in grid gap-4 p-5 sm:grid-cols-2">
        <Field label="De"><Input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></Field>
        <Field label="Até"><Input type="date" value={to} min={from} max={today()} onChange={(e) => e.target.value && setTo(e.target.value)} /></Field>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Checklists no período', data.list.length],
          ['Taxa de liberação', data.list.length ? Math.round((data.liberados / data.list.length) * 100) + '%' : '—'],
          ['Pendências resolvidas', data.resolved],
          ['Tempo médio de resolução', data.avgHours ? data.avgHours + ' h' : '—'],
        ].map(([l, v]) => (
          <Card key={l} className="animate-in p-5">
            <div className="text-xs font-semibold text-muted">{l}</div>
            <div className="num mt-2 text-3xl font-extrabold tracking-tight">{v}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="animate-in">
          <CardHeader eyebrow="Conformidade" title="Por técnico" sub="Dias com checklist enviado ÷ dias úteis do período" />
          <div className="space-y-4 px-5 pb-6 sm:px-6">
            {data.perTech.map((r) => (
              <div key={r.user.id} className="flex items-center gap-4">
                <Avatar name={r.user.name} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">{r.user.name}</span>
                    <span className="num text-sm font-bold">{r.compliance}%</span>
                  </div>
                  <div className="mt-1.5"><Progress value={r.compliance} tone={r.compliance >= 90 ? 'brand' : r.compliance >= 70 ? 'warn' : 'danger'} /></div>
                  <div className="num mt-1 text-[11px] text-muted">{r.total} checklists · {r.blocked} bloqueio(s)</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="animate-in">
          <CardHeader eyebrow="Resultado" title="Liberados x bloqueados" />
          <div className="relative h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
                  {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip contentStyle={tip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><div className="num text-3xl font-extrabold">{data.list.length}</div><div className="text-[11px] text-muted">checklists</div></div>
            </div>
          </div>
          <div className="flex justify-center gap-5 pb-6 text-xs font-semibold text-muted">
            {pie.map((p) => <span key={p.name} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: p.color }} />{p.name} <span className="num text-fg">{p.value}</span></span>)}
          </div>
        </Card>
      </div>

      <Card className="animate-in">
        <CardHeader eyebrow="Itens" title="Itens que mais geraram problema" />
        <div className="h-72 px-2 pb-4 sm:px-4">
          {data.topFails.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted">Nenhum item com problema no período. 🎉</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topFails} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--line)" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={210} tick={{ fill: 'var(--fg)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: 'var(--surface-2)' }} formatter={(v) => [v, 'Ocorrências']} />
                <Bar dataKey="n" fill="var(--warn)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  )
}
