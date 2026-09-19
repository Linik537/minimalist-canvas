import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
// Public browser credentials for the Braza project. Vercel builds do not receive
// the local .env file, so keep these as a fallback when VITE_ values are absent.
const url = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://elvolxdmgpjxekfdtlfo.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || 'sb_publishable_gGDnE8n_nDiDjvXgrYs_Sg_CD_uvvIx'
export const supabase = createClient<Database>(url, key)
