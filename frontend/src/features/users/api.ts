import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NewUserForm } from './schemas'

export type User = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF'
  active: boolean
  createdAt: string
}

const key = ['users'] as const

export function useUsers() {
  return useQuery({ queryKey: key, queryFn: () => api<User[]>('/users') })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: NewUserForm) => api<User>('/users', { method: 'POST', body: form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/users/${id}/deactivate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}
