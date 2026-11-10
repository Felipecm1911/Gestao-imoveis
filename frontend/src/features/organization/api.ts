import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { meKey } from '@/features/auth/api'

export type Organization = { id: string; name: string; slug: string; plan: string }

const key = ['organization'] as const

export function useOrganization() {
  return useQuery({ queryKey: key, queryFn: () => api<Organization>('/organization') })
}

export function useRenameOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api<Organization>('/organization', { method: 'PATCH', body: { name } }),
    onSuccess: (org) => {
      qc.setQueryData(key, org)
      qc.invalidateQueries({ queryKey: meKey }) // o nome aparece na barra lateral
    },
  })
}
