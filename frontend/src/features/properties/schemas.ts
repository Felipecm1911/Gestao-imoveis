import { z } from 'zod'
import { parseDecimalInput } from '@/lib/format'
import type { Property } from './api'

const count = z.string().refine((s) => /^\d{1,2}$/.test(s), 'Número de 0 a 99')
const money = (msg: string) => z.string().refine((s) => parseDecimalInput(s) !== null, msg)

export const propertySchema = z.object({
  ownerId: z.string().min(1, 'Escolha o proprietário'),
  code: z.string().trim().min(1, 'Informe o código').max(20).regex(/^[A-Za-z0-9-]+$/, 'Use letras, números e hífen'),
  title: z.string().trim().min(1, 'Informe o título').max(120),
  description: z.string().max(4000),
  type: z.enum(['APARTAMENTO', 'CASA', 'COMERCIAL', 'TERRENO', 'OUTRO']),
  zip: z.string().refine((s) => s.replace(/\D/g, '').length === 8, 'CEP com 8 dígitos'),
  street: z.string().trim().min(1, 'Informe a rua').max(120),
  number: z.string().trim().min(1, 'Informe o número').max(10),
  complement: z.string().max(60),
  district: z.string().trim().min(1, 'Informe o bairro').max(80),
  city: z.string().trim().min(1, 'Informe a cidade').max(80),
  state: z.string().regex(/^[A-Za-z]{2}$/, 'UF com 2 letras'),
  areaM2: z.string().refine((s) => s === '' || parseDecimalInput(s) !== null, 'Área inválida'),
  bedrooms: count,
  bathrooms: count,
  parking: count,
  suggestedRent: money('Valor inválido (ex.: 2.300,00)'),
})

export type PropertyForm = z.infer<typeof propertySchema>
export type PropertyPayload = ReturnType<typeof toPayload>

export const emptyProperty: PropertyForm = {
  ownerId: '', code: '', title: '', description: '', type: 'APARTAMENTO', zip: '', street: '', number: '',
  complement: '', district: '', city: '', state: '', areaM2: '', bedrooms: '0', bathrooms: '0', parking: '0',
  suggestedRent: '',
}

const decimalText = (n: number | null) => (n === null ? '' : String(n).replace('.', ','))

export function fromProperty(p: Property): PropertyForm {
  return {
    ownerId: p.owner.id, code: p.code, title: p.title, description: p.description ?? '', type: p.type,
    zip: p.zip, street: p.street, number: p.number, complement: p.complement ?? '', district: p.district,
    city: p.city, state: p.state, areaM2: decimalText(p.areaM2), bedrooms: String(p.bedrooms),
    bathrooms: String(p.bathrooms), parking: String(p.parking), suggestedRent: decimalText(p.suggestedRent),
  }
}

/** Valores decimais vão como texto: o backend converte para BigDecimal sem passar por float. */
export function toPayload(f: PropertyForm, version?: number) {
  return {
    ownerId: f.ownerId,
    code: f.code.trim(),
    title: f.title.trim(),
    description: f.description.trim() || null,
    type: f.type,
    zip: f.zip.replace(/\D/g, ''),
    street: f.street.trim(),
    number: f.number.trim(),
    complement: f.complement.trim() || null,
    district: f.district.trim(),
    city: f.city.trim(),
    state: f.state.toUpperCase(),
    areaM2: f.areaM2 ? parseDecimalInput(f.areaM2) : null,
    bedrooms: Number(f.bedrooms),
    bathrooms: Number(f.bathrooms),
    parking: Number(f.parking),
    suggestedRent: parseDecimalInput(f.suggestedRent),
    version,
  }
}
