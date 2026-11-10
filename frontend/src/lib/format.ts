const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Só formata: valores em dinheiro chegam prontos do backend (nada de cálculo aqui). */
export function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return brl.format(Number(value))
}

/** "2.300,50" ou "2300.50" → "2300.50" (texto decimal enviado ao backend, sem passar por float). */
export function parseDecimalInput(input: string): string | null {
  const clean = input.trim().replace(/[R$\s]/g, '')
  if (!clean) return null
  // com vírgula: ponto é milhar. Sem vírgula: "1.800" (grupos de 3) também é milhar; "1800.5" é decimal
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(\.\d{3})+$/.test(clean) ? clean.replace(/\./g, '') : clean
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? normalized : null
}

export function formatDocument(doc: string): string {
  const d = doc.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

export const propertyTypeLabel: Record<string, string> = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  COMERCIAL: 'Comercial',
  TERRENO: 'Terreno',
  OUTRO: 'Outro',
}

export const propertyStatusLabel: Record<string, string> = {
  DISPONIVEL: 'Disponível',
  OCUPADO: 'Alugado',
  MANUTENCAO: 'Manutenção',
  INATIVO: 'Inativo',
}

/** "Mariana Albuquerque Costa" → "MA" */
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/** "11987654321" → "(11) 98765-4321"; "1133445566" → "(11) 3344-5566" */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return phone
}
