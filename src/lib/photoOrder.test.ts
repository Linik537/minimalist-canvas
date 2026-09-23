import { describe, expect, it } from 'vitest'
import { movePhotoBy, movePhotoId, normalizePhotoOrder } from './photoOrder'

describe('ordem das fotos', () => {
  it('preserva a ordem escolhida e inclui fotos novas', () => {
    expect(normalizePhotoOrder(['b', 'a'], ['a', 'b', 'c'])).toEqual(['b', 'a', 'c'])
  })
  it('move por setas e por posição do arraste', () => {
    expect(movePhotoBy(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(movePhotoId(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a'])
  })
  it('ignora movimentos fora dos limites', () => {
    expect(movePhotoBy(['a', 'b'], 'a', -1)).toEqual(['a', 'b'])
    expect(movePhotoBy(['a', 'b'], 'b', 1)).toEqual(['a', 'b'])
  })
})
