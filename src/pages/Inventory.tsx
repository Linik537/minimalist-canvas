import { useMemo, useState } from 'react'
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
  const [limit,setLimit]=useState(12)
  const get=(key:string)=>params.get(key)||''
  const set=(key:string,value:string)=>{const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);setParams(next);setLimit(12)}
  const brands=[...new Set(data.map(v=>v.brand))].sort()
  const models=[...new Set(data.filter(v=>!get('marca')||v.brand===get('marca')).map(v=>v.model))].sort()
  const filtered=useMemo(()=>data.filter(v=>{
    const q=get('q').toLowerCase()
    return (!q||`${v.brand} ${v.model} ${v.version}`.toLowerCase().includes(q))&&(!get('tipo')||v.type===get('tipo'))&&(!get('marca')||v.brand===get('marca'))&&(!get('modelo')||v.model===get('modelo'))&&(!get('ano')||v.model_year>=Number(get('ano')))&&(!get('precoMin')||v.price>=Number(get('precoMin')))&&(!get('precoMax')||v.price<=Number(get('precoMax')))&&(!get('kmMax')||v.mileage<=Number(get('kmMax')))&&(!get('cambio')||v.transmission===get('cambio'))&&(!get('combustivel')||v.fuel===get('combustivel'))&&(!get('cor')||v.color.toLowerCase().includes(get('cor').toLowerCase()))&&(!get('destaques')||v.featured)
  }).sort((a,b)=>get('ordem')==='menor-preco'?a.price-b.price:get('ordem')==='maior-preco'?b.price-a.price:get('ordem')==='menor-km'?a.mileage-b.mileage:get('ordem')==='mais-novos'?b.model_year-a.model_year:b.created_at.localeCompare(a.created_at)),[data,params])
  const filter=<div className="space-y-4">{[
    ['tipo','Tipo',['','carro','moto']],['marca','Marca',['',...brands]],['modelo','Modelo',['',...models]],['cambio','Câmbio',['','Manual','Automático','Automatizado','CVT']],['combustivel','Combustível',['','Flex','Gasolina','Etanol','Diesel','Elétrico','Híbrido']]
  ].map(([key,label,values])=><label key={key as string}><span className="label">{label as string}</span><select className="field" value={get(key as string)} onChange={e=>set(key as string,e.target.value)}>{(values as string[]).map((v,i)=><option value={v} key={i}>{v||'Todos'}</option>)}</select></label>)}
  {[['ano','Ano mínimo'],['precoMin','Preço mínimo'],['precoMax','Preço máximo'],['kmMax','Km máxima'],['cor','Cor']].map(([key,label])=><label key={key}><span className="label">{label}</span><input className="field" type={key==='cor'?'text':'number'} min="0" value={get(key)} onChange={e=>set(key,e.target.value)} placeholder={label}/></label>)}
  <button className="text-sm font-bold text-primary" onClick={()=>setParams({})}>Limpar filtros</button></div>
  return <><SEO title="Estoque de carros e motos" description="Veja os carros e motos seminovos disponíveis na Braza Veículos em Uberlândia."/><section className="container-wide pb-24 pt-40"><div className="mb-10"><span className="font-bold uppercase tracking-widest text-primary">Braza Veículos</span><h1 className="mt-3 text-5xl font-extrabold">Nosso estoque</h1><p className="mt-3 text-foreground/65">Encontre o próximo veículo da sua história.</p></div>
  <div className="grid gap-8 lg:grid-cols-[280px_1fr]"><aside className="hidden self-start rounded-3xl border border-border bg-card p-5 lg:block"><h2 className="mb-5 text-xl">Filtros</h2>{filter}</aside><div><div className="mb-6 flex flex-wrap gap-3"><label className="relative min-w-52 flex-1"><Search className="absolute left-4 top-3.5 text-foreground/50" size={20}/><input className="field pl-11" placeholder="Buscar marca, modelo ou versão" value={get('q')} onChange={e=>set('q',e.target.value)}/></label><select className="field w-auto" aria-label="Ordenar" value={get('ordem')} onChange={e=>set('ordem',e.target.value)}><option value="">Mais recentes</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option><option value="menor-km">Menor km</option><option value="mais-novos">Mais novos</option></select><button className="btn-outline lg:hidden" onClick={()=>setDrawer(true)}><SlidersHorizontal size={18}/>Filtros</button></div>
  {error?<p className="rounded-2xl bg-muted p-8">Não foi possível carregar o estoque. Tente novamente mais tarde.</p>:isLoading?<div className="skeleton h-80 rounded-3xl"/>:<><p className="mb-5 text-sm text-foreground/60">{filtered.length} veículos encontrados</p><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.slice(0,limit).map(v=><VehicleCard key={v.id} vehicle={v}/>)}</div>{filtered.length>limit&&<button className="btn-outline mx-auto mt-10 flex" onClick={()=>setLimit(x=>x+12)}>Carregar mais</button>}{filtered.length===0&&<div className="rounded-3xl bg-muted p-12 text-center"><h2 className="text-2xl">Nenhum veículo encontrado</h2><p className="my-4">Podemos ajudar você a encontrar o modelo ideal.</p><a className="btn-primary" href={site.whatsappLink} target="_blank" rel="noopener noreferrer">Fale conosco</a></div>}</>}</div></div></section>
  {drawer&&<div className="fixed inset-0 z-50 bg-black/60" onClick={()=>setDrawer(false)}><div className="ml-auto h-full w-80 max-w-[90vw] overflow-y-auto bg-card p-6" onClick={e=>e.stopPropagation()}><button onClick={()=>setDrawer(false)} aria-label="Fechar filtros" className="mb-5 ml-auto block"><X/></button><h2 className="mb-5 text-xl">Filtros</h2>{filter}<button className="btn-primary mt-6 w-full" onClick={()=>setDrawer(false)}>Ver resultados</button></div></div>}</>
}
