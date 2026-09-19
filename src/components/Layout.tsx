import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowUpRight, Clock3, Camera, Users, Menu, MessageCircle, X, Play } from 'lucide-react'
import { site } from '../config/site'
import { isOpenNow } from '../lib/format'
const nav = [['/','Início'],['/estoque','Estoque'],['/sobre','Sobre'],['/venda-seu-veiculo','Venda seu veículo'],['/financie','Financie']]
function Brand() { return <Link to="/" aria-label="Braza Veículos - início" className="shrink-0 rounded-2xl bg-white px-2 py-1"><img src="/images/logo-braza.png" alt="Braza Veículos" width="120" height="80" className="h-12 w-auto object-contain" /></Link> }
function OpenStatus() {
  const [open,setOpen] = useState(isOpenNow())
  useEffect(() => { const id=setInterval(() => setOpen(isOpenNow()), 60000); return () => clearInterval(id) },[])
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${open?'bg-green-100 text-green-800':'bg-muted text-foreground'}`}><span className={`h-2 w-2 rounded-full ${open?'bg-green-600':'bg-foreground/40'}`}/>{open?'Aberto agora':'Fechado · abre às 08:30'}</span>
}
export { OpenStatus, Brand }
export function PublicLayout() {
  const [menu,setMenu] = useState(false)
  useEffect(() => { const media=matchMedia('(prefers-color-scheme: dark)'); const update=() => document.documentElement.classList.toggle('dark',media.matches); media.addEventListener('change',update); return () => media.removeEventListener('change',update) },[])
  return <div className="min-h-screen">
    <header className="fixed inset-x-0 top-4 z-40 px-4"><div className="mx-auto flex max-w-[1350px] items-center justify-between gap-3 rounded-full border border-border bg-card/95 px-4 py-2 shadow-xl backdrop-blur dark:shadow-none">
      <Brand/><nav className="hidden items-center gap-7 lg:flex">{nav.map(([url,name])=><NavLink key={url} to={url} className={({isActive})=>`text-sm font-semibold transition hover:text-primary ${isActive?'text-primary':''}`}>{name}</NavLink>)}</nav>
      <a className="flex items-center gap-2 whitespace-nowrap text-xs font-bold text-primary sm:text-sm" href={site.whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={20}/>{site.phones.alexandreBraza}</a>
      <button className="rounded-full p-2 lg:hidden" aria-label="Abrir menu" onClick={()=>setMenu(true)}><Menu/></button>
    </div></header>
    {menu && <div className="fixed inset-0 z-50 bg-black/60" onClick={()=>setMenu(false)}><div className="ml-auto h-full w-80 max-w-[85vw] bg-card p-6" onClick={e=>e.stopPropagation()}><button className="mb-8 ml-auto block" aria-label="Fechar menu" onClick={()=>setMenu(false)}><X/></button><div className="space-y-5">{nav.map(([url,name])=><Link key={url} to={url} className="block text-lg font-bold" onClick={()=>setMenu(false)}>{name}</Link>)}</div></div></div>}
    <main><Outlet/></main><Footer/>
    <a href={site.whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Fale conosco no WhatsApp" title="Fale conosco" className="fixed bottom-5 right-5 z-40 grid h-16 w-16 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:scale-110 motion-safe:animate-pulse"><MessageCircle size={30}/></a>
  </div>
}
function Footer() { return <footer className="border-t border-border bg-card"><div className="container-wide grid gap-10 py-16 md:grid-cols-4">
  <div><Brand/><p className="mt-5 max-w-60 text-sm text-foreground/70">{site.slogan}</p><a href={site.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5">Fale no WhatsApp <ArrowUpRight size={18}/></a></div>
  <div><h3 className="mb-5 text-lg">Estoque</h3><div className="space-y-3 text-sm">{[['/estoque?tipo=carro','Carros'],['/estoque?tipo=moto','Motos'],['/estoque?destaques=1','Destaques']].map(([url,name])=><Link className="block hover:text-primary" to={url} key={url}>{name}</Link>)}</div></div>
  <div><h3 className="mb-5 text-lg">Institucional</h3><div className="space-y-3 text-sm">{[['/sobre','Sobre'],['/venda-seu-veiculo','Venda seu veículo'],['/financie','Financie']].map(([url,name])=><Link className="block hover:text-primary" to={url} key={url}>{name}</Link>)}</div></div>
  <div><h3 className="mb-5 text-lg">Contato</h3><p className="text-sm leading-6">{site.address}, CEP {site.postalCode}</p><p className="mt-3 flex items-start gap-2 text-sm"><Clock3 size={17}/>Segunda a sábado, 08:30 às 18:00</p><div className="mt-2"><OpenStatus/></div><p className="mt-4 text-sm">Alexandre Filho {site.phones.alexandreFilho}<br/>Alexandre Braza {site.phones.alexandreBraza}</p><div className="mt-5 flex gap-4">{site.socials.instagram && <a href={site.socials.instagram} aria-label="Instagram"><Camera/></a>}{site.socials.facebook && <a href={site.socials.facebook} aria-label="Facebook"><Users/></a>}{site.socials.youtube && <a href={site.socials.youtube} aria-label="YouTube"><Play/></a>}</div></div>
  </div><div className="border-t border-border"><div className="container-wide flex flex-col justify-between gap-3 py-6 text-xs text-foreground/60 sm:flex-row"><span>© {new Date().getFullYear()} Braza Veículos. Todos os direitos reservados.</span><Link to="/privacidade">Política de privacidade</Link></div></div></footer> }
