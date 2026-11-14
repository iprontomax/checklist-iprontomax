import { useState } from 'react'
import { HardHat, Pencil, Plus, RotateCcw, Trash2, Truck, Users } from 'lucide-react'
import { useStore } from '../../lib/store'
import type { CatalogItem, ItemCategory, Role, User, Vehicle, VehicleStatus } from '../../lib/types'
import { Avatar, Badge, Button, Card, ConfirmButton, Field, Input, Modal, PageHeader, Segmented, Select, type Tone } from '../../components/ui'

type Tab = 'usuarios' | 'veiculos' | 'itens'
const VSTATUS: Record<VehicleStatus, { label: string; tone: Tone }> = {
  disponivel: { label: 'Disponível', tone: 'brand' }, em_rota: { label: 'Em rota', tone: 'info' },
  bloqueado: { label: 'Bloqueado', tone: 'danger' }, manutencao: { label: 'Manutenção', tone: 'warn' },
}
const CAT: Record<ItemCategory, string> = { epi: 'EPI', material: 'Material', veiculo: 'Veículo' }

export function Cadastros() {
  const { resetDemo } = useStore()
  const [tab, setTab] = useState<Tab>('usuarios')
  return (
    <div>
      <PageHeader
        eyebrow="Gestão"
        title="Cadastros"
        sub="Usuários, frota e itens que aparecem nos checklists."
        action={<ConfirmButton variant="ghost" confirmLabel="Apagar alterações e restaurar?" onConfirm={resetDemo}><RotateCcw size={16} /> Restaurar demonstração</ConfirmButton>}
      />
      <Segmented
        className="mb-5"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'usuarios', label: <span className="inline-flex items-center gap-1.5"><Users size={14} /> Usuários</span> },
          { value: 'veiculos', label: <span className="inline-flex items-center gap-1.5"><Truck size={14} /> Veículos</span> },
          { value: 'itens', label: <span className="inline-flex items-center gap-1.5"><HardHat size={14} /> Itens do checklist</span> },
        ]}
      />
      {tab === 'usuarios' && <UsersTab />}
      {tab === 'veiculos' && <VehiclesTab />}
      {tab === 'itens' && <ItemsTab />}
    </div>
  )
}

function UsersTab() {
  const { db, saveUser, toast, user: me } = useStore()
  const [f, setF] = useState<Partial<User> | null>(null)
  const save = () => {
    if (!f?.name?.trim() || !f.username?.trim() || !f.password) return toast('Preencha nome, usuário e senha.', 'err')
    if (db.users.some((u) => u.username === f.username && u.id !== f.id)) return toast('Este nome de usuário já existe.', 'err')
    saveUser({ active: true, role: 'tecnico', ...f } as User)
    toast('Usuário salvo.')
    setF(null)
  }
  return (
    <Card className="animate-in overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="font-bold">{db.users.length} usuários</span>
        <Button variant="primary" size="sm" onClick={() => setF({ role: 'tecnico', active: true })}><Plus size={14} /> Novo usuário</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted"><tr><th className="px-5 py-3">Nome</th><th className="px-3 py-3">Usuário</th><th className="px-3 py-3">Perfil</th><th className="px-3 py-3">Veículo</th><th className="px-3 py-3">Situação</th><th className="px-5 py-3" /></tr></thead>
          <tbody>
            {db.users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} size={30} /><div><div className="font-semibold">{u.name}</div><div className="text-[11px] text-muted">{u.phone}</div></div></div></td>
                <td className="px-3 py-3 font-mono text-xs">{u.username}</td>
                <td className="px-3 py-3"><Badge tone={u.role === 'admin' ? 'info' : 'muted'}>{u.role === 'admin' ? 'Administrador' : 'Técnico'}</Badge></td>
                <td className="px-3 py-3 font-mono text-xs">{db.vehicles.find((v) => v.id === u.vehicleId)?.plate ?? '—'}</td>
                <td className="px-3 py-3">{u.active ? <Badge tone="brand">Ativo</Badge> : <Badge tone="danger">Inativo</Badge>}</td>
                <td className="px-5 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => setF(u)}><Pencil size={14} /> Editar</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {f && (
        <Modal open onClose={() => setF(null)} title={f.id ? 'Editar usuário' : 'Novo usuário'} footer={<><Button variant="ghost" onClick={() => setF(null)}>Cancelar</Button><Button variant="primary" onClick={save}>Salvar</Button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" className="sm:col-span-2"><Input autoFocus value={f.name ?? ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Usuário"><Input value={f.username ?? ''} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') })} /></Field>
            <Field label="Senha"><Input type="text" value={f.password ?? ''} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            <Field label="Perfil">
              <Select value={f.role} disabled={f.id === me?.id} onChange={(e) => setF({ ...f, role: e.target.value as Role })}><option value="tecnico">Técnico</option><option value="admin">Administrador</option></Select>
            </Field>
            <Field label="Telefone"><Input value={f.phone ?? ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Veículo vinculado">
              <Select value={f.vehicleId ?? ''} onChange={(e) => setF({ ...f, vehicleId: e.target.value || undefined })}>
                <option value="">—</option>{db.vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>)}
              </Select>
            </Field>
            <Field label="Situação">
              <Select value={f.active ? '1' : '0'} disabled={f.id === me?.id} onChange={(e) => setF({ ...f, active: e.target.value === '1' })}><option value="1">Ativo</option><option value="0">Inativo</option></Select>
            </Field>
          </div>
        </Modal>
      )}
    </Card>
  )
}

function VehiclesTab() {
  const { db, saveVehicle, toast } = useStore()
  const [f, setF] = useState<Partial<Vehicle> | null>(null)
  const save = () => {
    if (!f?.plate?.trim() || !f.model?.trim()) return toast('Informe placa e modelo.', 'err')
    saveVehicle({ status: 'disponivel', km: 0, year: new Date().getFullYear(), ...f, plate: f.plate.toUpperCase() } as Vehicle)
    toast('Veículo salvo.')
    setF(null)
  }
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button variant="primary" size="sm" onClick={() => setF({ status: 'disponivel' })}><Plus size={14} /> Novo veículo</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {db.vehicles.map((v) => {
          const driver = db.users.find((u) => u.vehicleId === v.id)
          const last = db.checklists.filter((c) => c.vehicleId === v.id && c.type === 'veiculo').at(-1)
          return (
            <Card key={v.id} className="animate-in p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-block rounded-md border-2 border-fg/80 px-2 py-0.5 font-mono text-sm font-bold tracking-widest">{v.plate}</div>
                  <div className="mt-2 font-bold">{v.model}</div>
                  <div className="text-xs text-muted">{v.year}</div>
                </div>
                <Badge tone={VSTATUS[v.status].tone}>{VSTATUS[v.status].label}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-surface-2 px-3 py-2"><div className="text-[11px] text-muted">Quilometragem</div><div className="num font-bold">{v.km.toLocaleString('pt-BR')} km</div></div>
                <div className="rounded-xl bg-surface-2 px-3 py-2"><div className="text-[11px] text-muted">Combustível</div><div className="num font-bold">{last?.fuel != null ? last.fuel + '%' : '—'}</div></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted">{driver ? `Técnico: ${driver.name}` : 'Sem técnico'}</span>
                <Button size="sm" variant="ghost" onClick={() => setF(v)}><Pencil size={14} /> Editar</Button>
              </div>
            </Card>
          )
        })}
      </div>
      {f && (
        <Modal open onClose={() => setF(null)} title={f.id ? 'Editar veículo' : 'Novo veículo'} footer={<><Button variant="ghost" onClick={() => setF(null)}>Cancelar</Button><Button variant="primary" onClick={save}>Salvar</Button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Placa"><Input autoFocus value={f.plate ?? ''} onChange={(e) => setF({ ...f, plate: e.target.value.toUpperCase() })} maxLength={7} /></Field>
            <Field label="Modelo"><Input value={f.model ?? ''} onChange={(e) => setF({ ...f, model: e.target.value })} /></Field>
            <Field label="Ano"><Input type="number" value={f.year ?? ''} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} /></Field>
            <Field label="Quilometragem"><Input type="number" value={f.km ?? ''} onChange={(e) => setF({ ...f, km: Number(e.target.value) })} /></Field>
            <Field label="Situação" className="sm:col-span-2">
              <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as VehicleStatus })}>
                {Object.entries(VSTATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </Select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ItemsTab() {
  const { db, saveItem, removeItem, toast } = useStore()
  const [f, setF] = useState<Partial<CatalogItem> | null>(null)
  const save = () => {
    if (!f?.name?.trim()) return toast('Informe o nome do item.', 'err')
    saveItem({ category: 'epi', mandatory: false, ...f, name: f.name.trim() } as CatalogItem)
    toast('Item salvo.')
    setF(null)
  }
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {(['epi', 'material', 'veiculo'] as ItemCategory[]).map((cat) => {
        const items = db.catalog.filter((c) => c.category === cat)
        return (
          <Card key={cat} className="animate-in overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="font-bold">{CAT[cat]} <span className="num text-muted">· {items.length}</span></span>
              <Button size="sm" variant="ghost" onClick={() => setF({ category: cat, mandatory: true, defaultQty: cat === 'veiculo' ? undefined : 1 })}><Plus size={14} /> Adicionar</Button>
            </div>
            <ul>
              {items.map((i) => (
                <li key={i.id} className="group flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{i.name}</div>
                    <div className="text-[11px] text-muted">{i.mandatory ? 'Obrigatório · bloqueia a saída' : 'Opcional'}{i.defaultQty != null && ` · qtd ${i.defaultQty}`}</div>
                  </div>
                  <button onClick={() => setF(i)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Editar"><Pencil size={14} /></button>
                  <ConfirmButton size="sm" variant="ghost" className="px-2 hover:text-danger" confirmLabel="Remover?" aria-label="Remover" onConfirm={() => { removeItem(i.id); toast('Item removido.', 'info') }}><Trash2 size={14} /></ConfirmButton>
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
      {f && (
        <Modal open onClose={() => setF(null)} title={f.id ? 'Editar item' : 'Novo item'} footer={<><Button variant="ghost" onClick={() => setF(null)}>Cancelar</Button><Button variant="primary" onClick={save}>Salvar</Button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do item" className="sm:col-span-2"><Input autoFocus value={f.name ?? ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Categoria">
              <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as ItemCategory })}><option value="epi">EPI</option><option value="material">Material</option><option value="veiculo">Veículo</option></Select>
            </Field>
            <Field label="Obrigatório?" hint="Itens obrigatórios com problema bloqueiam a saída.">
              <Select value={f.mandatory ? '1' : '0'} onChange={(e) => setF({ ...f, mandatory: e.target.value === '1' })}><option value="1">Sim</option><option value="0">Não</option></Select>
            </Field>
            {f.category !== 'veiculo' && (
              <Field label="Quantidade padrão"><Input type="number" min={0} value={f.defaultQty ?? ''} onChange={(e) => setF({ ...f, defaultQty: e.target.value === '' ? undefined : Number(e.target.value) })} /></Field>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
