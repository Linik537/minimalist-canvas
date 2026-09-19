import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'
export default function NotFound(){return <div className="container-wide flex min-h-[70vh] flex-col items-center justify-center pt-28 text-center"><SEO title="Página não encontrada" description="Esta página não foi encontrada."/><span className="font-display text-8xl font-extrabold text-primary">404</span><h1 className="mt-4 text-4xl">Pegamos outro caminho</h1><p className="mt-3 text-foreground/65">A página que você procura não está aqui.</p><Link className="btn-primary mt-8" to="/">Voltar ao início</Link></div>}
