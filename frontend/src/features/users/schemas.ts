import { z } from 'zod'

export const newUserSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
  email: z.string().trim().email('E-mail inválido').max(254),
  password: z.string().min(8, 'Mínimo de 8 caracteres').max(72),
  role: z.enum(['ADMIN', 'STAFF']),
})

export type NewUserForm = z.infer<typeof newUserSchema>
