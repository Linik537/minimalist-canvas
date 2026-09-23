import { useState } from 'react'
import { ArrowUpRight, CalendarDays, CircleDot, Cog, Copy, Fuel, Gauge, Share2, Zap } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { VehicleGallery } from '../components/VehicleGallery'
import { VehicleCard } from '../components/VehicleCard'
import { useVehicles } from '../hooks/useVehicles'
import { cover } from '../lib/vehicles'
import { km, money, whatsappFor } from '../lib/format'

export default function VehiclePage() {
  const { slug } = useParams()
  const { data = [], isLoading } = useVehicles()
  const [copied, setCopied] = useState(false)
  const vehicle = data.find(item => item.slug === slug)

  if (isLoading) return <div className="container-wide pb-24 pt-40"><div className="skeleton h-[60vh] rounded-3xl" /></div>
  if (!vehicle) return <div className="container-wide pb-24 pt-40"><h1 className="text-4xl">Veículo não encontrado</h1><Link className="btn-primary mt-6" to="/estoque">Voltar ao estoque</Link></div>

  const title = `${vehicle.brand} ${vehicle.model}`.trim()
  const fullTitle = `${title} ${vehicle.version}`.trim()
  const message = `Olá! Tenho interesse no ${fullTitle}, ano ${vehicle.manufacture_year}/${vehicle.model_year}. ${window.location.href}`
  const photos = vehicle.vehicle_photos.map(photo => photo.url)
  const images = photos.length ? photos : [cover(vehicle)]
  const specs = [
    [CalendarDays, 'Fabricação / modelo', `${vehicle.manufacture_year}/${vehicle.model_year}`],
    [Gauge, 'Quilometragem', km(vehicle.mileage)],
    [Cog, 'Câmbio', vehicle.transmission],
    [Fuel, 'Combustível', vehicle.fuel],
    [Zap, 'Motor', vehicle.engine || 'Não informado'],
    [CircleDot, 'Tração', vehicle.drivetrain || 'Não informado'],
  ] as const

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: fullTitle, url: location.href })
      else {
        await navigator.clipboard.writeText(location.href)
        setCopied(true)
      }
    } catch { /* compartilhamento cancelado */ }
  }

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: fullTitle,
    vehicleModelDate: String(vehicle.model_year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: vehicle.mileage, unitCode: 'KMT' },
    offers: { '@type': 'Offer', price: vehicle.price, priceCurrency: 'BRL', availability: 'https://schema.org/InStock' },
    image: images[0],
  }

  return <>
    <SEO title={fullTitle} description={`${fullTitle} por ${money(vehicle.price)}. ${km(vehicle.mileage)}. Veja fotos e detalhes na Braza Veículos.`} image={images[0]} structured={structured} />
    <section className="container-wide pb-24 pt-36">
      <div className="mx-auto max-w-[1120px]">
        <Link to="/estoque" className="text-sm font-semibold text-primary">Estoque / {title}</Link>

        <div className="mt-5 grid items-start gap-x-8 gap-y-7 lg:grid-cols-[minmax(0,625px)_minmax(340px,1fr)]">
          <div className="min-w-0">
            <header className="mb-7 lg:hidden">
              <h1 className="text-[2rem] font-extrabold leading-tight sm:text-4xl">{title}</h1>
              {vehicle.version && <p className="mt-1 text-lg text-foreground">{vehicle.version}</p>}
              <strong className="mt-5 block font-display text-3xl text-primary sm:text-4xl">{money(vehicle.price)}</strong>
            </header>
            <VehicleGallery images={images} title={fullTitle} />
            <section className="mt-8">
              <h2 className="text-2xl text-primary">Descrição</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-foreground">{vehicle.description || 'Entre em contato para saber mais sobre este veículo.'}</p>
              {vehicle.features.length > 0 && <ul className="mt-3 space-y-1.5 text-foreground">{vehicle.features.map(feature => <li key={feature}>· {feature}</li>)}</ul>}
            </section>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-32">
            <header className="hidden lg:block">
              <h1 className="text-4xl font-extrabold leading-tight">{title}</h1>
              {vehicle.version && <p className="mt-1 text-lg text-foreground">{vehicle.version}</p>}
              <strong className="mt-8 block font-display text-4xl text-primary">{money(vehicle.price)}</strong>
            </header>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {specs.map(([Icon, label, value]) => <div key={label} className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card/60 p-3.5">
                <Icon className="mt-0.5 shrink-0 text-primary" size={18} />
                <div className="min-w-0">
                  <small className="block text-[10px] font-medium uppercase tracking-wide text-foreground/60">{label}</small>
                  <strong className="mt-1 block break-words text-sm leading-snug text-foreground">{value}</strong>
                </div>
              </div>)}
            </div>

            <a href={whatsappFor(message)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 w-full">Tenho interesse · WhatsApp <ArrowUpRight size={18} /></a>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link to={`/financie?veiculo=${vehicle.id}`} className="btn-outline w-full">Simular financiamento</Link>
              <button onClick={share} className="btn-outline w-full"><Share2 size={17} />{copied ? <><Copy size={15} /> Link copiado</> : 'Compartilhar'}</button>
            </div>
          </aside>
        </div>

        <section className="mt-20">
          <h2 className="mb-7 text-3xl">Veículos semelhantes</h2>
          <div className="grid justify-center gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),26rem))]">
            {data.filter(item => item.id !== vehicle.id && item.type === vehicle.type).slice(0, 4).map(item => <VehicleCard key={item.id} vehicle={item} />)}
          </div>
        </section>
      </div>
    </section>
  </>
}
