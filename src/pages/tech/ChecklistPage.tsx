import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Ban, Camera, Check, ChevronRight, Fuel, Gauge, Minus, PenLine, Send, ShieldCheck, Trash2, TriangleAlert, X } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { Answer, ChecklistAnswer, ChecklistType } from '../../lib/types'
import { compressImage, cx, fmtTime, today } from '../../lib/utils'
import { SignaturePad } from '../../components/SignaturePad'
import { ChecklistDetail, ResultBadge } from '../../components/ChecklistDetail'
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'

const MAX_PHOTOS = 5

export function ChecklistPage({ type }: { type: ChecklistType }) {
  const { db, user, submitChecklist, toast } = useStore()
  const nav = useNavigate()
  const existing = db.checklists.filter((c) => c.techId === user!.id && c.date === today() && c.type === type).at(-1)
  const [redo, setRedo] = useState(false)
  const [viewing, setViewing] = useState(false)

  const items = useMemo(
    () => db.catalog.filter((c) => (type === 'epi' ? c.category !== 'veiculo' : c.category === 'veiculo')),
    [db.catalog, type],
  )
  const [answers, setAnswers] = useState<ChecklistAnswer[]>(() =>
    items.map((c) => ({ itemId: c.id, name: c.name, answer: 'sim', qty: c.defaultQty, photos: [], mandatory: c.mandatory })),
  )
  const myVehicle = db.vehicles.find((v) => v.id === user!.vehicleId)
  const [vehicleId, setVehicleId] = useState(user!.vehicleId ?? db.vehicles[0]?.id ?? '')
  const vehicle = db.vehicles.find((v) => v.id === vehicleId)
  const [km, setKm] = useState<string>(myVehicle ? String(myVehicle.km) : '')
  const [fuel, setFuel] = useState(50)
  const [signature, setSignature] = useState<string | null>(null)

  const hasIntro = type === 'veiculo'
  const total = items.length + (hasIntro ? 1 : 0) + 1
  const [step, setStep] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const title = type === 'epi' ? "Checklist de EPI's e materiais" : 'Checklist do veículo'
  const yes = type === 'epi' ? 'Sim' : 'OK'
  const no = type === 'epi' ? 'Não' : 'Com problema'

  if (existing && !redo) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="Checklist · hoje" title={title} />
        <Card className="animate-in p-8 text-center">
          <div className={cx('mx-auto grid size-16 place-items-center rounded-2xl', existing.result === 'liberado' ? 'bg-brand text-brand-ink' : 'bg-danger text-white')}>
            {existing.result === 'liberado' ? <ShieldCheck size={30} /> : <Ban size={30} />}
          </div>
          <h2 className="mt-4 text-2xl font-extrabold">{existing.result === 'liberado' ? 'Checklist enviado!' : 'Saída bloqueada'}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Enviado hoje às {fmtTime(existing.createdAt)}.{' '}
            {existing.result === 'bloqueado'
              ? 'Os itens com problema viraram pendências para a administração. Depois de resolvido, envie um novo checklist.'
              : 'Está tudo certo para sair para a rota.'}
          </p>
          <div className="mt-3"><ResultBadge result={existing.result} /></div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setViewing(true)}>Ver detalhes</Button>
            <Button variant="secondary" onClick={() => setRedo(true)}>Enviar novo checklist</Button>
            <Link to="/tecnico"><Button variant="primary">Voltar ao início</Button></Link>
          </div>
        </Card>
        {viewing && <ChecklistDetail checklist={existing} db={db} onClose={() => setViewing(false)} />}
      </div>
    )
  }

  const itemIndex = step - (hasIntro ? 1 : 0)
  const isIntro = hasIntro && step === 0
  const isFinal = step === total - 1
  const current = !isIntro && !isFinal ? answers[itemIndex] : undefined
  const catalogItem = current ? items[itemIndex] : undefined

  const patch = (i: number, p: Partial<ChecklistAnswer>) => setAnswers((a) => a.map((x, j) => (j === i ? { ...x, ...p } : x)))

  const stepError = (): string | null => {
    if (isIntro) {
      if (!vehicleId) return 'Selecione o veículo.'
      const n = Number(km)
      if (!km || Number.isNaN(n) || n <= 0) return 'Informe a quilometragem atual.'
      if (vehicle && n < vehicle.km) return `A quilometragem não pode ser menor que a última registrada (${vehicle.km.toLocaleString('pt-BR')} km).`
    }
    if (current && current.answer === 'nao' && current.mandatory && !current.note?.trim())
      return 'Descreva o problema na observação — este item é obrigatório.'
    return null
  }

  const next = () => {
    const err = stepError()
    if (err) return toast(err, 'err')
    setStep((s) => Math.min(total - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files || !current) return
    const room = MAX_PHOTOS - current.photos.length
    const list = Array.from(files).slice(0, room)
    try {
      const imgs = await Promise.all(list.map((f) => compressImage(f)))
      patch(itemIndex, { photos: [...current.photos, ...imgs] })
    } catch {
      toast('Não foi possível ler a imagem.', 'err')
    }
  }

  const failures = answers.filter((a) => a.answer === 'nao' && a.mandatory)

  const submit = () => {
    if (!signature) return toast('Assine para confirmar o checklist.', 'err')
    const ck = submitChecklist({
      type, techId: user!.id, vehicleId: type === 'veiculo' ? vehicleId : user!.vehicleId, answers,
      km: type === 'veiculo' ? Number(km) : undefined, fuel: type === 'veiculo' ? fuel : undefined, signature,
    })
    toast(ck.result === 'liberado' ? 'Checklist enviado. Liberado para a rota!' : 'Checklist enviado com bloqueio. Administração avisada.', ck.result === 'liberado' ? 'ok' : 'err')
    nav('/tecnico')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={type === 'epi' ? 'Processos · EPI' : 'Processos · Frota'} title={title} sub="Uma etapa por vez. Você pode voltar e corrigir antes de assinar." />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="animate-in overflow-hidden">
          {/* progresso */}
          <div className="border-b border-line px-5 py-4 sm:px-7">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>Etapa <span className="num text-fg">{step + 1}</span> de <span className="num">{total}</span></span>
              <span className="num">{Math.round(((step + 1) / total) * 100)}%</span>
            </div>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={cx('h-1.5 flex-1 rounded-full transition-colors', i < step ? 'bg-brand' : i === step ? 'bg-brand/60' : 'bg-surface-3')} />
              ))}
            </div>
          </div>

          <div key={step} className="animate-in px-5 py-6 sm:px-7">
            {isIntro && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold tracking-tight">Dados do veículo</h2>
                <Field label="Veículo">
                  <Select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); const v = db.vehicles.find((x) => x.id === e.target.value); if (v) setKm(String(v.km)) }}>
                    {db.vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
                  </Select>
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Quilometragem atual (km)" hint={vehicle ? `Último registro: ${vehicle.km.toLocaleString('pt-BR')} km` : undefined}>
                    <div className="relative">
                      <Gauge size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
                      <Input inputMode="numeric" className="num pl-10" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ''))} />
                    </div>
                  </Field>
                  <Field label={`Nível de combustível: ${fuel}%`}>
                    <div className="flex h-11 items-center gap-3">
                      <Fuel size={16} className="text-muted" />
                      <input type="range" min={0} max={100} step={5} value={fuel} onChange={(e) => setFuel(Number(e.target.value))} className="w-full accent-[var(--brand)]" />
                    </div>
                  </Field>
                </div>
                {fuel <= 20 && <div className="flex items-center gap-2 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm font-medium text-warn"><TriangleAlert size={16} /> Combustível baixo — abasteça antes de iniciar a rota.</div>}
              </div>
            )}

            {current && catalogItem && (
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={catalogItem.category === 'epi' ? 'info' : catalogItem.category === 'material' ? 'brand' : 'warn'}>
                      {catalogItem.category === 'epi' ? 'EPI' : catalogItem.category === 'material' ? 'Material' : 'Veículo'}
                    </Badge>
                    {current.mandatory && <Badge tone="muted">Obrigatório</Badge>}
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold tracking-tight uppercase sm:text-2xl">{current.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {type === 'epi' ? 'O técnico está com este EPI/item, em condições de uso?' : 'Este item está em condições adequadas?'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                  {([
                    { v: 'sim', label: yes, icon: <Check size={18} />, on: 'border-brand bg-brand-soft text-brand' },
                    { v: 'nao', label: no, icon: <X size={18} />, on: 'border-danger bg-danger-soft text-danger' },
                    { v: 'na', label: 'N/A', icon: <Minus size={18} />, on: 'border-muted bg-surface-3 text-fg' },
                  ] as { v: Answer; label: string; icon: React.ReactNode; on: string }[]).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => patch(itemIndex, { answer: o.v })}
                      className={cx(
                        'flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-sm font-bold transition',
                        current.answer === o.v ? o.on : 'border-line text-muted hover:border-muted hover:text-fg',
                      )}
                    >
                      {o.icon}{o.label}
                    </button>
                  ))}
                </div>

                {current.answer === 'nao' && current.mandatory && (
                  <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
                    <Ban size={16} className="mt-0.5 shrink-0" /> Item obrigatório com problema: a saída para a rota será bloqueada e uma pendência será aberta.
                  </div>
                )}

                {current.qty != null && (
                  <Field label="Quantidade" className="max-w-40">
                    <Input type="number" min={0} className="num" value={current.qty} onChange={(e) => patch(itemIndex, { qty: Number(e.target.value) })} />
                  </Field>
                )}

                <Field label={current.answer === 'nao' && current.mandatory ? 'Observação (obrigatória)' : 'Observação (opcional)'}>
                  <Textarea placeholder="Descreva rapidamente se necessário" value={current.note ?? ''} onChange={(e) => patch(itemIndex, { note: e.target.value })} />
                </Field>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted">Fotos desta etapa (opcional)</span>
                    <span className="num text-xs text-muted">{current.photos.length}/{MAX_PHOTOS} fotos</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {current.photos.map((p, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-xl border border-line">
                        <img src={p} alt="" className="size-20 object-cover" />
                        <button
                          onClick={() => patch(itemIndex, { photos: current.photos.filter((_, j) => j !== i) })}
                          className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                          aria-label="Remover foto"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {current.photos.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-[11px] font-semibold text-muted transition hover:border-brand hover:text-brand"
                      >
                        <Camera size={18} /> Tirar foto
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
                </div>
              </div>
            )}

            {isFinal && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Revisão e assinatura</h2>
                  <p className="mt-1 text-sm text-muted">Confira o resumo e assine para confirmar que as informações são verdadeiras.</p>
                </div>
                <div className={cx('flex items-start gap-3 rounded-2xl border p-4', failures.length ? 'border-danger/40 bg-danger-soft' : 'border-brand/40 bg-brand-soft')}>
                  {failures.length ? <Ban className="mt-0.5 shrink-0 text-danger" size={20} /> : <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={20} />}
                  <div>
                    <div className={cx('font-bold', failures.length ? 'text-danger' : 'text-brand')}>
                      {failures.length ? 'Resultado: saída BLOQUEADA' : 'Resultado: LIBERADO para a rota'}
                    </div>
                    {failures.length > 0 && <div className="mt-1 text-sm">{failures.map((f) => f.name).join(' · ')}</div>}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {answers.map((a, i) => (
                    <button
                      key={a.itemId}
                      onClick={() => setStep(i + (hasIntro ? 1 : 0))}
                      className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2 text-left text-sm transition hover:bg-surface-3"
                    >
                      <AnswerDot a={a.answer} />
                      <span className="flex-1 truncate">{a.name}</span>
                      <ChevronRight size={14} className="text-muted" />
                    </button>
                  ))}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted"><PenLine size={14} /> Assinatura de {user!.name}</div>
                  <SignaturePad onChange={setSignature} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-7">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft size={16} /> Anterior
            </Button>
            <span className="hidden text-xs text-muted sm:block">Etapa {step + 1} de {total}</span>
            {isFinal ? (
              <Button variant="primary" onClick={submit} disabled={!signature}><Send size={16} /> Enviar checklist</Button>
            ) : (
              <Button variant="primary" onClick={next}>Próxima etapa <ArrowRight size={16} /></Button>
            )}
          </div>
        </Card>

        {/* índice de etapas */}
        <Card className="hidden h-fit p-3 lg:block">
          <div className="px-2 pt-1 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Etapas</div>
          {hasIntro && <StepLink active={step === 0} done={step > 0} label="Dados do veículo" onClick={() => setStep(0)} />}
          {answers.map((a, i) => {
            const s = i + (hasIntro ? 1 : 0)
            return <StepLink key={a.itemId} active={step === s} done={step > s} label={a.name} answer={step > s ? a.answer : undefined} onClick={() => !stepError() && setStep(s)} />
          })}
          <StepLink active={isFinal} done={false} label="Revisão e assinatura" onClick={() => !stepError() && setStep(total - 1)} />
        </Card>
      </div>
    </div>
  )
}

function AnswerDot({ a }: { a: Answer }) {
  return (
    <span className={cx('grid size-5 shrink-0 place-items-center rounded-full', a === 'sim' ? 'bg-brand-soft text-brand' : a === 'nao' ? 'bg-danger-soft text-danger' : 'bg-surface-3 text-muted')}>
      {a === 'sim' ? <Check size={12} /> : a === 'nao' ? <X size={12} /> : <Minus size={12} />}
    </span>
  )
}

function StepLink({ active, done, label, answer, onClick }: { active: boolean; done: boolean; label: string; answer?: Answer; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition', active ? 'bg-brand-soft font-bold text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg')}
    >
      {answer ? <AnswerDot a={answer} /> : <span className={cx('size-5 shrink-0 rounded-full border-2', active ? 'border-brand' : done ? 'border-brand bg-brand' : 'border-line')} />}
      <span className="truncate">{label}</span>
    </button>
  )
}
