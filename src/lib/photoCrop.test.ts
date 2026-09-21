import { describe, expect, it } from 'vitest'
import { cropGeometry, defaultPhotoCrop } from './photoCrop'

describe('recorte das fotos', () => {
  it('centraliza e cobre um quadro 4:3 sem bordas vazias', () => {
    const frame = cropGeometry(1600, 900, 800, 600, defaultPhotoCrop)
    expect(frame).toEqual({ x: -(1600 * (2 / 3) - 800) / 2, y: 0, width: 1600 * (2 / 3), height: 600 })
  })
  it('alcança ambas as extremidades e amplia com zoom', () => {
    const left = cropGeometry(1600, 900, 800, 600, { zoom: 1, horizontal: -100, vertical: 0 })
    const right = cropGeometry(1600, 900, 800, 600, { zoom: 1, horizontal: 100, vertical: 0 })
    const zoomed = cropGeometry(1600, 900, 800, 600, { zoom: 2, horizontal: 0, vertical: 0 })
    expect(left.x).toBe(0)
    expect(right.x + right.width).toBeCloseTo(800)
    expect(zoomed.width).toBeGreaterThan(right.width)
  })
})
