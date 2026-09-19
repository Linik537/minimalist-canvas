import { useEffect, useState } from 'react'
export function useAutoRotate(count:number) {
  const [active,setActive]=useState(0)
  const [paused,setPaused]=useState(false)
  const [reduced,setReduced]=useState(false)
  const [reset,setReset]=useState(0)
  useEffect(()=>{const m=matchMedia('(prefers-reduced-motion: reduce)'); const update=()=>setReduced(m.matches); update();m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[])
  useEffect(()=>{if(count<2||paused||reduced)return;const timer=setInterval(()=>setActive(a=>(a+1)%count),4000);return()=>clearInterval(timer)},[count,paused,reduced,reset])
  const select=(index:number)=>{setActive((index+count)%count);setReset(x=>x+1)}
  return {active,select,setPaused}
}
