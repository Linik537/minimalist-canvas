import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { PublicLayout } from './components/Layout'
import './styles.css'
const Home=lazy(()=>import('./pages/Home'))
const Inventory=lazy(()=>import('./pages/Inventory'))
const VehiclePage=lazy(()=>import('./pages/VehiclePage'))
const About=lazy(()=>import('./pages/About'))
const Sell=lazy(()=>import('./pages/Sell'))
const Finance=lazy(()=>import('./pages/Finance'))
const Privacy=lazy(()=>import('./pages/Privacy'))
const NotFound=lazy(()=>import('./pages/NotFound'))
const Admin=lazy(()=>import('./pages/admin/Admin'))
const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:30000,retry:1}}})
const router=createBrowserRouter([
  {element:<PublicLayout/>,children:[
    {index:true,element:<Home/>},{path:'estoque',element:<Inventory/>},{path:'estoque/:slug',element:<VehiclePage/>},
    {path:'sobre',element:<About/>},{path:'venda-seu-veiculo',element:<Sell/>},{path:'financie',element:<Finance/>},
    {path:'privacidade',element:<Privacy/>},{path:'*',element:<NotFound/>}
  ]},
  {path:'admin/*',element:<Admin/>}
])
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><HelmetProvider><QueryClientProvider client={queryClient}><Suspense fallback={<div className="skeleton min-h-screen"/>}><RouterProvider router={router}/></Suspense></QueryClientProvider></HelmetProvider></React.StrictMode>)
