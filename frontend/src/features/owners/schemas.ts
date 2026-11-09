import { z } from 'zod'
import type { Owner } from './api'

const optional = (schema: z.ZodString) => z.union([schema, z.literal('')])
const digits = (s: string) => s.replace(/\D/g, '')

export const ownerSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120),
  // dígitos verificadores são conferidos no backend; aqui só o formato
  document: z.string().refine((s) => [11, 14].includes(digits(s).length), 'CPF (11 dígitos) ou CNPJ (14 dígitos)'),
  email: optional(z.string().trim().email('E-mail inválido')),
  phone: z.string().refine((s) => s === '' || /^\d{10,11}$/.test(digits(s)), 'Telefone com DDD'),
  street: z.string().max(120),
  number: z.string().max(10),
  complement: z.string().max(60),
  district: z.string().max(80),
  city: z.string().max(80),
  state: z.string().refine((s) => s === '' || /^[A-Za-z]{2}$/.test(s), 'UF com 2 letras'),
  zip: z.string().refine((s) => s === '' || digits(s).length === 8, 'CEP com 8 dígitos'),
  bankInfo: z.string().max(300),
})

export type OwnerForm = z.infer<typeof ownerSchema>

export type OwnerPayload = ReturnType<typeof toPayload>

export const emptyOwner: OwnerForm = {
  name: '', document: '', email: '', phone: '', street: '', number: '', complement: '',
  district: '', city: '', state: '', zip: '', bankInfo: '',
}

export function fromOwner(o: Owner): OwnerForm {
  const a = o.address ?? {}
  return {
    name: o.name, document: o.document, email: o.email ?? '', phone: o.phone ?? '',
    street: a.street ?? '', number: a.number ?? '', complement: a.complement ?? '', district: a.district ?? '',
    city: a.city ?? '', state: a.state ?? '', zip: a.zip ?? '', bankInfo: o.bankInfo ?? '',
  }
}

const orNull = (s: string) => (s.trim() === '' ? null : s.trim())

export function toPayload(f: OwnerForm, version?: number) {
  const address = {
    street: orNull(f.street), number: orNull(f.number), complement: orNull(f.complement),
    district: orNull(f.district), city: orNull(f.city), state: orNull(f.state.toUpperCase()),
    zip: f.zip ? digits(f.zip) : null,
  }
  return {
    name: f.name.trim(),
    document: digits(f.document),
    email: orNull(f.email),
    phone: f.phone ? digits(f.phone) : null,
    address: Object.values(address).some((v) => v !== null) ? address : null,
    bankInfo: orNull(f.bankInfo),
    version,
  }
}
