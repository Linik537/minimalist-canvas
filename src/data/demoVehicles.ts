import type { Vehicle } from '../lib/vehicles'
const samples: [string,string,string,number,number,number,'carro'|'moto'][] = [
  ['Volkswagen','Gol','1.0 Flex',2020,47000,45900,'carro'],
  ['Honda','CG 160 Titan','Flex',2022,18000,17900,'moto'],
  ['Fiat','Argo','Drive 1.0',2021,39000,59900,'carro'],
  ['Chevrolet','Onix','LT 1.0',2020,51000,61900,'carro'],
  ['Yamaha','Fazer 250','ABS',2023,12000,23900,'moto'],
  ['Hyundai','HB20','Comfort 1.0',2021,33000,62900,'carro'],
  ['Renault','Kwid','Zen 1.0',2022,28000,47900,'carro'],
  ['Honda','Biz 125','ES',2021,16000,13900,'moto'],
  ['Fiat','Mobi','Like 1.0',2022,27000,48900,'carro'],
  ['Volkswagen','Polo','MPI 1.0',2020,44000,65900,'carro'],
  ['Honda','NXR 160 Bros','ESDD',2022,21000,20900,'moto'],
  ['Chevrolet','Prisma','LT 1.4',2019,55000,56900,'carro']
]
export const demoVehicles: Vehicle[] = samples.map(([brand,model,version,year,mileage,price,type],i) => ({
  id: `demo-${i}`, slug: `${brand}-${model}-${year}-demo-${i}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-'),
  type,brand,model,version,manufacture_year:year,model_year:year,price,mileage,color:'Prata',engine:type==='moto'?'160cc':'1.0 Flex',
  drivetrain:type==='moto'?'Não se aplica':'Dianteira',fuel:'Flex',transmission:'Manual',
  description:'Veículo seminovo em ótimo estado. Entre em contato para saber mais.',features:['Revisado','Documentação em dia'],
  status:'disponivel',featured:i<4,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),
  vehicle_photos:[{id:`demo-photo-${i}`,vehicle_id:`demo-${i}`,url:`/images/${type==='moto'?'categoria-motos':'categoria-carros'}.svg`,storage_path:'',position:0,created_at:new Date().toISOString()}]
}))
