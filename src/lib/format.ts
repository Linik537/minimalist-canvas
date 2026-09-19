export const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
export const km = (value: number) => `${new Intl.NumberFormat('pt-BR').format(value)} km`
export const digits = (value: string) => value.replace(/\D/g, '')
export const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const vehicleSlug = (brand: string, model: string, year: number) => `${slugify(`${brand}-${model}-${year}`)}-${crypto.randomUUID().slice(0, 6)}`
export const whatsappFor = (message: string) => `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`
import { site } from '../config/site'
export const isOpenNow = (at = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: site.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(at)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday'))
  const now = Number(get('hour')) * 60 + Number(get('minute'))
  const toMinutes=(time:string)=>{const [hours,minutes]=time.split(':').map(Number);return hours*60+minutes}
  return site.opening.days.some(d => d === day) && now >= toMinutes(site.opening.opens) && now < toMinutes(site.opening.closes)
}
export const installment = (amount: number, down: number, n: number) => {
  const principal = Math.max(0, amount - down), r = site.monthlyInterestRate
  return principal * r / (1 - Math.pow(1 + r, -n))
}
