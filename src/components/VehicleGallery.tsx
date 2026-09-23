import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useAutoRotate } from '../hooks/useAutoRotate'

export function VehicleGallery({ images, title }: { images: string[]; title: string }) {
  const { active, select, setPaused } = useAutoRotate(images.length)
  const [lightbox, setLightbox] = useState(false)
  const [displayed, setDisplayed] = useState(active)
  const [incoming, setIncoming] = useState<number | null>(null)
  const [revealIncoming, setRevealIncoming] = useState(false)
  const strip = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLButtonElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const touch = useRef(0)

  useEffect(() => {
    if (active === displayed) return
    setIncoming(active)
    setRevealIncoming(false)
    let revealFrame = 0
    const prepareFrame = requestAnimationFrame(() => {
      revealFrame = requestAnimationFrame(() => setRevealIncoming(true))
    })
    const finish = window.setTimeout(() => {
      setDisplayed(active)
      setIncoming(null)
      setRevealIncoming(false)
    }, 650)
    return () => {
      cancelAnimationFrame(prepareFrame)
      cancelAnimationFrame(revealFrame)
      clearTimeout(finish)
    }
  }, [active, displayed])

  useEffect(() => {
    const row = strip.current
    const item = thumb.current
    if (!row || !item) return
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    const left = item.offsetLeft
    const right = left + item.offsetWidth
    if (left < row.scrollLeft) row.scrollTo({ left, behavior })
    else if (right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: right - row.clientWidth, behavior })
  }, [active])

  useEffect(() => {
    if (!lightbox) return
    const prior = document.activeElement as HTMLElement | null
    close.current?.focus()
    return () => prior?.focus()
  }, [lightbox])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false)
      if (event.key === 'ArrowRight') select(active + 1)
      if (event.key === 'ArrowLeft') select(active - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, active, select])

  const swipeStart = (event: TouchEvent) => { touch.current = event.touches[0].clientX }
  const swipeEnd = (event: TouchEvent) => {
    const delta = event.changedTouches[0].clientX - touch.current
    if (Math.abs(delta) > 50) select(active + (delta < 0 ? 1 : -1))
  }

  const lightboxArrows = images.length > 1 && <>
    <button type="button" className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-card text-foreground shadow-lg" aria-label="Foto anterior" onClick={() => select(active - 1)}><ChevronLeft /></button>
    <button type="button" className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-card text-foreground shadow-lg" aria-label="Próxima foto" onClick={() => select(active + 1)}><ChevronRight /></button>
  </>

  return <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}>
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted" onTouchStart={swipeStart} onTouchEnd={swipeEnd}>
      <button type="button" className="absolute inset-0 block h-full w-full" aria-label="Abrir galeria em tela cheia" onClick={() => setLightbox(true)}>
        <img src={images[displayed]} alt={`${title} - foto ${displayed + 1}`} width="1000" height="750" className="absolute inset-0 h-full w-full object-cover" />
        {incoming !== null && <img src={images[incoming]} alt="" width="1000" height="750" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[600ms] ease-in-out motion-reduce:transition-none ${revealIncoming ? 'opacity-100' : 'opacity-0'}`} />}
      </button>
    </div>

    {images.length > 1 && <div className="mt-3 flex h-[82px] gap-2">
      <button type="button" className="grid w-9 shrink-0 place-items-center rounded-lg border border-border bg-card transition hover:border-primary hover:text-primary" aria-label="Foto anterior" onClick={() => select(active - 1)}><ChevronLeft size={20} /></button>
      <div ref={strip} className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((url, index) => <button ref={index === active ? thumb : undefined} type="button" key={`${url}-${index}`} onClick={() => select(index)} aria-label={`Selecionar foto ${index + 1}`} aria-current={index === active} className={`h-full min-w-[88px] flex-1 overflow-hidden rounded-lg border-2 transition ${index === active ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100'}`}>
          <img src={url} alt={`Miniatura ${index + 1}`} width="112" height="82" className="h-full w-full object-cover" />
        </button>)}
      </div>
      <button type="button" className="grid w-9 shrink-0 place-items-center rounded-lg border border-border bg-card transition hover:border-primary hover:text-primary" aria-label="Próxima foto" onClick={() => select(active + 1)}><ChevronRight size={20} /></button>
    </div>}

    {lightbox && <div role="dialog" aria-modal="true" aria-label="Galeria de fotos" className="fixed inset-0 z-[80] grid place-items-center bg-inverse/95 p-4" onClick={() => setLightbox(false)} onTouchStart={swipeStart} onTouchEnd={swipeEnd}>
      <button ref={close} aria-label="Fechar galeria" className="absolute right-5 top-5 z-20 text-inverse-foreground" onClick={() => setLightbox(false)}><X size={30} /></button>
      <div className="relative w-full max-w-6xl" onClick={event => event.stopPropagation()}>
        <img src={images[active]} alt={`${title} - foto ${active + 1}`} width="1400" height="900" className="max-h-[85vh] w-full object-contain" />
        {lightboxArrows}
        <p className="mt-3 text-center text-inverse-foreground">{active + 1} / {images.length}</p>
      </div>
    </div>}
  </div>
}
