import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CarFront, ClipboardList, KeyRound, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import AdminVehicles from './AdminVehicles'
import VehicleForm from './VehicleForm'
import Leads from './Leads'
import { ChangePassword, Login, ResetPassword } from './AdminAuth'

function Guard({ user, children }: { user: User | null; children: React.ReactNode }) {
  const userId = user?.id
  const [verifiedId, setVerifiedId] = useState<string | null>(null)
  const [deniedId, setDeniedId] = useState<string | null>(null)
  useEffect(() => {
    if (!userId) return
    let active = true
    supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle().then(async ({ data, error }) => {
      if (!active) return
      if (error || !data) { await supabase.auth.signOut(); if (active) setDeniedId(userId) }
      else setVerifiedId(userId)
    })
    return () => { active = false }
  }, [userId])
  if (!userId || deniedId === userId) return <Navigate to="/admin/login" replace />
  if (verifiedId !== userId) return <div className="skeleton min-h-screen" />
  return <>{children}</>
}

function Shell({ userId }: { userId: string }) {
  const navigate = useNavigate()
  return <div className="min-h-screen bg-muted">
    <header className="border-b border-border bg-card"><div className="container-wide flex flex-wrap items-center justify-between gap-4 py-3">
      <Link to="/admin"><img src="/images/logo-braza.png" alt="Braza Veículos" width="120" height="70" className="h-12 rounded-xl bg-white p-1" /></Link>
      <nav className="flex flex-wrap gap-3 text-sm font-bold"><NavLink to="/admin" end className="btn-outline"><CarFront size={17} />Veículos</NavLink><NavLink to="/admin/leads" className="btn-outline"><ClipboardList size={17} />Solicitações</NavLink><NavLink to="/admin/senha" className="btn-outline"><KeyRound size={17} />Senha</NavLink></nav>
      <button className="btn-outline" onClick={async () => { await supabase.auth.signOut(); navigate('/admin/login') }}><LogOut size={17} />Sair</button>
    </div></header>
    <main className="container-wide py-10"><Routes><Route index element={<AdminVehicles />} /><Route path="veiculos/novo" element={<VehicleForm userId={userId} />} /><Route path="veiculos/:id" element={<VehicleForm userId={userId} />} /><Route path="leads" element={<Leads />} /><Route path="senha" element={<ChangePassword />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes></main>
  </div>
}

export default function Admin() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null))
    return () => subscription.unsubscribe()
  }, [])
  return <><Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>{user === undefined ? <div className="skeleton min-h-screen" /> : <Routes>
    <Route path="login" element={user ? <Navigate to="/admin" replace /> : <Login />} />
    <Route path="redefinir-senha" element={<ResetPassword />} />
    <Route path="*" element={<Guard user={user}><Shell userId={user?.id ?? ''} /></Guard>} />
  </Routes>}</>
}
