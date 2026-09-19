import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import imageCompression from 'browser-image-compression'
import { ArrowUpRight, Camera, CheckCircle2, ClipboardCheck, MessageCircle, Upload } from 'lucide-react'
import { SEO } from '../components/SEO'
import { supabase } from '../lib/supabase'
import { whatsappFor } from '../lib/format'
const schema=z.object({
  type:z.enum(['carro','moto']),brand:z.string().trim().min(2).max(80),model:z.string().trim().min(1).max(80),
  year:z.number().int().min(1950).max(2100),mileage:z.number().int().min(0),
  color:z.string().trim().min(1).max(50),asking_price:z.number().positive(),
  name:z.string().trim().min(2).max(120),whatsapp:z.string().regex(/^\d{10,15}$/,'Informe apenas DDD e número'),
  email:z.union([z.email(),z.literal('')]).optional(),notes:z.string().max(3000).optional(),
  consent:z.literal(true,{error:'O consentimento é obrigatório'})
})
type Values=z.infer<typeof schema>
export default function Sell(){
  const [photos,setPhotos]=useState<File[]>([])
  const [photoError,setPhotoError]=useState('')
  const [busy,setBusy]=useState(false)
  const [success,setSuccess]=useState(false)
  const [error,setError]=useState('')
  const {register,handleSubmit,formState:{errors}}=useForm<Values>({resolver:zodResolver(schema),defaultValues:{type:'carro',consent:undefined}})
  const addPhotos=(files:FileList|null)=>{if(!files)return;const next=[...photos,...Array.from(files)];if(next.length>6){setPhotoError('Envie até 6 fotos.');return}if(next.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024)){setPhotoError('Use JPEG, PNG ou WebP de até 10 MB.');return}setPhotoError('');setPhotos(next)}
  const submit=async(v:Values)=>{if(busy)return;setBusy(true);setError('');try{
    const id=crypto.randomUUID()
    const {error:leadError}=await supabase.from('sell_requests').insert({...v,id,email:v.email||null,notes:v.notes||null,contacted:false})
    if(leadError)throw leadError
    for(const photo of photos){const compressed=await imageCompression(photo,{maxSizeMB:2,maxWidthOrHeight:1920,useWebWorker:true,fileType:'image/webp'});const path=`public/${id}/${crypto.randomUUID()}.webp`;const {error:uploadError}=await supabase.storage.from('sell-requests').upload(path,compressed,{contentType:'image/webp'});if(uploadError)throw uploadError;const {error:rowError}=await supabase.from('sell_request_photos').insert({request_id:id,storage_path:path});if(rowError)throw rowError}
    setSuccess(true);window.open(whatsappFor(`Olá! Enviei uma proposta de venda/consignação: ${v.brand} ${v.model} ${v.year}, ${v.mileage} km. Meu nome é ${v.name}. Protocolo: ${id}`),'_blank','noopener,noreferrer')
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar. Tente novamente.')}finally{setBusy(false)}}
  return <><SEO title="Venda seu veículo" description="Venda ou consigne seu carro ou moto com a Braza Veículos em Uberlândia."/><section className="container-wide pb-24 pt-40"><div className="max-w-3xl"><span className="font-bold uppercase tracking-widest text-primary">Negocie com a Braza</span><h1 className="mt-3 text-5xl font-extrabold md:text-6xl">Venda ou consigne seu veículo com a gente</h1><p className="mt-5 text-lg text-foreground/65">Uma negociação simples, transparente e acompanhada por quem conhece o mercado há mais de 30 anos.</p></div><div className="my-14 grid gap-5 md:grid-cols-3">{[[Camera,'1. Conte sobre o veículo','Preencha os dados e adicione fotos.'],[ClipboardCheck,'2. Avaliamos juntos','Nossa equipe analisa sua proposta.'],[MessageCircle,'3. Conversamos','Entramos em contato para combinar os próximos passos.']].map(([Icon,title,text])=>{const I=Icon as typeof Camera;return <div key={title as string} className="rounded-3xl bg-muted p-7"><I className="text-primary" size={30}/><h2 className="mt-5 text-xl">{title as string}</h2><p className="mt-2 text-sm text-foreground/65">{text as string}</p></div>})}</div>
  {success?<div className="rounded-3xl bg-muted p-10 text-center"><CheckCircle2 className="mx-auto text-primary" size={50}/><h2 className="mt-4 text-3xl">Solicitação enviada!</h2><p className="mt-3">Recebemos seus dados. Nossa equipe entrará em contato.</p></div>:<form onSubmit={handleSubmit(submit)} className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 md:p-10"><h2 className="mb-7 text-3xl">Fale do seu veículo</h2><div className="grid gap-5 sm:grid-cols-2">
    {field('type','Tipo',<select className="field" {...register('type')}><option value="carro">Carro</option><option value="moto">Moto</option></select>,errors.type?.message)}
    {field('brand','Marca',<input className="field" {...register('brand')} placeholder="Ex.: Honda"/>,errors.brand?.message)}
    {field('model','Modelo',<input className="field" {...register('model')} placeholder="Ex.: CG 160"/>,errors.model?.message)}
    {field('year','Ano',<input className="field" type="number" {...register('year',{valueAsNumber:true})}/>,errors.year?.message)}
    {field('mileage','Quilometragem',<input className="field" type="number" {...register('mileage',{valueAsNumber:true})}/>,errors.mileage?.message)}
    {field('color','Cor',<input className="field" {...register('color')}/>,errors.color?.message)}
    {field('asking_price','Valor pretendido (R$)',<input className="field" type="number" min="1" step="0.01" {...register('asking_price',{valueAsNumber:true})}/>,errors.asking_price?.message)}
    <div/>
    {field('name','Seu nome',<input className="field" {...register('name')}/>,errors.name?.message)}
    {field('whatsapp','WhatsApp com DDD',<input className="field" inputMode="numeric" {...register('whatsapp')} placeholder="34999999999"/>,errors.whatsapp?.message)}
    {field('email','E-mail (opcional)',<input className="field" type="email" {...register('email')}/>,errors.email?.message)}
    {field('notes','Observações',<textarea className="field min-h-28" {...register('notes')}/>,errors.notes?.message)}
  </div><div className="mt-7"><span className="label">Fotos do veículo (até 6)</span><label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center hover:border-primary" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addPhotos(e.dataTransfer.files)}}><Upload className="text-primary"/><span>Arraste fotos ou clique para selecionar</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>addPhotos(e.target.files)}/></label>{photoError&&<p role="alert" className="mt-2 text-sm text-accent">{photoError}</p>}<div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">{photos.map((file,i)=><div key={i} className="relative"><img src={URL.createObjectURL(file)} alt={`Prévia ${i+1}`} className="aspect-square w-full rounded-xl object-cover"/><button type="button" className="absolute right-1 top-1 rounded-full bg-card px-2" aria-label={`Remover foto ${i+1}`} onClick={()=>setPhotos(p=>p.filter((_,j)=>j!==i))}>×</button></div>)}</div></div>
  <label className="mt-8 flex items-start gap-3 text-sm"><input type="checkbox" {...register('consent')} className="mt-1"/><span>Concordo com o tratamento dos meus dados para contato e avaliação da proposta, conforme a política de privacidade.</span></label>{errors.consent&&<p role="alert" className="text-sm text-accent">{errors.consent.message}</p>}{error&&<p role="alert" className="mt-4 text-accent">{error}</p>}<button disabled={busy} className="btn-primary mt-8 w-full disabled:opacity-50">{busy?'Enviando...':'Enviar proposta'} <ArrowUpRight size={18}/></button></form>}</section></>
}
function field(id:string,label:string,control:React.ReactNode,error?:string){return <div><label className="label" htmlFor={id}>{label}</label>{control}{error&&<p role="alert" className="mt-1 text-xs text-accent">{error}</p>}</div>}
