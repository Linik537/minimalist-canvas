import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cover, type Vehicle } from '../lib/vehicles'
import { km, money } from '../lib/format'
export function VehicleCard({vehicle,highlight=false}:{vehicle:Vehicle;highlight?:boolean}) { return <article className={`card-shell flex h-full flex-col p-4 ${highlight?'bg-primary/10':''}`}>
  <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">{vehicle.brand}</p><h3 className="text-xl font-extrabold">{vehicle.model}</h3></div>{vehicle.featured&&<span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-inverse-foreground">Destaque</span>}</div>
  <Link to={`/estoque/${vehicle.slug}`} className="my-4 block overflow-hidden rounded-2xl bg-muted"><img src={cover(vehicle)} alt={`${vehicle.brand} ${vehicle.model}`} width="600" height="450" loading="lazy" className="aspect-[4/3] w-full object-cover transition hover:scale-105"/></Link>
  <p className="text-sm text-foreground/65">{vehicle.manufacture_year}/{vehicle.model_year} · {km(vehicle.mileage)}</p><div className="mt-auto flex items-end justify-between gap-2 pt-3"><strong className="text-xl">{money(vehicle.price)}</strong><Link to={`/estoque/${vehicle.slug}`} className="btn-outline px-4 py-2 text-xs">Ver detalhes <ArrowUpRight size={16}/></Link></div>
  </article> }
