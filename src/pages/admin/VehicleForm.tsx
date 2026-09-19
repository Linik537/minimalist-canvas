import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import imageCompression from 'browser-image-compression'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, GripVertical, Trash2, Upload } from 'lucide-react'
import { useVehicles } from '../../hooks/useVehicles'
import { supabase } from '../../lib/supabase'
import { vehicleSlug } from '../../lib/format'
import type { Database } from '../../types/database'
type Photo=Database['public']['Tables']['vehicle_photos']['Row']
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
export default function VehicleForm(){
  const {id}=useParams();const navigate=useNavigate();const qc=useQueryClient();const {data=[]}=useVehicles(true)
  const vehicle=data.find(v=>v.id===id)
  const [photos,setPhotos]=useState<Photo[]>([])
  const [pending,setPending]=useState<File[]>([])
  const [progress,setProgress]=useState(0)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [photoError,setPhotoError]=useState('')
  const {register,handleSubmit,reset,formState:{errors,isDirty}}=useForm<Values>({resolver:zodResolver(schema),defaultValues:defaults})
  const brands=useMemo(()=>[...new Set(data.map(v=>v.brand))].sort(),[data])
  useEffect(()=>{if(vehicle){reset({...vehicle,type:vehicle.type as Values['type'],drivetrain:vehicle.drivetrain as Values['drivetrain'],fuel:vehicle.fuel as Values['fuel'],transmission:vehicle.transmission as Values['transmission'],status:vehicle.status as Values['status'],featuresText:vehicle.features.join(', ')});setPhotos(vehicle.vehicle_photos)}},[vehicle,reset])
  useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(isDirty||pending.length){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[isDirty,pending.length])
  const blocker=useBlocker(isDirty||pending.length>0)
  const addFiles=(list:FileList|null)=>{if(!list)return;const next=[...pending,...Array.from(list)];if(next.length+photos.length>20){setPhotoError('Máximo de 20 fotos por veículo.');return}if(next.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)){setPhotoError('Use JPEG, PNG ou WebP até 10 MB.');return}setPhotoError('');setPending(next)}
  const deletePhoto=async(photo:Photo)=>{if(!confirm('Remover esta foto do banco e do Storage?'))return;const {error:storageError}=await supabase.storage.from('vehicle-photos').remove([photo.storage_path]);if(storageError){setMessage(storageError.message);return}const {error}=await supabase.from('vehicle_photos').delete().eq('id',photo.id);if(error){setMessage(error.message);return}setPhotos(p=>p.filter(x=>x.id!==photo.id));qc.invalidateQueries({queryKey:['vehicles']})}
  const reorder=async(e:DragEndEvent)=>{if(!e.over||e.active.id===e.over.id)return;const old=photos.findIndex(p=>p.id===e.active.id),next=photos.findIndex(p=>p.id===e.over?.id);const reordered=arrayMove(photos,old,next);setPhotos(reordered);for(const [position,p] of reordered.entries()){const {error}=await supabase.from('vehicle_photos').update({position}).eq('id',p.id);if(error){setMessage(error.message);return}}qc.invalidateQueries({queryKey:['vehicles']})}
  const save=async(v:Values)=>{if(busy)return;setBusy(true);setMessage('');try{
    const {featuresText,...fields}=v
    const payload={...fields,features:featuresText.split(',').map(s=>s.trim()).filter(Boolean)}
    let vehicleId=id
    if(id){const {error}=await supabase.from('vehicles').update(payload).eq('id',id);if(error)throw error}
    else{const {data:created,error}=await supabase.from('vehicles').insert({...payload,slug:vehicleSlug(v.brand,v.model,v.model_year)}).select('id').single();if(error)throw error;vehicleId=created.id}
    if(!vehicleId)throw new Error('ID do veículo indisponível')
    for(const [index,file] of pending.entries()){const compressed=await imageCompression(file,{maxSizeMB:2,maxWidthOrHeight:1920,useWebWorker:true,fileType:'image/webp'});const path=`${vehicleId}/${crypto.randomUUID()}.webp`;const {error:uploadError}=await supabase.storage.from('vehicle-photos').upload(path,compressed,{contentType:'image/webp'});if(uploadError)throw uploadError;const url=supabase.storage.from('vehicle-photos').getPublicUrl(path).data.publicUrl;const {error:photoRowError}=await supabase.from('vehicle_photos').insert({vehicle_id:vehicleId,url,storage_path:path,position:photos.length+index});if(photoRowError)throw photoRowError;setProgress(Math.round((index+1)/pending.length*100))}
    setPending([]);reset(v);await qc.invalidateQueries({queryKey:['vehicles']});navigate('/admin')
  }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível salvar.')}finally{setBusy(false)}}
  return <div><Link to="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft size={16}/>Voltar ao painel</Link><h1 className="mb-8 text-4xl">{id?'Editar veículo':'Adicionar veículo'}</h1>{id&&!vehicle?<p>Carregando veículo...</p>:<form onSubmit={handleSubmit(save)} className="max-w-5xl rounded-3xl bg-card p-6 md:p-10"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {select('type','Tipo',['carro','moto'])}{input('brand','Marca',<input className="field" list="brands" {...register('brand')}/>)}
    <datalist id="brands">{brands.map(x=><option key={x} value={x}/>)}</datalist>
    {input('model','Modelo',<input className="field" {...register('model')}/>)}
    {input('version','Versão',<input className="field" {...register('version')}/>)}
    {input('manufacture_year','Ano de fabricação',<input className="field" type="number" {...register('manufacture_year',{valueAsNumber:true})}/>)}
    {input('model_year','Ano do modelo',<input className="field" type="number" {...register('model_year',{valueAsNumber:true})}/>)}
    {input('price','Preço (R$)',<input className="field" type="number" step="0.01" {...register('price',{valueAsNumber:true})}/>)}
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
  <section className="mt-9"><h2 className="mb-4 text-2xl">Fotos</h2><p className="mb-4 text-sm text-foreground/60">Arraste para reordenar. A primeira foto é a capa.</p><DndContext collisionDetection={closestCenter} onDragEnd={reorder}><SortableContext items={photos.map(p=>p.id)} strategy={rectSortingStrategy}><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{photos.map((p,i)=><SortablePhoto key={p.id} photo={p} index={i} onDelete={deletePhoto}/>)}</div></SortableContext></DndContext><label className="mt-5 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-border p-8 hover:border-primary" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}}><Upload className="text-primary"/><span className="mt-2">Arraste ou selecione fotos</span><small>JPEG, PNG ou WebP · até 10 MB · máximo 20 fotos</small><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>addFiles(e.target.files)}/></label>{photoError&&<p className="mt-2 text-sm text-accent">{photoError}</p>}<div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">{pending.map((p,i)=><div key={i} className="rounded-xl bg-muted p-2 text-xs"><span className="block truncate">{p.name}</span><button type="button" className="text-accent" onClick={()=>setPending(files=>files.filter((_,j)=>j!==i))}>Remover</button></div>)}</div>{busy&&pending.length>0&&<div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{width:`${progress}%`}}/></div>}</section>{message&&<p role="status" className="mt-4 text-accent">{message}</p>}<button disabled={busy} className="btn-primary mt-8 disabled:opacity-50">{busy?'Salvando...':'Salvar veículo'}</button></form>}{blocker.state==='blocked'&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><div className="max-w-md rounded-3xl bg-card p-8"><h2 className="text-2xl">Alterações não salvas</h2><p className="my-4">Deseja sair sem salvar?</p><div className="flex gap-3"><button className="btn-outline" onClick={()=>blocker.reset()}>Continuar editando</button><button className="btn-primary" onClick={()=>blocker.proceed()}>Sair</button></div></div></div>}</div>
  function input(_key:string,label:string,control:React.ReactNode){return <label className="block"><span className="label">{label}</span>{control}</label>}
  function select(key:keyof Values,label:string,options:string[]){return <label className="block"><span className="label">{label}</span><select className="field" {...register(key)}>{options.map(x=><option key={x} value={x}>{x==='disponivel'?'Disponível':x==='vendido'?'Vendido':x==='carro'?'Carro':x==='moto'?'Moto':x}</option>)}</select></label>}
}
