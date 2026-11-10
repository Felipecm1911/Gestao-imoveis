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
  street: string
  number: string
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

/** Quantos imóveis o proprietário tem (coluna "Imóveis" da lista de proprietários). */
export function useOwnerPropertyCount(ownerId: string) {
  // shortcut: 1 requisição por linha (até 20 por página); trocar por contagem no /owners quando o repasse por proprietário entrar (Fase 5)
  return useQuery({
    queryKey: [...key, 'list', 'count', 'owner', ownerId],
    queryFn: () => api<Page<PropertyListItem>>(`/properties${qs({ ownerId, size: 1 })}`).then((p) => p.totalElements),
  })
}

/** Total por situação para os cards de resumo (size=1: só o totalElements interessa). */
export function usePropertyCount(status?: PropertyStatus) {
  return useQuery({
    queryKey: [...key, 'list', 'count', status ?? 'all'],
    queryFn: () => api<Page<PropertyListItem>>(`/properties${qs({ status, size: 1 })}`).then((p) => p.totalElements),
  })
}
