import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, path, qs, type Page } from '@/lib/api'
import type { PropertyPayload } from './schemas'

export type PropertyType = 'APARTAMENTO' | 'CASA' | 'COMERCIAL' | 'TERRENO' | 'OUTRO'
export type PropertyStatus = 'DISPONIVEL' | 'OCUPADO' | 'MANUTENCAO' | 'INATIVO'

type OwnerSummary = { id: string; name: string }
export type Photo = { id: string; url: string; position: number; cover: boolean }

export type PropertyListItem = {
  id: string
  code: string
  title: string
  type: PropertyType
  district: string
  city: string
  state: string
  areaM2: number | null
  bedrooms: number
  bathrooms: number
  parking: number
  suggestedRent: number
  status: PropertyStatus
  owner: OwnerSummary
  coverUrl: string | null
}

export type Property = Omit<PropertyListItem, 'coverUrl'> & {
  description: string | null
  street: string
  number: string
  complement: string | null
  zip: string
  photos: Photo[]
  createdAt: string
  version: number
}

export type PropertyFilters = {
  q?: string
  city?: string
  type?: string
  status?: string
  minRent?: string
  maxRent?: string
  page?: number
}

const key = ['properties'] as const

export function useProperties(filters: PropertyFilters) {
  return useQuery({
    queryKey: [...key, 'list', filters],
    queryFn: () => api<Page<PropertyListItem>>(`/properties${qs({ ...filters, size: 12 })}`),
    placeholderData: keepPreviousData,
  })
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: [...key, id],
    queryFn: () => api<Property>(path`/properties/${id}`),
    enabled: !!id,
  })
}

/** Toda mutação devolve o imóvel atualizado: grava no cache e invalida as listas. */
function usePropertyMutation<V>(fn: (vars: V) => Promise<Property | void>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (data) qc.setQueryData([...key, data.id], data)
      qc.invalidateQueries({ queryKey: [...key, 'list'] })
    },
  })
}

export function useSaveProperty(id?: string) {
  return usePropertyMutation((payload: PropertyPayload) =>
    id
      ? api<Property>(path`/properties/${id}`, { method: 'PUT', body: payload })
      : api<Property>('/properties', { method: 'POST', body: payload }),
  )
}

export function useChangeStatus(id: string) {
  return usePropertyMutation((status: PropertyStatus) =>
    api<Property>(path`/properties/${id}/status`, { method: 'PATCH', body: { status } }),
  )
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(path`/properties/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useUploadPhotos(id: string) {
  return usePropertyMutation((files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return api<Property>(path`/properties/${id}/photos`, { method: 'POST', form })
  })
}

export function useDeletePhoto(id: string) {
  return usePropertyMutation((photoId: string) =>
    api<Property>(path`/properties/${id}/photos/${photoId}`, { method: 'DELETE' }),
  )
}

export function useSetCover(id: string) {
  return usePropertyMutation((photoId: string) =>
    api<Property>(path`/properties/${id}/photos/${photoId}/cover`, { method: 'PUT' }),
  )
}
