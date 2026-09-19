import { describe, expect, it } from 'vitest'
import { isOpenNow, km, money, slugify, vehicleSlug, whatsappFor } from './format'
describe('formatação', () => {
  it('gera slug estável e sufixo único', () => { expect(slugify('Honda CG 160 Titán')).toBe('honda-cg-160-titan'); expect(vehicleSlug('Honda', 'CG 160', 2022)).toMatch(/^honda-cg-160-2022-[a-f0-9]{6}$/) })
  it('formata moeda e km', () => { expect(money(45900)).toContain('45.900'); expect(km(32000)).toBe('32.000 km') })
  it('monta link de WhatsApp codificado', () => expect(whatsappFor('Olá, quero a CG 160!')).toContain('text=Ol%C3%A1%2C%20quero%20a%20CG%20160!'))
  it('calcula horário em São Paulo', () => {
    expect(isOpenNow(new Date('2026-09-19T15:00:00Z'))).toBe(true)
    expect(isOpenNow(new Date('2026-09-20T15:00:00Z'))).toBe(false)
    expect(isOpenNow(new Date('2026-09-21T10:00:00Z'))).toBe(false)
  })
})
