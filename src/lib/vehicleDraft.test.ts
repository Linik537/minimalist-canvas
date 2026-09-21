import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearVehicleDraft, readVehicleDraft, writeVehicleDraft } from './vehicleDraft'

afterEach(() => vi.unstubAllGlobals())

describe('rascunho de veículo', () => {
  it('restaura os campos após remontar o formulário e isola cada admin', () => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => { items.set(key, value) },
      removeItem: (key: string) => { items.delete(key) },
    })
    const key = 'braza:vehicle-draft:admin-a:new'
    writeVehicleDraft(key, { brand: 'Honda', model: 'CG 160', price: 18000 }, 'vehicle-id')

    expect(readVehicleDraft<{ brand: string; model: string; price: number }>(key)).toEqual({
      values: { brand: 'Honda', model: 'CG 160', price: 18000 }, createdId: 'vehicle-id',
    })
    expect(readVehicleDraft('braza:vehicle-draft:admin-b:new')).toBeNull()

    clearVehicleDraft(key)
    expect(readVehicleDraft(key)).toBeNull()
  })
})
