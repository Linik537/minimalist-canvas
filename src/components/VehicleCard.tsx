import { ArrowUpRight, CalendarDays, Gauge } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cover, type Vehicle } from '../lib/vehicles'
import { km, money } from '../lib/format'

export function VehicleCard({ vehicle, highlight = false }: { vehicle: Vehicle; highlight?: boolean }) {
  const href = `/estoque/${vehicle.slug}`
  return <article className="group flex h-full flex-col text-inverse-foreground transition duration-300 hover:-translate-y-1 hover:drop-shadow-2xl">
    <Link to={href} className="relative block overflow-hidden rounded-t-[2rem] bg-muted">
      <img src={cover(vehicle)} alt={`${vehicle.brand} ${vehicle.model}`} width="760" height="570" loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      {vehicle.featured && <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1.5 text-xs font-extrabold text-white shadow-lg">Destaque</span>}
    </Link>
    <div className={`flex flex-1 flex-col rounded-b-[2rem] border bg-inverse p-5 ${highlight ? 'border-primary' : 'border-border'}`}>
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-tint">{vehicle.brand}</p>
      <Link to={href} className="mt-1 w-fit"><h3 className="text-2xl font-extrabold leading-tight transition group-hover:text-brand-tint">{vehicle.model}</h3></Link>
      {vehicle.version && <p className="mt-1 text-sm font-medium text-inverse-foreground/70">{vehicle.version}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-inverse-foreground/75">
        <span className="inline-flex items-center gap-2"><CalendarDays size={17} className="text-brand-tint" />{vehicle.manufacture_year}/{vehicle.model_year}</span>
        <span className="inline-flex items-center gap-2"><Gauge size={18} className="text-brand-tint" />{km(vehicle.mileage)}</span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <strong className="font-display text-2xl leading-none">{money(vehicle.price)}</strong>
        <Link to={href} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-inverse-foreground/30 px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:bg-primary hover:text-white">Ver mais <ArrowUpRight size={17} /></Link>
      </div>
    </div>
  </article>
}
