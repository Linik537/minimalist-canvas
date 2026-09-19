import { useQuery } from '@tanstack/react-query'
import { fetchVehicles } from '../lib/vehicles'
export const useVehicles = (includeSold = false) => useQuery({ queryKey: ['vehicles', includeSold], queryFn: () => fetchVehicles(includeSold) })
