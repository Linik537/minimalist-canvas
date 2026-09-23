import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import imageCompression from 'browser-image-compression'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AdminToast, type ToastMessage } from '../../components/AdminToast'
import { VehiclePhotoEditor, type EditorPhoto } from '../../components/admin/VehiclePhotoEditor'
import { useVehicles } from '../../hooks/useVehicles'
import { supabase } from '../../lib/supabase'
import { digits, money, vehicleSlug } from '../../lib/format'
import { clearDraftPhotos, clearVehicleDraft, loadDraftPhotos, readVehicleDraft, saveDraftPhotos, writeVehicleDraft, type DraftPhoto } from '../../lib/vehicleDraft'
import { croppedPhotoBlob, defaultPhotoCrop, type PhotoCrop } from '../../lib/photoCrop'
import { movePhotoBy, movePhotoId, normalizePhotoOrder } from '../../lib/photoOrder'
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
  const [applied,setApplied]=useState<Record<string,Blob>>({})
  const [appliedReady,setAppliedReady]=useState(false)
  const [order,setOrder]=useState<string[]>(initialDraft?.order??[])
  const [crops,setCrops]=useState<Record<string,PhotoCrop>>(initialDraft?.crops??{})
  const [selectedId,setSelectedId]=useState<string|null>(null)
  const [photoDirty,setPhotoDirty]=useState(false)
  const [pendingReady,setPendingReady]=useState(false)
  const [formReady,setFormReady]=useState(!id&&!recoveringCreatedVehicle)
  const [progress,setProgress]=useState(0)
  const [busy,setBusy]=useState(false)
  const [toast,setToast]=useState<ToastMessage|null>(null)
  const [photoError,setPhotoError]=useState('')
  const {register,control,handleSubmit,reset,watch,getValues,formState:{errors,isDirty}}=useForm<Values>({resolver:zodResolver(schema),defaultValues:id?defaults:{...defaults,...initialDraft?.values}})
  const brands=useMemo(()=>[...new Set(data.map(v=>v.brand))].sort(),[data])
  useEffect(()=>{if(vehicle&&hydratedId.current!==vehicle.id){hydratedId.current=vehicle.id;const saved=readVehicleDraft<Values>(draftKey)?.values;reset({...vehicle,type:vehicle.type as Values['type'],drivetrain:vehicle.drivetrain as Values['drivetrain'],fuel:vehicle.fuel as Values['fuel'],transmission:vehicle.transmission as Values['transmission'],status:vehicle.status as Values['status'],featuresText:vehicle.features.join(', '),...saved});setPhotos(vehicle.vehicle_photos);setFormReady(true)}},[vehicle,reset,draftKey])
  useEffect(()=>{if(!formReady)return;const subscription=watch(values=>{if(!finished.current)writeVehicleDraft(draftKey,values as Values,createdId.current??undefined,order,crops)});return()=>subscription.unsubscribe()},[draftKey,formReady,watch,order,crops])
  useEffect(()=>{if(formReady&&!finished.current)writeVehicleDraft(draftKey,getValues(),createdId.current??undefined,order,crops)},[draftKey,formReady,order,crops,getValues])
  useEffect(()=>{let active=true;loadDraftPhotos(draftKey).then(saved=>{if(active)setPending(saved)}).catch(()=>{if(active)setPhotoError('Não foi possível restaurar as fotos do rascunho.')}).finally(()=>{if(active)setPendingReady(true)});return()=>{active=false}},[draftKey])
  useEffect(()=>{let active=true;loadDraftPhotos(`${draftKey}:applied`).then(saved=>{if(active)setApplied(Object.fromEntries(saved.map(p=>[p.id,p.file])))}).catch(()=>{if(active)setPhotoError('Não foi possível restaurar os ajustes das fotos.')}).finally(()=>{if(active)setAppliedReady(true)});return()=>{active=false}},[draftKey])
  useEffect(()=>{if(!pendingReady||finished.current)return;const snapshot=[...pending];photoSave.current=photoSave.current.then(()=>saveDraftPhotos(draftKey,snapshot)).catch(()=>setPhotoError('O navegador não conseguiu guardar as fotos do rascunho.'))},[draftKey,pending,pendingReady])
  useEffect(()=>{if(!appliedReady||finished.current)return;const snapshot=Object.entries(applied).map(([id,blob])=>({id,file:new File([blob],`${id}.webp`,{type:'image/webp'})}));photoSave.current=photoSave.current.then(()=>saveDraftPhotos(`${draftKey}:applied`,snapshot)).catch(()=>setPhotoError('O navegador não conseguiu guardar os ajustes das fotos.'))},[draftKey,applied,appliedReady])
  useEffect(()=>{if(!formReady||!pendingReady)return;const ids=[...photos.map(p=>p.id),...pending.map(p=>p.id)];setOrder(current=>{const next=normalizePhotoOrder(current,ids);return next.join('|')===current.join('|')?current:next});setSelectedId(current=>current&&ids.includes(current)?current:ids[0]??null)},[formReady,pendingReady,photos,pending])
  useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(isDirty||pending.length||photoDirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[isDirty,pending.length,photoDirty])
  const blocker=useBlocker(isDirty||pending.length>0||photoDirty)
  const editorPhotos=useMemo<EditorPhoto[]>(()=>{const items=[...photos.map(p=>({id:p.id,source:p.url,preview:applied[p.id],label:`Foto ${p.position+1}`,isNew:false})),...pending.map(p=>({id:p.id,source:p.file,preview:applied[p.id],label:p.file.name,isNew:true}))];return items.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))},[photos,pending,order,applied])
  const changeOrder=(next:string[])=>{setOrder(next);setPhotoDirty(true)}
  const movePhoto=(photoId:string,delta:number)=>{if(busy)return;setOrder(current=>movePhotoBy(normalizePhotoOrder(current,editorPhotos.map(p=>p.id)),photoId,delta));setPhotoDirty(true)}
  const addFiles=(list:FileList|null)=>{if(busy||!pendingReady||!list)return;const added=Array.from(list).map(file=>({id:crypto.randomUUID(),file}));const next=[...pending,...added];if(next.length+photos.length>20){setPhotoError('Máximo de 20 fotos por veículo.');return}if(added.some(({file})=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)){setPhotoError('Use JPEG, PNG ou WebP até 10 MB.');return}setPhotoError('');setPending(next);setOrder(current=>normalizePhotoOrder(current,[...photos.map(p=>p.id),...next.map(p=>p.id)]));setSelectedId(current=>current??added[0]?.id??null)}
  const reorder=(active:string,over:string)=>{if(busy)return;setOrder(current=>{const normalized=normalizePhotoOrder(current,editorPhotos.map(p=>p.id));return movePhotoId(normalized,active,normalized.indexOf(over))});setPhotoDirty(true)}
  const deletePhoto=async(photoId:string)=>{if(busy)return;const existing=photos.find(p=>p.id===photoId);if(!existing){setPending(current=>current.filter(p=>p.id!==photoId));setOrder(current=>current.filter(x=>x!==photoId));setApplied(current=>{const next={...current};delete next[photoId];return next});return}if(!confirm('Remover esta foto do banco e do Storage?'))return;setBusy(true);try{const {error}=await supabase.from('vehicle_photos').delete().eq('id',existing.id);if(error)throw error;setPhotos(p=>p.filter(x=>x.id!==existing.id));setOrder(current=>current.filter(x=>x!==existing.id));setApplied(current=>{const next={...current};delete next[photoId];return next});const {error:storageError}=await supabase.storage.from('vehicle-photos').remove([existing.storage_path]);await qc.invalidateQueries({queryKey:['vehicles']});setToast({text:storageError?'Foto removida do banco; confira o arquivo antigo no Storage.':'Foto removida.',kind:storageError?'error':'success'})}catch(e){setToast({text:e instanceof Error?e.message:'Não foi possível remover a foto.',kind:'error'})}finally{setBusy(false)}}
  const applyPhoto=async(photoId:string,blob:Blob)=>{setApplied(current=>({...current,[photoId]:blob}));setPhotoDirty(true);setToast({text:'Prévia atualizada. Salve o veículo para enviar a foto otimizada.',kind:'success'})}
  const save=async(v:Values)=>{if(busy)return;setBusy(true);setToast(null);setProgress(0);try{
    const {featuresText,...fields}=v
    const payload={...fields,features:featuresText.split(',').map(s=>s.trim()).filter(Boolean)}
    let vehicleId=id??createdId.current
    if(vehicleId){const {error}=await supabase.from('vehicles').update(payload).eq('id',vehicleId);if(error)throw error}
    else{const {data:created,error}=await supabase.from('vehicles').insert({...payload,slug:vehicleSlug(v.brand,v.model,v.model_year)}).select('id').single();if(error)throw error;vehicleId=created.id;createdId.current=created.id;writeVehicleDraft(draftKey,getValues(),created.id,order,crops)}
    if(!vehicleId)throw new Error('ID do veículo indisponível')
    const ordered=editorPhotos.map(p=>p.id)
    for(const [position,photoId] of ordered.entries()){
      const existing=photos.find(p=>p.id===photoId)
      if(existing){
        const edited=applied[photoId]
        if(edited){
          const path=`${vehicleId}/${crypto.randomUUID()}.webp`
          const {error:uploadError}=await supabase.storage.from('vehicle-photos').upload(path,edited,{contentType:'image/webp'});if(uploadError)throw uploadError
          const url=supabase.storage.from('vehicle-photos').getPublicUrl(path).data.publicUrl
          const {data:updated,error}=await supabase.from('vehicle_photos').update({url,storage_path:path,position}).eq('id',photoId).select().single()
          if(error){await supabase.storage.from('vehicle-photos').remove([path]);throw error}
          setPhotos(current=>current.map(p=>p.id===photoId?updated:p))
          setApplied(current=>{const next={...current};delete next[photoId];return next})
          const {error:removeError}=await supabase.storage.from('vehicle-photos').remove([existing.storage_path])
          if(removeError)setToast({text:'Foto salva; confira o arquivo antigo no Storage.',kind:'error'})
        }else if(existing.position!==position){const {error}=await supabase.from('vehicle_photos').update({position}).eq('id',existing.id);if(error)throw error;setPhotos(current=>current.map(p=>p.id===existing.id?{...p,position}:p))}
        continue
      }
      const upload=pending.find(p=>p.id===photoId)
      if(!upload)continue
      const blob=applied[photoId]??await croppedPhotoBlob(upload.file,crops[photoId]??defaultPhotoCrop)
      const compressed=blob.size>2*1024*1024?await imageCompression(new File([blob],upload.file.name,{type:'image/webp'}),{maxSizeMB:2,maxWidthOrHeight:1920,initialQuality:0.8,useWebWorker:true,fileType:'image/webp'}):blob
      const path=`${vehicleId}/${crypto.randomUUID()}.webp`
      const {error:uploadError}=await supabase.storage.from('vehicle-photos').upload(path,compressed,{contentType:'image/webp'});if(uploadError)throw uploadError
      const url=supabase.storage.from('vehicle-photos').getPublicUrl(path).data.publicUrl
      const {data:photoRow,error:photoRowError}=await supabase.from('vehicle_photos').insert({vehicle_id:vehicleId,url,storage_path:path,position}).select().single()
      if(photoRowError){await supabase.storage.from('vehicle-photos').remove([path]);throw photoRowError}
      setPhotos(current=>[...current,photoRow]);setPending(current=>current.filter(item=>item.id!==photoId));setApplied(current=>{const next={...current};delete next[photoId];return next});setOrder(current=>current.map(x=>x===photoId?photoRow.id:x));setProgress(Math.round((position+1)/ordered.length*100))
    }
    finished.current=true;await photoSave.current;clearVehicleDraft(draftKey);await Promise.all([clearDraftPhotos(draftKey),clearDraftPhotos(`${draftKey}:applied`)]).catch(()=>{});reset(v);await qc.invalidateQueries({queryKey:['vehicles']});setBusy(false);navigate('/admin',{state:{notice:'Veículo salvo com sucesso.'}})
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
  <VehiclePhotoEditor photos={editorPhotos} selectedId={selectedId} crop={crops[selectedId??'']??defaultPhotoCrop} busy={busy} progress={progress} error={photoError} onSelect={setSelectedId} onCrop={crop=>{if(selectedId){setCrops(current=>({...current,[selectedId]:crop}));setPhotoDirty(true)}}} onMove={movePhoto} onCover={photoId=>{const ids=editorPhotos.map(p=>p.id);changeOrder([photoId,...ids.filter(x=>x!==photoId)])}} onRemove={deletePhoto} onReorder={reorder} onApply={applyPhoto} onFiles={addFiles}/><button disabled={busy||!pendingReady||!appliedReady||!formReady} className="btn-primary mt-8 disabled:opacity-50">{busy?'Salvando...':'Salvar veículo'}</button></form>}{blocker.state==='blocked'&&<div className="fixed inset-0 z-50 grid place-items-center bg-inverse/60 p-4"><div className="max-w-md rounded-3xl bg-card p-8"><h2 className="text-2xl">Alterações não salvas</h2><p className="my-4">Deseja sair sem salvar?</p><div className="flex gap-3"><button className="btn-outline" onClick={()=>blocker.reset()}>Continuar editando</button><button className="btn-primary" onClick={()=>blocker.proceed()}>Sair</button></div></div></div>}<AdminToast toast={toast} onClose={()=>setToast(null)}/></div>
  function input(_key:string,label:string,control:React.ReactNode){return <label className="block"><span className="label">{label}</span>{control}</label>}
  function select(key:keyof Values,label:string,options:string[]){return <label className="block"><span className="label">{label}</span><select className="field" {...register(key)}>{options.map(x=><option key={x} value={x}>{x==='disponivel'?'Disponível':x==='vendido'?'Vendido':x==='carro'?'Carro':x==='moto'?'Moto':x}</option>)}</select></label>}
}
