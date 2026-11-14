import { useState } from 'react'
import { BadgeCheck, Ban, Check, Fuel, Gauge, Minus, X } from 'lucide-react'
import type { Checklist, DB } from '../lib/types'
import { fmtDateTime } from '../lib/utils'
import { IS_ARTIFACT } from '../lib/env'
import { Badge, Button, Modal } from './ui'

export function ResultBadge({ result }: { result: Checklist['result'] }) {
  return result === 'liberado'
    ? <Badge tone="brand"><Check size={12} /> Liberado</Badge>
    : <Badge tone="danger"><Ban size={12} /> Bloqueado</Badge>
}

export const typeLabel = (t: Checklist['type']) => (t === 'epi' ? "EPI's e materiais" : 'Veículo')

export function ChecklistDetail({ checklist: c, db, onClose, onValidate }: {
  checklist: Checklist | null; db: DB; onClose: () => void; onValidate?: (id: string) => void
}) {
  const [photo, setPhoto] = useState<string | null>(null)
  if (!c) return null
  const tech = db.users.find((u) => u.id === c.techId)
  const vehicle = db.vehicles.find((v) => v.id === c.vehicleId)
  const okCount = c.answers.filter((a) => a.answer === 'sim').length

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={<span className="flex items-center gap-2">Checklist de {typeLabel(c.type).toLowerCase()} <ResultBadge result={c.result} /></span>}
      footer={
        <>
          {!IS_ARTIFACT && <Button variant="ghost" onClick={() => window.print()}>Imprimir</Button>}
          {onValidate && !c.validated && (
            <Button variant="primary" onClick={() => onValidate(c.id)}><BadgeCheck size={16} /> Validar checklist</Button>
          )}
          {c.validated && <Badge tone="info" className="self-center"><BadgeCheck size={12} /> Validado</Badge>}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Info label="Técnico" value={tech?.name ?? '—'} />
        <Info label="Enviado em" value={fmtDateTime(c.createdAt)} />
        <Info label="Veículo" value={vehicle ? `${vehicle.plate}` : '—'} />
        <Info label="Itens OK" value={`${okCount} de ${c.answers.length}`} />
      </div>
      {c.type === 'veiculo' && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Info label="Quilometragem" value={<span className="inline-flex items-center gap-1.5"><Gauge size={14} /> {c.km?.toLocaleString('pt-BR')} km</span>} />
          <Info label="Combustível" value={<span className="inline-flex items-center gap-1.5"><Fuel size={14} /> {c.fuel}%</span>} />
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-line">
        {c.answers.map((a) => (
          <div key={a.itemId} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0">
            <span className={
              'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ' +
              (a.answer === 'sim' ? 'bg-brand-soft text-brand' : a.answer === 'nao' ? 'bg-danger-soft text-danger' : 'bg-surface-3 text-muted')
            }>
              {a.answer === 'sim' ? <Check size={14} /> : a.answer === 'nao' ? <X size={14} /> : <Minus size={14} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {a.name}
                {a.mandatory && <span className="text-[10px] font-bold uppercase tracking-wider text-muted">obrigatório</span>}
                {a.qty != null && <span className="num text-xs font-medium text-muted">· qtd {a.qty}</span>}
              </div>
              {a.note && <p className="mt-0.5 text-sm text-muted">{a.note}</p>}
              {a.photos.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {a.photos.map((p, i) => (
                    <button key={i} onClick={() => setPhoto(p)} className="overflow-hidden rounded-lg border border-line">
                      <img src={p} alt="" className="size-14 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold text-muted">Assinatura do técnico</div>
        <div className="rounded-2xl border border-line bg-white p-3">
          <img src={c.signature} alt="Assinatura" className="mx-auto h-24 object-contain" />
        </div>
        <div className="mt-1.5 text-center text-xs text-muted">{tech?.name}</div>
      </div>

      {photo && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-6" onClick={() => setPhoto(null)}>
          <img src={photo} alt="" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </Modal>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3.5 py-2.5">
      <div className="text-[11px] font-semibold text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  )
}
