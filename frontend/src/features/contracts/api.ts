import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, path, qs, type Page } from '@/lib/api'
import type { ContractPayload } from './schemas'

export type Situation = 'RASCUNHO' | 'ATIVO' | 'EM_RENOVACAO' | 'ENCERRANDO' | 'ENCERRADO' | 'CANCELADO'
export type ContractStatus = 'RASCUNHO' | 'ATIVO' | 'ENCERRADO' | 'CANCELADO'
export type AdjustmentIndex = 'NENHUM' | 'IGPM' | 'IPCA' | 'PERCENTUAL_FIXO'
export type GuaranteeType = 'NENHUMA' | 'CAUCAO' | 'FIADOR' | 'SEGURO_FIANCA' | 'TITULO_CAPITALIZACAO'

export type ContractListItem = {
  id: string
  code: string
  propertyId: string
  propertyCode: string
  propertyTitle: string
  tenantId: string
  tenantName: string
  monthlyRent: number
  startDate: string
  endDate: string
  status: ContractStatus
  situation: Situation
}

type ContractRef = { id: string; code: string }
export type Installment = { id: string; number: number; referenceMonth: string; dueDate: string; amount: number; status: string }
export type Adjustment = { id: string; percent: number; effectiveDate: string; oldRent: number; newRent: number; createdAt: string }

export type Contract = {
  id: string
  code: string
  status: ContractStatus
  situation: Situation
  property: { id: string; code: string; title: string; address: string; coverUrl: string | null }
  owner: { id: string; name: string }
  tenant: { id: string; name: string; document: string }
  startDate: string
  endDate: string
  monthlyRent: number
  dueDay: number
  adjustmentIndex: AdjustmentIndex
  adjustmentPercent: number | null
  guaranteeType: GuaranteeType
  guaranteeValue: number | null
  guaranteeNotes: string | null
  notes: string | null
  previousContract: ContractRef | null
  renewal: ContractRef | null
  endedAt: string | null
  endReason: string | null
  installments: Installment[]
  adjustments: Adjustment[]
  /** Calculado no backend: aqui só se mostra. */
  summary: { total: number; received: number; open: number; overdue: number; progressPercent: number }
  createdAt: string
  version: number
}

export type ContractStats = { total: number; active: number; renewing: number; ending: number; ended: number }
export type HistoryEntry = { action: string; at: string; userName: string | null }

export type ContractFilters = {
  q?: string
  situation?: string
  propertyId?: string
  tenantId?: string
  sort?: string
  page?: number
  size?: number
}

const key = ['contracts'] as const

export function useContracts(filters: ContractFilters) {
  return useQuery({
    queryKey: [...key, 'list', filters],
    queryFn: () => api<Page<ContractListItem>>(`/contracts${qs(filters)}`),
    placeholderData: keepPreviousData,
  })
}

export function useContractStats() {
  return useQuery({ queryKey: [...key, 'stats'], queryFn: () => api<ContractStats>('/contracts/stats') })
}

export function useContract(id: string | undefined) {
  return useQuery({
    queryKey: [...key, id],
    queryFn: () => api<Contract>(path`/contracts/${id}`),
    enabled: !!id,
  })
}

export function useContractHistory(id: string) {
  return useQuery({
    queryKey: [...key, id, 'history'],
    queryFn: () => api<HistoryEntry[]>(path`/contracts/${id}/history`),
  })
}

export function useTenantContractCount(tenantId: string) {
  // shortcut: 1 requisição por linha (até 20 por página); trocar por contagem no /tenants se a lista ficar lenta
  return useQuery({
    queryKey: [...key, 'list', 'count', 'tenant', tenantId],
    queryFn: () => api<Page<ContractListItem>>(`/contracts${qs({ tenantId, size: 1 })}`).then((p) => p.totalElements),
  })
}

/** Contrato mexe na situação do imóvel (ocupa/libera): invalida os dois. */
function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: key })
    qc.invalidateQueries({ queryKey: ['properties'] })
  }
}

export function useSaveContract(id?: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (payload: ContractPayload) =>
      id ? api<Contract>(path`/contracts/${id}`, { method: 'PUT', body: payload }) : api<Contract>('/contracts', { method: 'POST', body: payload }),
    onSuccess: invalidate,
  })
}

export type ContractAction =
  | { action: 'activate' | 'renew' | 'cancel' }
  | { action: 'adjust'; body: { percent: string; effectiveDate: string } }
  | { action: 'terminate'; body: { date: string; reason: string } }

/** `renew` devolve o rascunho da renovação; as demais, o próprio contrato atualizado. */
export function useContractAction(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (a: ContractAction) =>
      api<Contract>(path`/contracts/${id}/${a.action}`, { method: 'POST', body: 'body' in a ? a.body : undefined }),
    onSuccess: invalidate,
  })
}
