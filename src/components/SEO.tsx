import { Helmet } from 'react-helmet-async'
import { site } from '../config/site'
export function SEO({title,description,image,noindex,structured}:{title:string;description:string;image?:string;noindex?:boolean;structured?:object}) {
  const ogImage=new URL(image || '/images/banner-braza.jpg',window.location.origin).href
  return <Helmet><title>{title} | {site.name}</title><meta name="description" content={description}/><meta property="og:title" content={title}/><meta property="og:description" content={description}/><meta property="og:image" content={ogImage}/><meta property="og:url" content={window.location.href}/><meta property="og:type" content="website"/>{noindex&&<meta name="robots" content="noindex,nofollow"/>}{structured&&<script type="application/ld+json">{JSON.stringify(structured)}</script>}</Helmet>
}
