import { z } from 'zod'
import { parseDecimalInput } from '@/lib/format'
import type { Contract } from './api'

const optionalMoney = z.string().refine((s) => s.trim() === '' || parseDecimalInput(s) !== null, 'Valor inválido (ex.: 2.300,00)')

export const contractSchema = z
  .object({
    propertyId: z.string().min(1, 'Escolha o imóvel'),
    tenantId: z.string().min(1, 'Escolha o inquilino'),
    startDate: z.string().min(1, 'Informe o início'),
    endDate: z.string().min(1, 'Informe o término'),
    monthlyRent: z.string().refine((s) => Number(parseDecimalInput(s)) > 0, 'Valor inválido (ex.: 2.300,00)'),
    dueDay: z.string().refine((s) => /^\d{1,2}$/.test(s) && Number(s) >= 1 && Number(s) <= 28, 'Dia de 1 a 28'),
    adjustmentIndex: z.enum(['NENHUM', 'IGPM', 'IPCA', 'PERCENTUAL_FIXO']),
    adjustmentPercent: optionalMoney,
    guaranteeType: z.enum(['NENHUMA', 'CAUCAO', 'FIADOR', 'SEGURO_FIANCA', 'TITULO_CAPITALIZACAO']),
    guaranteeValue: optionalMoney,
    guaranteeNotes: z.string().max(500),
    notes: z.string().max(2000),
  })
  // datas ISO (aaaa-mm-dd) comparam certo como texto
  .refine((f) => !f.startDate || !f.endDate || f.endDate > f.startDate, { path: ['endDate'], message: 'O término deve ser depois do início' })
  .refine((f) => f.adjustmentIndex !== 'PERCENTUAL_FIXO' || f.adjustmentPercent.trim() !== '', {
    path: ['adjustmentPercent'],
    message: 'Informe o percentual',
  })

export type ContractForm = z.infer<typeof contractSchema>
export type ContractPayload = ReturnType<typeof toPayload>

export const emptyContract: ContractForm = {
  propertyId: '', tenantId: '', startDate: '', endDate: '', monthlyRent: '', dueDay: '10', adjustmentIndex: 'IGPM',
  adjustmentPercent: '', guaranteeType: 'NENHUMA', guaranteeValue: '', guaranteeNotes: '', notes: '',
}

const decimalText = (n: number | null) => (n === null ? '' : String(n).replace('.', ','))

export function fromContract(c: Contract): ContractForm {
  return {
    propertyId: c.property.id, tenantId: c.tenant.id, startDate: c.startDate, endDate: c.endDate,
    monthlyRent: decimalText(c.monthlyRent), dueDay: String(c.dueDay), adjustmentIndex: c.adjustmentIndex,
    adjustmentPercent: decimalText(c.adjustmentPercent), guaranteeType: c.guaranteeType,
    guaranteeValue: decimalText(c.guaranteeValue), guaranteeNotes: c.guaranteeNotes ?? '', notes: c.notes ?? '',
  }
}

/** Valores decimais vão como texto: o backend converte para BigDecimal sem passar por float. */
export function toPayload(f: ContractForm, version?: number) {
  return {
    propertyId: f.propertyId,
    tenantId: f.tenantId,
    startDate: f.startDate,
    endDate: f.endDate,
    monthlyRent: parseDecimalInput(f.monthlyRent),
    dueDay: Number(f.dueDay),
    adjustmentIndex: f.adjustmentIndex,
    adjustmentPercent: f.adjustmentIndex === 'PERCENTUAL_FIXO' ? parseDecimalInput(f.adjustmentPercent) : null,
    guaranteeType: f.guaranteeType,
    guaranteeValue: f.guaranteeType === 'NENHUMA' ? null : parseDecimalInput(f.guaranteeValue),
    guaranteeNotes: f.guaranteeType === 'NENHUMA' ? null : f.guaranteeNotes.trim() || null,
    notes: f.notes.trim() || null,
    version,
  }
}

/** "5,5" ou "-2.25" → "5.5" / "-2.25"; null se não for um percentual com até 2 casas. */
export function parsePercentInput(input: string): string | null {
  const s = input.trim().replace('%', '').replace(',', '.')
  return /^-?\d{1,3}(\.\d{1,2})?$/.test(s) ? s : null
}
