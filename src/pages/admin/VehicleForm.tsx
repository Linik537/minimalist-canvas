import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import imageCompression from 'browser-image-compression'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, GripVertical, Trash2, Upload } from 'lucide-react'
import { AdminToast, type ToastMessage } from '../../components/AdminToast'
import { useVehicles } from '../../hooks/useVehicles'
import { supabase } from '../../lib/supabase'
import { digits, money, vehicleSlug } from '../../lib/format'
import { clearDraftPhotos, clearVehicleDraft, loadDraftPhotos, readVehicleDraft, saveDraftPhotos, writeVehicleDraft, type DraftPhoto } from '../../lib/vehicleDraft'
import type { Database } from '../../types/database'
type Photo=Database['public']['Tables']['vehicle_photos']['Row']
type PendingUpload=DraftPhoto
const schema=z.object({
  type:z.enum(['carro','moto']),brand:z.string().trim().min(1).max(80),model:z.string().trim().min(1).max(80),version:z.string().max(100),
  manufacture_year:z.number().int().min(1950).max(2100),model_year:z.number().int().min(1950).max(2101),
  price:z.number().positive(),mileage:z.number().int().min(0),color:z.string().max(50),engine:z.string().max(100),
  drivetrain:z.enum(['Dianteira','Traseira','4x4','Integral','Não se aplica']),fuel:z.enum(['Flex','Gasolina','Etanol','Diesel','Elétrico','Híbrido']),
  transmission:z.enum(['Manual','Automático','Automatizado','CVT']),description:z.string().max(10000),featuresText:z.string(),
  status:z.enum(['disponivel','vendido']),featured:z.boolean()
})
type Values=z.infer<typeof schema>
const defaults:Values={type:'carro',brand:'',model:'',version:'',manufacture_year:new Date().getFullYear(),model_year:new Date().getFullYear(),price:0,mileage:0,color:'',engine:'',drivetrain:'Dianteira',fuel:'Flex',transmission:'Manual',description:'',featuresText:'',status:'disponivel',featured:false}
function SortablePhoto({photo,index,onDelete}:{photo:Photo;index:number;onDelete:(p:Photo)=>void}){const {attributes,listeners,setNodeRef,transform,transition}=useSortable({id:photo.id});return <div ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition}} className="relative overflow-hidden rounded-xl border border-border bg-card"><img src={photo.url} alt={`Foto ${index+1}`} width="180" height="130" className="aspect-[4/3] w-full object-cover"/><div className="flex items-center justify-between p-2"><button type="button" className="cursor-grab" aria-label="Arrastar foto" {...attributes} {...listeners}><GripVertical size={18}/></button><small>{index===0?'Capa':`Foto ${index+1}`}</small><button type="button" aria-label="Remover foto" onClick={()=>onDelete(photo)} className="text-accent"><Trash2 size={17}/></button></div></div>}
function PendingPhoto({upload,onDelete}:{upload:PendingUpload;onDelete:()=>void}){const {file}=upload;const [preview,setPreview]=useState('');const {attributes,listeners,setNodeRef,transform,transition}=useSortable({id:upload.id});useEffect(()=>{const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file]);return <div ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition}} className="overflow-hidden rounded-xl border border-border bg-muted"><div className="aspect-[4/3]">{preview&&<img src={preview} alt={`Prévia de ${file.name}`} width="180" height="130" className="h-full w-full object-cover"/>}</div><div className="flex items-center gap-1 p-2 text-xs"><button type="button" className="cursor-grab" aria-label={`Arrastar ${file.name}`} {...attributes} {...listeners}><GripVertical size={17}/></button><span className="min-w-0 flex-1 truncate" title={file.name}>{file.name}</span><button type="button" className="shrink-0 text-accent" onClick={onDelete} aria-label={`Remover ${file.name}`}><Trash2 size={17}/></button></div></div>}
export default function VehicleForm({userId}:{userId:string}){
  const {id}=useParams();const navigate=useNavigate();const qc=useQueryClient();const {data=[]}=useVehicles(true)
  const draftKey=`braza:vehicle-draft:${userId}:${id??'new'}`
  const initialDraft=useMemo(()=>readVehicleDraft<Values>(draftKey),[draftKey])
  const createdId=useRef<string|null>(initialDraft?.createdId??null)
  const vehicle=data.find(v=>v.id===(id??createdId.current))
  const recoveringCreatedVehicle=Boolean(!id&&initialDraft?.createdId)
  const hydratedId=useRef<string|null>(null)
  const finished=useRef(false)
  const photoSave=useRef<Promise<void>>(Promise.resolve())
  const [photos,setPhotos]=useState<Photo[]>([])
  const [pending,setPending]=useState<PendingUpload[]>([])
  const [pendingReady,setPendingReady]=useState(false)
  const [formReady,setFormReady]=useState(!id&&!recoveringCreatedVehicle)
  const [progress,setProgress]=useState(0)
  const [busy,setBusy]=useState(false)
  const [toast,setToast]=useState<ToastMessage|null>(null)
  const [photoError,setPhotoError]=useState('')
  const {register,control,handleSubmit,reset,watch,getValues,formState:{errors,isDirty}}=useForm<Values>({resolver:zodResolver(schema),defaultValues:id?defaults:{...defaults,...initialDraft?.values}})
  const brands=useMemo(()=>[...new Set(data.map(v=>v.brand))].sort(),[data])
  useEffect(()=>{if(vehicle&&hydratedId.current!==vehicle.id){hydratedId.current=vehicle.id;const saved=readVehicleDraft<Values>(draftKey)?.values;reset({...vehicle,type:vehicle.type as Values['type'],drivetrain:vehicle.drivetrain as Values['drivetrain'],fuel:vehicle.fuel as Values['fuel'],transmission:vehicle.transmission as Values['transmission'],status:vehicle.status as Values['status'],featuresText:vehicle.features.join(', '),...saved});setPhotos(vehicle.vehicle_photos);setFormReady(true)}},[vehicle,reset,draftKey])
  useEffect(()=>{if(!formReady)return;const subscription=watch(values=>{if(!finished.current)writeVehicleDraft(draftKey,values as Values,createdId.current??undefined)});return()=>subscription.unsubscribe()},[draftKey,formReady,watch])
  useEffect(()=>{let active=true;loadDraftPhotos(draftKey).then(saved=>{if(active)setPending(saved)}).catch(()=>{if(active)setPhotoError('Não foi possível restaurar as fotos do rascunho.')}).finally(()=>{if(active)setPendingReady(true)});return()=>{active=false}},[draftKey])
  useEffect(()=>{if(!pendingReady||finished.current)return;const snapshot=[...pending];photoSave.current=photoSave.current.then(()=>saveDraftPhotos(draftKey,snapshot)).catch(()=>setPhotoError('O navegador não conseguiu guardar as fotos do rascunho.'))},[draftKey,pending,pendingReady])
  useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(isDirty||pending.length){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[isDirty,pending.length])
  const blocker=useBlocker(isDirty||pending.length>0)
  const addFiles=(list:FileList|null)=>{if(busy||!pendingReady||!list)return;const next=[...pending,...Array.from(list).map(file=>({id:crypto.randomUUID(),file}))];if(next.length+photos.length>20){setPhotoError('Máximo de 20 fotos por veículo.');return}if(next.some(({file})=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)){setPhotoError('Use JPEG, PNG ou WebP até 10 MB.');return}setPhotoError('');setPending(next)}
  const reorderPending=(e:DragEndEvent)=>{if(busy||!e.over||e.active.id===e.over.id)return;setPending(current=>{const from=current.findIndex(p=>p.id===e.active.id),to=current.findIndex(p=>p.id===e.over?.id);return from<0||to<0?current:arrayMove(current,from,to)})}
  const deletePhoto=async(photo:Photo)=>{if(busy||!confirm('Remover esta foto do banco e do Storage?'))return;setBusy(true);try{const {error:storageError}=await supabase.storage.from('vehicle-photos').remove([photo.storage_path]);if(storageError)throw storageError;const {error}=await supabase.from('vehicle_photos').delete().eq('id',photo.id);if(error)throw error;setPhotos(p=>p.filter(x=>x.id!==photo.id));await qc.invalidateQueries({queryKey:['vehicles']});setToast({text:'Foto removida.',kind:'success'})}catch(e){setToast({text:e instanceof Error?e.message:'Não foi possível remover a foto.',kind:'error'})}finally{setBusy(false)}}
  const reorder=async(e:DragEndEvent)=>{if(busy||!e.over||e.active.id===e.over.id)return;const overId=e.over.id;const old=photos.findIndex(p=>p.id===e.active.id),next=photos.findIndex(p=>p.id===overId);if(old<0||next<0)return;const reordered=arrayMove(photos,old,next);setPhotos(reordered);setBusy(true);try{for(const [position,p] of reordered.entries()){const {error}=await supabase.from('vehicle_photos').update({position}).eq('id',p.id);if(error)throw error}await qc.invalidateQueries({queryKey:['vehicles']});setToast({text:'Ordem das fotos salva. A primeira é a capa.',kind:'success'})}catch(e){await qc.invalidateQueries({queryKey:['vehicles']});setToast({text:e instanceof Error?e.message:'Não foi possível reordenar as fotos.',kind:'error'})}finally{setBusy(false)}}
  const save=async(v:Values)=>{if(busy)return;setBusy(true);setToast(null);setProgress(0);try{
    const {featuresText,...fields}=v
    const payload={...fields,features:featuresText.split(',').map(s=>s.trim()).filter(Boolean)}
    let vehicleId=id??createdId.current
    if(vehicleId){const {error}=await supabase.from('vehicles').update(payload).eq('id',vehicleId);if(error)throw error}
    else{const {data:created,error}=await supabase.from('vehicles').insert({...payload,slug:vehicleSlug(v.brand,v.model,v.model_year)}).select('id').single();if(error)throw error;vehicleId=created.id;createdId.current=created.id;writeVehicleDraft(draftKey,getValues(),created.id)}
    if(!vehicleId)throw new Error('ID do veículo indisponível')
    let position=Math.max(-1,...photos.map(photo=>photo.position))+1
    const queue=[...pending]
    for(const [index,upload] of queue.entries()){const compressed=await imageCompression(upload.file,{maxSizeMB:2,maxWidthOrHeight:1920,initialQuality:0.8,useWebWorker:true,fileType:'image/webp'});const path=`${vehicleId}/${crypto.randomUUID()}.webp`;const {error:uploadError}=await supabase.storage.from('vehicle-photos').upload(path,compressed,{contentType:'image/webp'});if(uploadError)throw uploadError;const url=supabase.storage.from('vehicle-photos').getPublicUrl(path).data.publicUrl;const {data:photoRow,error:photoRowError}=await supabase.from('vehicle_photos').insert({vehicle_id:vehicleId,url,storage_path:path,position:position++}).select().single();if(photoRowError){await supabase.storage.from('vehicle-photos').remove([path]);throw photoRowError}setPhotos(current=>[...current,photoRow]);setPending(current=>current.filter(item=>item.id!==upload.id));setProgress(Math.round((index+1)/queue.length*100))}
    finished.current=true;await photoSave.current;clearVehicleDraft(draftKey);await clearDraftPhotos(draftKey).catch(()=>{});reset(v);await qc.invalidateQueries({queryKey:['vehicles']});setBusy(false);navigate('/admin',{state:{notice:'Veículo salvo com sucesso.'}})
  }catch(e){setToast({text:e instanceof Error?e.message:'Não foi possível salvar.',kind:'error'})}finally{setBusy(false)}}
  return <div><Link to="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft size={16}/>Voltar ao painel</Link><h1 className="mb-8 text-4xl">{id?'Editar veículo':'Adicionar veículo'}</h1>{(id||recoveringCreatedVehicle)&&!vehicle?<p>Carregando veículo...</p>:<form onSubmit={handleSubmit(save)} className="max-w-5xl rounded-3xl bg-card p-6 md:p-10"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {select('type','Tipo',['carro','moto'])}{input('brand','Marca',<input className="field" list="brands" {...register('brand')}/>)}
    <datalist id="brands">{brands.map(x=><option key={x} value={x}/>)}</datalist>
    {input('model','Modelo',<input className="field" {...register('model')}/>)}
    {input('version','Versão',<input className="field" {...register('version')}/>)}
    {input('manufacture_year','Ano de fabricação',<input className="field" type="number" {...register('manufacture_year',{valueAsNumber:true})}/>)}
    {input('model_year','Ano do modelo',<input className="field" type="number" {...register('model_year',{valueAsNumber:true})}/>)}
    {input('price','Preço (R$)',<Controller name="price" control={control} render={({field})=><input className="field" type="text" inputMode="numeric" placeholder="R$ 45.900" value={field.value?money(field.value):''} onChange={e=>field.onChange(Number(digits(e.target.value)))} onBlur={field.onBlur} ref={field.ref}/>}/>)}
    {input('mileage','Quilometragem',<input className="field" type="number" {...register('mileage',{valueAsNumber:true})}/>)}
    {input('color','Cor',<input className="field" {...register('color')}/>)}
    {input('engine','Motor',<input className="field" placeholder="1.0 Flex ou 160cc" {...register('engine')}/>)}
    {select('drivetrain','Tração',['Dianteira','Traseira','4x4','Integral','Não se aplica'])}
    {select('fuel','Combustível',['Flex','Gasolina','Etanol','Diesel','Elétrico','Híbrido'])}
    {select('transmission','Câmbio',['Manual','Automático','Automatizado','CVT'])}
    {select('status','Status',['disponivel','vendido'])}
    <label className="flex items-center gap-3 pt-7"><input type="checkbox" {...register('featured')}/>Destaque na home</label>
    <div className="sm:col-span-2 lg:col-span-3">{input('description','Descrição',<textarea className="field min-h-32" {...register('description')}/>)}</div>
    <div className="sm:col-span-2 lg:col-span-3">{input('featuresText','Opcionais (separados por vírgula)',<input className="field" {...register('featuresText')}/>)}</div>
  </div>{Object.keys(errors).length>0&&<p role="alert" className="mt-4 text-sm text-accent">Revise os campos obrigatórios e os valores informados.</p>}
  <section className="mt-9"><h2 className="mb-4 text-2xl">Fotos</h2><p className="mb-4 text-sm text-foreground/60">Arraste para reordenar. A primeira foto é a capa.</p><DndContext collisionDetection={closestCenter} onDragEnd={reorder}><SortableContext items={photos.map(p=>p.id)} strategy={rectSortingStrategy}><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{photos.map((p,i)=><SortablePhoto key={p.id} photo={p} index={i} onDelete={deletePhoto}/>)}</div></SortableContext></DndContext><label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-border p-8 hover:border-primary" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}}><Upload className="text-primary"/><span className="mt-2">Arraste ou selecione fotos</span><small>JPEG, PNG ou WebP · até 10 MB · máximo 20 fotos</small><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy||!pendingReady} onChange={e=>{addFiles(e.target.files);e.target.value=''}}/></label>{photoError&&<p className="mt-2 text-sm text-accent">{photoError}</p>}<DndContext collisionDetection={closestCenter} onDragEnd={reorderPending}><SortableContext items={pending.map(p=>p.id)} strategy={rectSortingStrategy}><div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">{pending.map(p=><PendingPhoto key={p.id} upload={p} onDelete={()=>{if(!busy)setPending(files=>files.filter(item=>item.id!==p.id))}}/>)}</div></SortableContext></DndContext>{busy&&pending.length>0&&<div className="mt-4"><p className="mb-1 text-sm">Enviando fotos · {progress}%</p><div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{width:`${progress}%`}}/></div></div>}</section><button disabled={busy||!pendingReady||!formReady} className="btn-primary mt-8 disabled:opacity-50">{busy?'Salvando...':'Salvar veículo'}</button></form>}{blocker.state==='blocked'&&<div className="fixed inset-0 z-50 grid place-items-center bg-inverse/60 p-4"><div className="max-w-md rounded-3xl bg-card p-8"><h2 className="text-2xl">Alterações não salvas</h2><p className="my-4">Deseja sair sem salvar?</p><div className="flex gap-3"><button className="btn-outline" onClick={()=>blocker.reset()}>Continuar editando</button><button className="btn-primary" onClick={()=>blocker.proceed()}>Sair</button></div></div></div>}<AdminToast toast={toast} onClose={()=>setToast(null)}/></div>
  function input(_key:string,label:string,control:React.ReactNode){return <label className="block"><span className="label">{label}</span>{control}</label>}
  function select(key:keyof Values,label:string,options:string[]){return <label className="block"><span className="label">{label}</span><select className="field" {...register(key)}>{options.map(x=><option key={x} value={x}>{x==='disponivel'?'Disponível':x==='vendido'?'Vendido':x==='carro'?'Carro':x==='moto'?'Moto':x}</option>)}</select></label>}
}
