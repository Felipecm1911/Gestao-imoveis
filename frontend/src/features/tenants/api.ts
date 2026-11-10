import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, path, qs, type Page } from '@/lib/api'
import type { Address } from '@/features/owners/api'
import type { TenantPayload } from './schemas'

export type Tenant = {
  id: string
  name: string
  document: string
  email: string | null
  phone: string | null
  address: Address | null
  createdAt: string
  version: number
}

const key = ['tenants'] as const

export function useTenants(params: { q?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: [...key, 'list', params],
    queryFn: () => api<Page<Tenant>>(`/tenants${qs({ q: params.q, page: params.page, size: params.size ?? 20 })}`),
    placeholderData: keepPreviousData,
  })
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: [...key, id],
    queryFn: () => api<Tenant>(path`/tenants/${id}`),
    enabled: !!id,
  })
}

export function useSaveTenant(id?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TenantPayload) =>
      id ? api<Tenant>(path`/tenants/${id}`, { method: 'PUT', body: payload }) : api<Tenant>('/tenants', { method: 'POST', body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(path`/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}
