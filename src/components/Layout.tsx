import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowUpRight, Clock3, Menu, X } from 'lucide-react'
import { WhatsAppIcon, InstagramIcon, FacebookIcon, YouTubeIcon } from './BrandIcons'
import { openingHoursLabel, site } from '../config/site'
import { isOpenNow } from '../lib/format'
const nav = [['/','Início'],['/estoque','Estoque'],['/sobre','Sobre'],['/venda-seu-veiculo','Venda seu veículo'],['/financie','Financie']]
function Brand() { return <Link to="/" aria-label="Braza Veículos - início" className="flex h-16 w-28 shrink-0 items-center justify-center sm:h-20 sm:w-36"><img src="/images/logo-braza.png" alt="Braza Veículos" width="483" height="289" className="brand-mark h-full w-full object-contain" /></Link> }
function OpenStatus() {
  const [open,setOpen] = useState(isOpenNow())
  useEffect(() => { const id=setInterval(() => setOpen(isOpenNow()), 60000); return () => clearInterval(id) },[])
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${open?'bg-positive-bg text-positive':'bg-muted text-foreground'}`}><span className={`h-2 w-2 rounded-full ${open?'bg-positive':'bg-foreground/40'}`}/>{open?'Aberto agora':`Fechado · abre às ${site.opening.opens}`}</span>
}
export { OpenStatus, Brand }
export function PublicLayout() {
  const [menu,setMenu] = useState(false)
  const closeMenu=useRef<HTMLButtonElement>(null)
  useEffect(() => { const media=matchMedia('(prefers-color-scheme: dark)'); const update=() => document.documentElement.classList.toggle('dark',media.matches); media.addEventListener('change',update); return () => media.removeEventListener('change',update) },[])
  useEffect(()=>{if(!menu)return;const before=document.activeElement as HTMLElement|null;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false)};document.addEventListener('keydown',onKey);closeMenu.current?.focus();return()=>{document.removeEventListener('keydown',onKey);before?.focus()}},[menu])
  return <div className="min-h-screen">
    <header className="fixed inset-x-0 top-4 z-40 px-4"><div className="mx-auto flex max-w-[1350px] items-center justify-between gap-2 rounded-full border border-border bg-card/95 px-4 py-2 shadow-xl backdrop-blur dark:shadow-none sm:gap-3">
      <Brand/><nav className="hidden items-center gap-5 lg:flex xl:gap-7">{nav.map(([url,name])=><NavLink key={url} to={url} className={({isActive})=>`text-base font-semibold transition hover:text-primary ${isActive?'text-primary':''}`}>{name}</NavLink>)}</nav>
      <a className="flex items-center gap-2 whitespace-nowrap rounded-full px-2 py-2 text-xs font-bold text-primary transition duration-200 hover:scale-105 hover:bg-primary hover:text-inverse-foreground sm:px-3 sm:text-sm lg:mr-5" href={site.whatsappLink} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-5 w-5"/>{site.phones.alexandreBraza}</a>
      <button className="rounded-full p-2 lg:hidden" aria-label="Abrir menu" onClick={()=>setMenu(true)}><Menu/></button>
    </div></header>
    {menu && <div className="fixed inset-0 z-50 bg-inverse/60" onClick={()=>setMenu(false)}><div role="dialog" aria-modal="true" aria-label="Menu de navegação" className="ml-auto h-full w-80 max-w-[85vw] bg-card p-6" onClick={e=>e.stopPropagation()}><button ref={closeMenu} className="mb-8 ml-auto block" aria-label="Fechar menu" onClick={()=>setMenu(false)}><X/></button><div className="space-y-5">{nav.map(([url,name])=><Link key={url} to={url} className="block text-lg font-bold" onClick={()=>setMenu(false)}>{name}</Link>)}</div></div></div>}
    <main><Outlet/></main><Footer/>
    <a href={site.whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Fale conosco no WhatsApp" title="Fale conosco" className="whatsapp-float fixed bottom-5 right-5 z-40 grid h-20 w-20 place-items-center rounded-full text-inverse-foreground shadow-2xl transition hover:scale-110 motion-safe:animate-pulse sm:h-[5.5rem] sm:w-[5.5rem]"><WhatsAppIcon className="h-10 w-10 sm:h-11 sm:w-11"/></a>
  </div>
}
function Footer() { return <footer className="border-t border-border bg-card"><div className="container-wide grid gap-10 py-16 md:grid-cols-4">
  <div><Brand/><p className="mt-5 max-w-60 text-sm text-foreground/70">{site.slogan}</p><a href={site.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5">Fale no WhatsApp <ArrowUpRight size={18}/></a></div>
  <div><h3 className="mb-5 text-lg">Estoque</h3><div className="space-y-3 text-sm">{[['/estoque?tipo=carro','Carros'],['/estoque?tipo=moto','Motos'],['/estoque?destaques=1','Destaques']].map(([url,name])=><Link className="block hover:text-primary" to={url} key={url}>{name}</Link>)}</div></div>
  <div><h3 className="mb-5 text-lg">Institucional</h3><div className="space-y-3 text-sm">{[['/sobre','Sobre'],['/venda-seu-veiculo','Venda seu veículo'],['/financie','Financie']].map(([url,name])=><Link className="block hover:text-primary" to={url} key={url}>{name}</Link>)}</div></div>
  <div><h3 className="mb-5 text-lg">Contato</h3><div className="space-y-2 text-sm"><a className="block hover:text-primary" href={site.contactWhatsapp.alexandreBraza} target="_blank" rel="noopener noreferrer">Alexandre Braza · {site.phones.alexandreBraza}</a><a className="block hover:text-primary" href={site.contactWhatsapp.alexandreFilho} target="_blank" rel="noopener noreferrer">Alexandre Filho · {site.phones.alexandreFilho}</a></div><p className="mt-5 text-sm leading-6">{site.address}, CEP {site.postalCode}</p><p className="mt-3 flex items-start gap-2 text-sm"><Clock3 size={17}/>{openingHoursLabel}</p><div className="mt-2"><OpenStatus/></div><div className="mt-5 flex gap-4">{site.socials.instagram && <a href={site.socials.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><InstagramIcon className="h-5 w-5"/></a>}{site.socials.facebook && <a href={site.socials.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><FacebookIcon className="h-5 w-5"/></a>}{site.socials.youtube && <a href={site.socials.youtube} aria-label="YouTube" target="_blank" rel="noopener noreferrer"><YouTubeIcon className="h-5 w-5"/></a>}</div></div>
  </div><div className="border-t border-border"><div className="container-wide flex flex-col justify-between gap-3 py-6 text-xs text-foreground/60 sm:flex-row"><span>© {new Date().getFullYear()} Braza Veículos. Todos os direitos reservados.</span><Link to="/privacidade">Política de privacidade</Link></div></div></footer> }
