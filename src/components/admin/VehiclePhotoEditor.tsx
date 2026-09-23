import { useEffect, useRef, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, ArrowRight, GripVertical, Upload } from 'lucide-react'
import { cropGeometry, croppedPhotoBlob, defaultPhotoCrop, drawCroppedPhoto, loadPhoto, type PhotoCrop } from '../../lib/photoCrop'

export type EditorPhoto = { id: string; source: File | string; preview?: Blob; label: string; isNew: boolean }
type Props = {
  photos: EditorPhoto[]; selectedId: string | null; crop: PhotoCrop; busy: boolean; progress: number; error: string
  onSelect: (id: string) => void; onCrop: (crop: PhotoCrop) => void; onMove: (id: string, delta: number) => void
  onCover: (id: string) => void; onRemove: (id: string) => void; onReorder: (active: string, over: string) => void
  onApply: (id: string, blob: Blob) => Promise<void>; onFiles: (files: FileList | null) => void
}

function PhotoTile({ photo, index, photoCount, active, busy, onSelect, onMove, onCover, onRemove }: {
  photo: EditorPhoto; index: number; photoCount: number; active: boolean; busy: boolean
  onSelect: () => void; onMove: (delta: number) => void; onCover: () => void; onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id, disabled: busy })
  const [url, setUrl] = useState('')
  useEffect(() => {
    const display = photo.preview ?? photo.source
    const objectUrl = display instanceof Blob ? URL.createObjectURL(display) : null
    setUrl(objectUrl ?? display as string)
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [photo.source, photo.preview])
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`relative overflow-hidden rounded-xl border-2 bg-card ${active ? 'border-primary' : 'border-border'}`}>
    <button type="button" disabled={busy} onClick={onSelect} className="block w-full text-left" aria-label={`Editar ${photo.label}`}>
      {url && <img src={url} alt={photo.label} width="224" height="168" className="aspect-[4/3] w-full object-cover" />}
      <span className="absolute left-1 top-1 rounded bg-inverse/80 px-2 py-0.5 text-xs text-white">{photo.isNew ? 'Nova ' : ''}{index + 1}</span>
    </button>
    <div className="flex items-center justify-between gap-1 p-1 text-xs">
      <button type="button" disabled={busy} className="cursor-grab rounded p-1" aria-label={`Arrastar ${photo.label}`} {...attributes} {...listeners}><GripVertical size={15}/></button>
      <button type="button" disabled={busy} onClick={onSelect} className="rounded px-1 hover:text-primary">Editar</button>
      <button type="button" disabled={busy || index === 0} onClick={onCover} className="rounded bg-primary px-1.5 py-1 text-white disabled:opacity-50">Capa</button>
      <button type="button" disabled={busy} onClick={onRemove} className="rounded bg-accent px-1.5 py-1 text-white">Excluir</button>
    </div>
    <div className="absolute right-1 top-1 flex gap-1">
      <button type="button" disabled={busy || index === 0} onClick={() => onMove(-1)} aria-label="Mover foto para a esquerda" className="rounded bg-inverse/80 p-1 text-white disabled:opacity-40"><ArrowLeft size={13}/></button>
      <button type="button" disabled={busy || index === photoCount - 1} onClick={() => onMove(1)} aria-label="Mover foto para a direita" className="rounded bg-inverse/80 p-1 text-white disabled:opacity-40"><ArrowRight size={13}/></button>
    </div>
  </div>
}

export function VehiclePhotoEditor({ photos, selectedId, crop, busy, progress, error, onSelect, onCrop, onMove, onCover, onRemove, onReorder, onApply, onFiles }: Props) {
  const selected = photos.find(photo => photo.id === selectedId) ?? photos[0]
  const mainRef = useRef<HTMLCanvasElement>(null)
  const thumbRef = useRef<HTMLCanvasElement>(null)
  const [loaded, setLoaded] = useState<HTMLImageElement | null>(null)
  const [editorError, setEditorError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [draftCrop, setDraftCrop] = useState(crop)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  useEffect(() => { setDraftCrop(crop) }, [selected?.id, crop])
  useEffect(() => {
    let active = true
    setLoaded(null)
    setEditorError('')
    if (!selected) return
    let dispose = () => {}
    loadPhoto(selected.source).then(result => {
      if (active) { setLoaded(result.image); dispose = result.dispose }
      else result.dispose()
    }).catch(e => { if (active) setEditorError(e instanceof Error ? e.message : 'Foto indisponível.') })
    return () => { active = false; dispose() }
  }, [selected?.id, selected?.source])
  useEffect(() => {
    if (!loaded || !mainRef.current || !thumbRef.current) return
    drawCroppedPhoto(mainRef.current, loaded, draftCrop, 800, 600)
    thumbRef.current.width = 350
    thumbRef.current.height = 250
    const context = thumbRef.current.getContext('2d')
    const frame = cropGeometry(800, 600, 350, 250, defaultPhotoCrop)
    context?.drawImage(mainRef.current, frame.x, frame.y, frame.width, frame.height)
  }, [loaded, draftCrop])
  const dragEnd = (event: DragEndEvent) => {
    if (event.over && event.active.id !== event.over.id) onReorder(String(event.active.id), String(event.over.id))
  }
  const apply = async () => {
    if (!selected || busy || processing) return
    setProcessing(true)
    setEditorError('')
    try { await onApply(selected.id, await croppedPhotoBlob(selected.source, draftCrop)) }
    catch (e) { setEditorError(e instanceof Error ? e.message : 'Não foi possível aplicar o ajuste.') }
    finally { setProcessing(false) }
  }
  const slider = (label: string, key: keyof PhotoCrop, min: number, max: number, step: number, left?: string, right?: string) => <label className="block text-sm">
    <span className="mb-1 block">{label}: {key === 'zoom' ? `${draftCrop.zoom.toFixed(1)}x` : draftCrop[key]}</span>
    <input type="range" min={min} max={max} step={step} value={draftCrop[key]} disabled={busy || processing || !selected} onInput={e => {
      const value = Number(e.currentTarget.value)
      const next = { ...draftCrop, [key]: value }
      if (loaded && value !== 0 && (key === 'horizontal' || key === 'vertical')) {
        const base = cropGeometry(loaded.naturalWidth, loaded.naturalHeight, 800, 600, { ...next, zoom: 1 })
        const lacksRoom = key === 'horizontal' ? Math.abs(base.width - 800) < 0.5 : Math.abs(base.height - 600) < 0.5
        if (lacksRoom && next.zoom < 1.1) next.zoom = 1.1
      }
      setDraftCrop(next); onCrop(next)
    }} className="w-full accent-primary" />
    {left && <span className="flex justify-between text-xs text-foreground/60"><span>{left}</span><span>{right}</span></span>}
  </label>
  return <section className="mt-9" aria-label="Editor de capa e fotos">
    <div className="rounded-2xl border border-border bg-muted/40 p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-xl">Editor de capa e fotos</h2><p className="text-sm text-foreground/65">O ajuste será aplicado às fotos escolhidas no formato 4:3 usado pelo site.</p></div><span className="text-sm text-foreground/65">{photos.length} foto(s) selecionada(s)</span></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div><p className="mb-1 text-sm font-semibold">Foto principal (4:3)</p><div className="overflow-hidden rounded-xl border border-border bg-inverse"><canvas ref={mainRef} role="img" aria-label={`Prévia de ${selected?.label ?? 'foto'}`} className="aspect-[4/3] w-full object-contain" /></div><p className="mb-1 mt-3 text-sm font-semibold">Miniatura inferior (7:5)</p><canvas ref={thumbRef} role="img" aria-label="Prévia da miniatura" className="aspect-[7/5] w-56 rounded-lg border border-border bg-inverse object-contain" /></div>
        <div className="space-y-4">{slider('Zoom', 'zoom', 1, 3, 0.05)}{slider('Horizontal', 'horizontal', -100, 100, 1, 'Esquerda', 'Direita')}{slider('Vertical', 'vertical', -100, 100, 1, 'Topo', 'Base')}
          <p className="rounded-xl border border-border bg-card p-3 text-xs text-foreground/65">As extremidades dos controles alcançam todo o espaço disponível da imagem original. A miniatura mostra o pequeno recorte adicional aplicado abaixo da foto principal.</p>
          {selected && <p className="w-fit max-w-full truncate rounded-full border border-primary px-3 py-1 text-xs text-primary" title={selected.label}>{selected.label}</p>}
          <button type="button" disabled={!selected || busy || processing} onClick={apply} className="btn-primary w-full disabled:opacity-50">{processing ? 'Otimizando...' : 'Aplicar nesta foto e otimizar'}</button>
          {(editorError || error) && <p role="alert" className="text-sm text-accent">{editorError || error}</p>}
        </div>
      </div>
    </div>
    <p className="mb-2 mt-4 text-sm text-foreground/70">Fotos atuais e novas · arraste ou use as setas para reordenar; a primeira é a capa.</p>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={photos.map(p => p.id)} strategy={rectSortingStrategy}><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{photos.map((photo, index) => <PhotoTile key={photo.id} photo={photo} index={index} photoCount={photos.length} active={selected?.id === photo.id} busy={busy || processing} onSelect={() => onSelect(photo.id)} onMove={delta => onMove(photo.id, delta)} onCover={() => onCover(photo.id)} onRemove={() => onRemove(photo.id)} />)}</div></SortableContext></DndContext>
    <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-border p-6 text-center hover:border-primary" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files) }}><Upload className="text-primary"/><span className="mt-2">Arraste ou selecione fotos</span><small>JPEG, PNG ou WebP · até 10 MB · máximo 20 fotos</small><input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || processing} onChange={e => { onFiles(e.target.files); e.target.value = '' }} /></label>
    {busy && <div className="mt-4"><p className="mb-1 text-sm">Salvando fotos · {progress}%</p><div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div></div>}
  </section>
}
