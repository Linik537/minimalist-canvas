import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { VehicleCard } from '../components/VehicleCard'
import { useVehicles } from '../hooks/useVehicles'
import { site } from '../config/site'
export default function Inventory(){
  const {data=[],isLoading,error}=useVehicles()
  const [params,setParams]=useSearchParams()
  const [drawer,setDrawer]=useState(false)
  const closeDrawer=useRef<HTMLButtonElement>(null)
  const [limit,setLimit]=useState(12)
  useEffect(()=>{if(!drawer)return;const before=document.activeElement as HTMLElement|null;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setDrawer(false)};document.addEventListener('keydown',onKey);closeDrawer.current?.focus();return()=>{document.removeEventListener('keydown',onKey);before?.focus()}},[drawer])
  const get=(key:string)=>params.get(key)||''
  const set=(key:string,value:string)=>{const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);setParams(next);setLimit(12)}
  const brands=[...new Set(data.map(v=>v.brand))].sort()
  const models=[...new Set(data.filter(v=>!get('marca')||v.brand===get('marca')).map(v=>v.model))].sort()
  const latestYear=new Date().getFullYear()+1
  const years=Array.from({length:latestYear-1979},(_,i)=>latestYear-i)
  const filtered=useMemo(()=>data.filter(v=>{
    const q=get('q').toLowerCase()
    return (!q||`${v.brand} ${v.model} ${v.version}`.toLowerCase().includes(q))&&(!get('tipo')||v.type===get('tipo'))&&(!get('marca')||v.brand===get('marca'))&&(!get('modelo')||v.model===get('modelo'))&&(!get('anoMin')||v.model_year>=Number(get('anoMin')))&&(!get('anoMax')||v.model_year<=Number(get('anoMax')))&&(!get('precoMin')||v.price>=Number(get('precoMin')))&&(!get('precoMax')||v.price<=Number(get('precoMax')))&&(!get('kmMax')||v.mileage<=Number(get('kmMax')))&&(!get('cambio')||v.transmission===get('cambio'))&&(!get('combustivel')||v.fuel===get('combustivel'))&&(!get('cor')||v.color.toLowerCase().includes(get('cor').toLowerCase()))&&(!get('destaques')||v.featured)
  }).sort((a,b)=>{switch(get('ordem')){
    case 'menos-novos': return a.model_year-b.model_year||a.manufacture_year-b.manufacture_year
    case 'menor-preco': return a.price-b.price
    case 'maior-preco': return b.price-a.price
    case 'menor-km': return a.mileage-b.mileage
    case 'maior-km': return b.mileage-a.mileage
    default: return b.model_year-a.model_year||b.manufacture_year-a.manufacture_year
  }}),[data,params])
  const filter=<div className="space-y-6">{[
    ['tipo','Tipo',['','carro','moto']],['marca','Marca',['',...brands]],['modelo','Modelo',['',...models]],['cambio','Câmbio',['','Manual','Automático','Automatizado','CVT']],['combustivel','Combustível',['','Flex','Gasolina','Etanol','Diesel','Elétrico','Híbrido']]
  ].map(([key,label,values])=><label className="block" key={key as string}><span className="label">{label as string}</span><select className="field" value={get(key as string)} onChange={e=>set(key as string,e.target.value)}>{(values as string[]).map((v,i)=><option value={v} key={i}>{v==='carro'?'Carro':v==='moto'?'Moto':v||'Todos'}</option>)}</select></label>)}
  <fieldset><legend className="label">Ano do modelo</legend><div className="grid grid-cols-2 gap-3">{[['anoMin','De'],['anoMax','Até']].map(([key,label])=><label className="block min-w-0" key={key}><span className="mb-1 block text-xs text-foreground/60">{label}</span><select className="field min-w-0" value={get(key)} onChange={e=>set(key,e.target.value)}><option value="">Qualquer</option>{years.map(year=><option key={year} value={year}>{year}</option>)}</select></label>)}</div></fieldset>
  <fieldset><legend className="label">Faixa de preço</legend><div className="grid grid-cols-2 gap-3">{[['precoMin','De'],['precoMax','Até']].map(([key,label])=><label className="block min-w-0" key={key}><span className="mb-1 block text-xs text-foreground/60">{label}</span><input className="field min-w-0" type="number" inputMode="numeric" min="0" step="1000" value={get(key)} onChange={e=>set(key,e.target.value)} placeholder="R$"/></label>)}</div></fieldset>
  {[['kmMax','Km máxima'],['cor','Cor']].map(([key,label])=><label className="block" key={key}><span className="label">{label}</span><input className="field" type={key==='cor'?'text':'number'} min={key==='cor'?undefined:'0'} value={get(key)} onChange={e=>set(key,e.target.value)} placeholder={label}/></label>)}
  <button className="text-sm font-bold text-primary" onClick={()=>{setParams({});setLimit(12)}}>Limpar filtros</button></div>
  return <><SEO title="Estoque de carros e motos" description="Veja os carros e motos seminovos disponíveis na Braza Veículos em Uberlândia."/><section className="container-wide pb-24 pt-40"><div className="mb-10"><span className="font-bold uppercase tracking-widest text-primary">Braza Veículos</span><h1 className="mt-3 text-5xl font-extrabold">Nosso estoque</h1><p className="mt-3 text-foreground/65">Encontre o próximo veículo da sua história.</p></div>
  <div className="grid gap-8 lg:grid-cols-[300px_1fr]"><aside className="hidden self-start rounded-3xl border border-border bg-card p-6 lg:block"><h2 className="mb-6 text-xl">Filtros</h2>{filter}</aside><div><div className="mb-6 flex flex-wrap gap-3"><label className="relative min-w-52 flex-1"><Search className="absolute left-4 top-3.5 text-foreground/50" size={20}/><input className="field pl-11" placeholder="Buscar marca, modelo ou versão" value={get('q')} onChange={e=>set('q',e.target.value)}/></label><select className="field w-auto" aria-label="Ordenar" value={get('ordem')} onChange={e=>set('ordem',e.target.value)}><option value="">Mais novos</option><option value="menos-novos">Menos novos</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option><option value="menor-km">Menor km</option><option value="maior-km">Maior km</option></select><button className="btn-outline lg:hidden" onClick={()=>setDrawer(true)}><SlidersHorizontal size={18}/>Filtros</button></div>
  {error?<p className="rounded-2xl bg-muted p-8">Não foi possível carregar o estoque. Tente novamente mais tarde.</p>:isLoading?<div className="skeleton h-80 rounded-3xl"/>:<><p className="mb-5 text-sm text-foreground/60">{filtered.length} veículos encontrados</p><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.slice(0,limit).map(v=><VehicleCard key={v.id} vehicle={v}/>)}</div>{filtered.length>limit&&<button className="btn-outline mx-auto mt-10 flex" onClick={()=>setLimit(x=>x+12)}>Carregar mais</button>}{filtered.length===0&&<div className="rounded-3xl bg-muted p-12 text-center"><h2 className="text-2xl">Nenhum veículo encontrado</h2><p className="my-4">Podemos ajudar você a encontrar o modelo ideal.</p><a className="btn-primary" href={site.whatsappLink} target="_blank" rel="noopener noreferrer">Fale conosco</a></div>}</>}</div></div></section>
  {drawer&&<div className="fixed inset-0 z-50 bg-inverse/60" onClick={()=>setDrawer(false)}><div role="dialog" aria-modal="true" aria-label="Filtros do estoque" className="ml-auto h-full w-80 max-w-[90vw] overflow-y-auto bg-card p-6" onClick={e=>e.stopPropagation()}><button ref={closeDrawer} onClick={()=>setDrawer(false)} aria-label="Fechar filtros" className="mb-5 ml-auto block"><X/></button><h2 className="mb-5 text-xl">Filtros</h2>{filter}<button className="btn-primary mt-6 w-full" onClick={()=>setDrawer(false)}>Ver resultados</button></div></div>}</>
}
