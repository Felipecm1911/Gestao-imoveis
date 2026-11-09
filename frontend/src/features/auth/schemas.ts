import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
})
export type LoginForm = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  organizationName: z.string().trim().min(1, 'Informe o nome da imobiliária').max(120),
  name: z.string().trim().min(1, 'Informe seu nome').max(120),
  email: z.string().trim().email('Informe um e-mail válido').max(254),
  password: z.string().min(8, 'Mínimo de 8 caracteres').max(72, 'Máximo de 72 caracteres'),
})
export type SignupForm = z.infer<typeof signupSchema>
