import { useEffect, useRef, useState, type ReactNode } from 'react'
export function Reveal({children,className=''}:{children:ReactNode;className?:string}){
  const ref=useRef<HTMLDivElement>(null)
  const [visible,setVisible]=useState(false)
  useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){setVisible(true);return}const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting){setVisible(true);observer.disconnect()}},{threshold:.08});observer.observe(node);return()=>observer.disconnect()},[])
  return <div ref={ref} className={`reveal ${visible?'reveal-visible':''} ${className}`}>{children}</div>
}
