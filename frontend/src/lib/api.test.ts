import { describe, expect, it } from 'vitest'
import { assertSafePath, path } from './api'

const invalid = 'O endereço solicitado é inválido.'

describe('path', () => {
  it('codifica os valores interpolados', () => {
    expect(path`/properties/${'abc'}/photos/${'def'}`).toBe('/properties/abc/photos/def')
    // o que viria de um link forjado vira um único segmento inofensivo
    expect(path`/properties/${'../users/x/deactivate'}`).toBe('/properties/..%2Fusers%2Fx%2Fdeactivate')
    expect(path`/properties/${'x#'}/photos/${'y'}`).toBe('/properties/x%23/photos/y')
    expect(path`/properties/${'x?a=1'}`).toBe('/properties/x%3Fa%3D1')
    expect(path`/properties/${'.\t.'}`).toBe('/properties/.%09.')
  })

  it.each(['.', '..', '', undefined])('recusa %s', (v) => {
    expect(() => path`/properties/${v}`).toThrow(invalid)
  })
})

describe('assertSafePath', () => {
  it.each([
    '/properties/9b1c6f4e-2a7d-4b8e-9f0a-1c2d3e4f5a6b/status',
    '/properties/..%2Fusers', // já codificado por path``: segmento único
    '/properties?q=a/b&city=..',
  ])('aceita %s', (p) => {
    expect(() => assertSafePath(p)).not.toThrow()
  })

  it.each([
    '/properties/../users/x/deactivate',
    '/properties/./x',
    '/properties/.\t./users',
    '/properties/x\n/y',
    '/properties/x#/photos/y',
    '/owners/a\\b',
    '/properties/%2e%2e/users',
  ])('recusa %s', (p) => {
    expect(() => assertSafePath(p)).toThrow(invalid)
  })
})
