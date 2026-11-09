import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/api'
import type { LoginForm, SignupForm } from './schemas'

export type Role = 'ADMIN' | 'STAFF' | 'OWNER' | 'TENANT'

export type Me = {
  id: string
  name: string
  email: string
  role: Role
  organizationId: string
  organizationName: string
}

export const meKey = ['auth', 'me'] as const

/** Usuário logado; null quando não há sessão (401). */
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => {
      try {
        return await api<Me>('/auth/me')
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: LoginForm) => api<Me>('/auth/login', { method: 'POST', body: form }),
    onSuccess: (me) => {
      qc.clear()
      qc.setQueryData(meKey, me)
    },
  })
}

export function useSignup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: SignupForm) => api<Me>('/auth/signup', { method: 'POST', body: form }),
    onSuccess: (me) => {
      qc.clear()
      qc.setQueryData(meKey, me)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.clear()
      qc.setQueryData(meKey, null)
    },
  })
}
