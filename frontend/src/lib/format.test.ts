import { describe, expect, it } from 'vitest'
import { formatBRL, formatDate, formatDocument, formatMonth, formatPhone, parseDecimalInput } from './format'

describe('parseDecimalInput', () => {
  it.each([
    ['2.300,50', '2300.50'],
    ['2300,5', '2300.5'],
    ['2300.50', '2300.50'],
    ['R$ 1.800', '1800'],
    ['1800', '1800'],
    ['10.999', '10999'],
    ['1.234.567,89', '1234567.89'],
  ])('%s → %s', (input, expected) => {
    expect(parseDecimalInput(input)).toBe(expected)
  })

  it.each(['', 'abc', '1,234,5', '10.99.9', '-5'])('rejeita %s', (input) => {
    expect(parseDecimalInput(input)).toBeNull()
  })
})

describe('formatação', () => {
  it('formata reais', () => {
    expect(formatBRL('2300.5').replace(/\s/g, ' ')).toBe('R$ 2.300,50')
    expect(formatBRL(null)).toBe('—')
  })

  it('formata datas sem deslocar o dia pelo fuso', () => {
    expect(formatDate('2025-01-01')).toBe('01/01/2025')
    expect(formatDate(null)).toBe('—')
    expect(formatMonth('2025-12-01')).toBe('Dezembro/2025')
  })

  it('formata CPF e CNPJ', () => {
    expect(formatDocument('52998224725')).toBe('529.982.247-25')
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81')
  })
})

describe('formatPhone', () => {
  it('formata celular e fixo, mantém o resto', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('1133445566')).toBe('(11) 3344-5566')
    expect(formatPhone('123')).toBe('123')
  })
})
