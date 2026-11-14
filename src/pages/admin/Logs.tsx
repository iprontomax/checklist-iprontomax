import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import { useStore } from '../../lib/store'
import { IS_ARTIFACT } from '../../lib/env'
import { downloadCSV, fmtDateTime } from '../../lib/utils'
import { Button, Card, Input, PageHeader } from '../../components/ui'

export function Logs() {
  const { db } = useStore()
  const [q, setQ] = useState('')
  const list = db.logs.filter((l) => !q || (l.event + ' ' + l.actor).toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <PageHeader
        eyebrow="Gestão"
        title="Logs do sistema"
        sub="Registro de acessos e ações realizadas."
        action={!IS_ARTIFACT && <Button variant="outline" onClick={() => downloadCSV('logs.csv', [['Quando', 'Evento', 'Responsável', 'Registro'], ...list.map((l) => [fmtDateTime(l.at), l.event, l.actor, l.ref ?? ''])])}><Download size={16} /> Exportar</Button>}
      />
      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <Input className="pl-10" placeholder="Filtrar eventos" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card className="animate-in overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted"><tr><th className="px-5 py-3">Quando</th><th className="px-3 py-3">Evento</th><th className="px-3 py-3">Responsável</th><th className="px-5 py-3">Registro</th></tr></thead>
          <tbody>
            {list.slice(0, 300).map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="num px-5 py-2.5 whitespace-nowrap text-muted">{fmtDateTime(l.at)}</td>
                <td className="px-3 py-2.5">{l.event}</td>
                <td className="px-3 py-2.5">{l.actor}</td>
                <td className="px-5 py-2.5 font-mono text-xs text-muted">{l.ref ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
