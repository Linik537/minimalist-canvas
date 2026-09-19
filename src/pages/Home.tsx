import { useState } from 'react'
import { ArrowUpRight, CarFront, Handshake, Landmark, Search, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { VehicleCard } from '../components/VehicleCard'
import { useVehicles } from '../hooks/useVehicles'
import { site } from '../config/site'
import { Reveal } from '../components/Reveal'
const categories = [
  {title:'Carros',image:'categoria-carros',url:'/estoque?tipo=carro'},
  {title:'Motos',image:'categoria-motos',url:'/estoque?tipo=moto'},
  {title:'Financie',image:'categoria-financie',url:'/financie'},
  {title:'Venda seu veículo',image:'categoria-venda',url:'/venda-seu-veiculo'}
]
export default function Home(){
  const {data=[],isLoading}=useVehicles()
  const navigate=useNavigate()
  const [type,setType]=useState('')
  const [brand,setBrand]=useState('')
  const [model,setModel]=useState('')
  const [price,setPrice]=useState('')
  const brands=[...new Set(data.filter(v=>!type||v.type===type).map(v=>v.brand))].sort()
  const models=[...new Set(data.filter(v=>(!type||v.type===type)&&(!brand||v.brand===brand)).map(v=>v.model))].sort()
  const search=()=>{const params=new URLSearchParams();if(type)params.set('tipo',type);if(brand)params.set('marca',brand);if(model)params.set('modelo',model);if(price)params.set('precoMax',price);navigate(`/estoque?${params}`)}
  const structured={ '@context':'https://schema.org','@type':'AutoDealer',name:site.name,address:{'@type':'PostalAddress',streetAddress:site.address,addressLocality:'Uberlândia',addressRegion:'MG',postalCode:site.postalCode,addressCountry:'BR'},telephone:site.phones.alexandreBraza,openingHoursSpecification:{'@type':'OpeningHoursSpecification',dayOfWeek:site.opening.days.map(day=>['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day]),opens:site.opening.opens,closes:site.opening.closes}}
  return <><SEO title="Carros e motos em Uberlândia" description="Braza Veículos: há mais de 30 anos realizando sonhos com compra, venda, troca, consignação e financiamento de carros e motos em Uberlândia." structured={structured}/>
  <section className="hero-stage relative min-h-[930px] text-inverse-foreground md:min-h-[760px]">
    <div className="container-wide flex min-h-[930px] flex-col justify-start pb-52 pt-40 md:min-h-[760px] md:justify-center md:pb-40 md:pt-36"><span className="mb-5 text-sm font-bold uppercase tracking-[.25em] text-inverse-foreground/75">Uberlândia · Minas Gerais</span><h1 className="max-w-5xl text-[2.45rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-[4.5rem]">Realizando sonhos há mais de <span className="text-brand-tint">30 anos</span></h1><p className="mt-7 max-w-xl text-lg text-inverse-foreground/80">Compra, venda, troca, consignação e financiamento de carros e motos para o seu próximo capítulo.</p></div>
    <div className="container-wide absolute inset-x-0 bottom-[-55px] z-10"><div className="mx-auto max-w-5xl"><div className="flex w-fit rounded-t-2xl bg-card p-1 text-foreground shadow-lg">{[['carro','Carros'],['moto','Motos'],['','Todos']].map(([value,label])=><button key={label} className={`rounded-xl px-5 py-3 text-sm font-bold ${type===value?'bg-primary text-inverse-foreground':''}`} onClick={()=>{setType(value);setBrand('');setModel('')}}>{label}</button>)}</div><div className="grid gap-3 rounded-b-3xl rounded-tr-3xl border border-border bg-card p-4 text-foreground shadow-2xl md:grid-cols-[1fr_1fr_1fr_auto] md:p-6">
      <label><span className="label">Marca</span><select className="field" value={brand} onChange={e=>{setBrand(e.target.value);setModel('')}}><option value="">Todas as marcas</option>{brands.map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span className="label">Modelo</span><select className="field" value={model} onChange={e=>setModel(e.target.value)}><option value="">Todos os modelos</option>{models.map(x=><option key={x}>{x}</option>)}</select></label>
      <label><span className="label">Faixa de preço</span><select className="field" value={price} onChange={e=>setPrice(e.target.value)}><option value="">Qualquer preço</option><option value="30000">Até R$ 30 mil</option><option value="50000">Até R$ 50 mil</option><option value="70000">Até R$ 70 mil</option><option value="100000">Até R$ 100 mil</option></select></label><button className="btn-primary self-end py-4" onClick={search}><Search size={18}/>Buscar</button>
    </div></div></div>
  </section>
  <section className="container-wide section-space pt-36"><h2 className="mb-10 text-4xl font-extrabold md:text-5xl">Encontre seu caminho</h2><Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{categories.map(c=><Link key={c.title} to={c.url} className="group relative min-h-[360px] overflow-hidden rounded-[2rem] bg-muted lg:min-h-[400px]"><img src={`/images/${c.image}.svg`} alt="" width="500" height="700" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="category-shade absolute inset-0"/><span className="absolute left-6 top-7 max-w-[70%] font-display text-3xl font-bold text-inverse-foreground">{c.title}</span><span className="absolute bottom-6 right-6 grid h-11 w-11 place-items-center rounded-full bg-logo-badge text-primary transition group-hover:bg-primary group-hover:text-inverse-foreground"><ArrowUpRight/></span></Link>)}</Reveal></section>
  <section className="section-space bg-muted"><div className="container-wide"><div className="mb-10 flex items-end justify-between gap-4"><div><span className="text-sm font-bold uppercase tracking-widest text-primary">Seleção Braza</span><h2 className="mt-2 text-4xl font-extrabold md:text-5xl">Destaques</h2></div><Link to="/estoque" className="btn-primary hidden sm:inline-flex">Ver todos <ArrowUpRight size={18}/></Link></div>{isLoading?<div className="skeleton h-80 rounded-3xl"/>:<Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.filter(v=>v.featured).slice(0,4).map((v,i)=><VehicleCard key={v.id} vehicle={v} highlight={i===0}/>)}</Reveal>}{!isLoading&&data.filter(v=>v.featured).length===0&&<p className="rounded-2xl bg-card p-8">Em breve, novos destaques por aqui. <Link to="/estoque" className="text-primary underline">Veja todo o estoque</Link>.</p>}</div></section>
  <section className="bg-inverse py-12 text-inverse-foreground"><Reveal className="container-wide grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{[[CarFront,'Compramos seu veículo'],[Handshake,'Aceitamos carro ou moto na troca'],[ShieldCheck,'Consignação'],[Landmark,'Financiamento facilitado']].map(([Icon,label])=>{const I=Icon as typeof CarFront;return <div key={label as string} className="flex items-center gap-4"><I size={34} strokeWidth={1.4}/><span className="text-sm font-semibold">{label as string}</span></div>})}</Reveal></section>
  <section className="banner-stage relative min-h-[460px] text-inverse-foreground"><div className="container-wide flex min-h-[460px] flex-col justify-center py-16"><h2 className="max-w-2xl text-4xl font-extrabold md:text-6xl">Mais de 30 anos realizando sonhos</h2><p className="mt-4 max-w-lg text-inverse-foreground/80">Gente de verdade ajudando você a encontrar o veículo certo.</p><a href={site.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8 w-fit">Fale no WhatsApp <ArrowUpRight size={18}/></a></div><div className="relative mb-8 ml-5 grid h-28 w-28 place-items-center rounded-2xl bg-primary p-4 text-center font-display text-xl font-bold md:absolute md:right-16 md:top-14 md:mb-0 md:ml-0 md:h-36 md:w-36">+30 anos de tradição</div></section>
  </>
}
