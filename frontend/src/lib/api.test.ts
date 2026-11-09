import { describe, expect, it } from 'vitest'
import { assertSafePath } from './api'

describe('assertSafePath', () => {
  it.each([
    '/properties/9b1c6f4e-2a7d-4b8e-9f0a-1c2d3e4f5a6b',
    '/properties/9b1c6f4e-2a7d-4b8e-9f0a-1c2d3e4f5a6b/photos/abc/cover',
    '/properties?q=a/b&city=..',
  ])('aceita %s', (path) => {
    expect(() => assertSafePath(path)).not.toThrow()
  })

  it.each([
    '/properties/../users/x/deactivate',
    '/properties/%2e%2e/users',
    '/properties/..%2Fusers%2Fx%2Fdeactivate',
    '/owners/a%5Cb',
    '/owners/./x',
    '/owners/%E0%A4%A',
  ])('recusa %s', (path) => {
    expect(() => assertSafePath(path)).toThrow('O endereço solicitado é inválido.')
  })
})
