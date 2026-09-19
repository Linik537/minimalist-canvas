import { useEffect } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

export type ToastMessage = { text: string; kind: 'success' | 'error' }

export function AdminToast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onClose, 5500)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  const Icon = toast.kind === 'success' ? CheckCircle2 : CircleAlert
  return <div role={toast.kind === 'error' ? 'alert' : 'status'} className="fixed bottom-6 left-1/2 z-[70] flex w-[min(92vw,440px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-2xl">
    <Icon size={20} className={toast.kind === 'success' ? 'text-positive' : 'text-accent'} />
    <span className="flex-1">{toast.text}</span>
    <button type="button" onClick={onClose} aria-label="Fechar aviso" className="rounded-full p-1 hover:bg-muted"><X size={18} /></button>
  </div>
}
