import { supabase } from './supabase'
import type { Database } from '../types/database'
import { demoVehicles } from '../data/demoVehicles'
export type Vehicle = Database['public']['Tables']['vehicles']['Row'] & { vehicle_photos: Database['public']['Tables']['vehicle_photos']['Row'][] }
export async function fetchVehicles(includeSold = false): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*,vehicle_photos(*)').order('created_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []).map(v => ({ ...v, vehicle_photos: [...v.vehicle_photos].sort((a,b) => a.position - b.position) }))
  const source = rows.length === 0 && !includeSold && import.meta.env.VITE_SHOW_DEMO === 'true' ? demoVehicles : rows
  return includeSold ? source : source.filter(v => v.status === 'disponivel')
}
export const cover = (vehicle: Vehicle) => vehicle.vehicle_photos[0]?.url || `/images/${vehicle.type === 'moto' ? 'categoria-motos' : 'categoria-carros'}.svg`
