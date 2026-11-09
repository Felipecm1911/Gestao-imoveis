import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, path, qs, type Page } from '@/lib/api'
import type { OwnerPayload } from './schemas'

export type Address = {
  street?: string | null
  number?: string | null
  complement?: string | null
  district?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

export type Owner = {
  id: string
  name: string
  document: string
  email: string | null
  phone: string | null
  address: Address | null
  bankInfo: string | null
  createdAt: string
  version: number
}

const key = ['owners'] as const

export function useOwners(params: { q?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: [...key, 'list', params],
    queryFn: () => api<Page<Owner>>(`/owners${qs({ q: params.q, page: params.page, size: params.size ?? 20 })}`),
    placeholderData: keepPreviousData,
  })
}

export function useOwner(id: string | undefined) {
  return useQuery({
    queryKey: [...key, id],
    queryFn: () => api<Owner>(path`/owners/${id}`),
    enabled: !!id,
  })
}

export function useSaveOwner(id?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: OwnerPayload) =>
      id ? api<Owner>(path`/owners/${id}`, { method: 'PUT', body: payload }) : api<Owner>('/owners', { method: 'POST', body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteOwner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(path`/owners/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}
