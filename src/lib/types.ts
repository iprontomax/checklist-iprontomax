export type Role = 'admin' | 'tecnico'

export interface User {
  id: string
  name: string
  username: string
  password: string
  role: Role
  vehicleId?: string
  phone?: string
  active: boolean
}

export type VehicleStatus = 'disponivel' | 'em_rota' | 'bloqueado' | 'manutencao'

export interface Vehicle {
  id: string
  plate: string
  model: string
  year: number
  km: number
  status: VehicleStatus
}

export type ItemCategory = 'epi' | 'material' | 'veiculo'

export interface CatalogItem {
  id: string
  name: string
  category: ItemCategory
  /** quando obrigatório, "Não" bloqueia a saída para a rota */
  mandatory: boolean
  defaultQty?: number
}

export type Answer = 'sim' | 'nao' | 'na'

export interface ChecklistAnswer {
  itemId: string
  name: string
  answer: Answer
  qty?: number
  note?: string
  photos: string[]
  mandatory: boolean
}

export type ChecklistType = 'epi' | 'veiculo'
export type ChecklistResult = 'liberado' | 'bloqueado'

export interface Checklist {
  id: string
  type: ChecklistType
  techId: string
  vehicleId?: string
  date: string // YYYY-MM-DD
  createdAt: string // ISO
  answers: ChecklistAnswer[]
  km?: number
  fuel?: number // 0-100
  signature: string // dataURL
  result: ChecklistResult
  validated: boolean
  validatedBy?: string
}

export type PendStatus = 'aberta' | 'andamento' | 'resolvida'
export type Priority = 'baixa' | 'media' | 'alta'

export interface Pendencia {
  id: string
  title: string
  description: string
  status: PendStatus
  priority: Priority
  origin: 'checklist' | 'ausencia' | 'manual'
  checklistId?: string
  techId?: string
  vehicleId?: string
  assignedTo?: string
  dueDate?: string
  createdAt: string
  resolvedAt?: string
  history: { at: string; by: string; text: string }[]
}

export interface AgendaEvent {
  id: string
  title: string
  date: string
  time?: string
  notes?: string
  pendenciaId?: string
  color: 'brand' | 'warn' | 'danger' | 'info'
}

export interface LogEntry {
  id: string
  at: string
  event: string
  actor: string
  ref?: string
}

export interface Notification {
  id: string
  at: string
  userId: string | 'admins'
  text: string
  read: boolean
  link?: string
}

export interface DB {
  version: number
  users: User[]
  vehicles: Vehicle[]
  catalog: CatalogItem[]
  checklists: Checklist[]
  pendencias: Pendencia[]
  agenda: AgendaEvent[]
  logs: LogEntry[]
  notifications: Notification[]
}
