import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const minimumPasswordLength = 12

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError || !auth.user) {
        setMessage(authError?.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : 'Não foi possível entrar. Tente novamente.')
        return
      }
      const { data: role, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', auth.user.id).eq('role', 'admin').maybeSingle()
      if (roleError || !role) {
        await supabase.auth.signOut()
        setMessage(roleError ? 'Não foi possível verificar sua permissão.' : 'Este usuário não tem acesso administrativo.')
        return
      }
      navigate('/admin', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  const recover = async () => {
    if (busy) return
    if (!email.trim()) { setMessage('Informe seu e-mail para receber o link de recuperação.'); return }
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/redefinir-senha` })
      setMessage(error ? 'Não foi possível enviar o link. Tente novamente em alguns minutos.' : 'Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.')
    } finally {
      setBusy(false)
    }
  }

  return <AuthCard title="Acesso administrativo">
    <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block"><span className="label">E-mail</span><input className="field" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label className="block"><span className="label">Senha</span><input className="field" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      {message && <p role="status" className="text-sm">{message}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Aguarde...' : 'Entrar'}</button>
      <button type="button" className="w-full text-sm font-semibold text-primary underline-offset-4 hover:underline" disabled={busy} onClick={recover}>Esqueci minha senha</button>
    </form>
  </AuthCard>
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (password.length < minimumPasswordLength || password !== confirm) {
      setMessage(`Use pelo menos ${minimumPasswordLength} caracteres e confirme a mesma senha.`)
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setMessage('O link expirou ou não foi possível alterar a senha. Solicite outro link.'); setBusy(false); return }
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true, state: { passwordChanged: true } })
  }

  return <AuthCard title="Criar nova senha">
    {ready === null ? <p className="mt-5">Validando o link...</p> : ready ? <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block"><span className="label">Nova senha</span><input className="field" type="password" autoComplete="new-password" minLength={minimumPasswordLength} required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <label className="block"><span className="label">Confirmar senha</span><input className="field" type="password" autoComplete="new-password" minLength={minimumPasswordLength} required value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
      {message && <p role="alert" className="text-sm text-accent">{message}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Salvando...' : 'Salvar nova senha'}</button>
    </form> : <div className="mt-5 space-y-4"><p>Este link é inválido ou expirou.</p><Link className="btn-primary" to="/admin/login">Solicitar outro link</Link></div>}
  </AuthCard>
}

export function ChangePassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (password.length < minimumPasswordLength || password !== confirm) { setMessage(`Use pelo menos ${minimumPasswordLength} caracteres e confirme a mesma senha.`); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setMessage(error ? 'Não foi possível alterar a senha.' : 'Senha alterada com sucesso.')
    if (!error) { setPassword(''); setConfirm('') }
    setBusy(false)
  }
  return <div className="max-w-lg"><h1 className="mb-7 text-3xl">Alterar senha</h1><form className="space-y-5" onSubmit={submit}><label className="block"><span className="label">Nova senha</span><input type="password" className="field" autoComplete="new-password" minLength={minimumPasswordLength} required value={password} onChange={event => setPassword(event.target.value)} /></label><label className="block"><span className="label">Confirmar senha</span><input type="password" className="field" autoComplete="new-password" minLength={minimumPasswordLength} required value={confirm} onChange={event => setConfirm(event.target.value)} /></label>{message && <p role="status">{message}</p>}<button className="btn-primary" disabled={busy}>{busy ? 'Salvando...' : 'Salvar nova senha'}</button></form></div>
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-muted p-4"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-8"><img src="/images/logo-braza.png" alt="Braza Veículos" className="mb-7 h-20" /><h1 className="text-3xl">{title}</h1>{children}</div></div>
}
