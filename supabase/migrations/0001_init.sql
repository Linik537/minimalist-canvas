create extension if not exists pgcrypto;
do $$ begin create type public.app_role as enum ('admin'); exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select _user_id = (select auth.uid()) and exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type text not null check (type in ('carro','moto')),
  brand text not null check (char_length(brand) between 1 and 80),
  model text not null check (char_length(model) between 1 and 80),
  version text not null default '' check (char_length(version) <= 100),
  manufacture_year int not null check (manufacture_year between 1950 and 2100),
  model_year int not null check (model_year between 1950 and 2101),
  price numeric(12,2) not null check (price > 0),
  mileage int not null default 0 check (mileage >= 0),
  color text not null default '' check (char_length(color) <= 50),
  engine text not null default '' check (char_length(engine) <= 100),
  drivetrain text not null default 'Não se aplica' check (drivetrain in ('Dianteira','Traseira','4x4','Integral','Não se aplica')),
  fuel text not null default 'Flex' check (fuel in ('Flex','Gasolina','Etanol','Diesel','Elétrico','Híbrido')),
  transmission text not null default 'Manual' check (transmission in ('Manual','Automático','Automatizado','CVT')),
  description text not null default '' check (char_length(description) <= 10000),
  features text[] not null default '{}',
  status text not null default 'disponivel' check (status in ('disponivel','vendido')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vehicles_status_idx on public.vehicles(status);
create index if not exists vehicles_type_idx on public.vehicles(type);
create index if not exists vehicles_brand_idx on public.vehicles(brand);
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists vehicles_updated_at on public.vehicles;
create trigger vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

create table if not exists public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null,
  storage_path text not null unique,
  position int not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);
create index if not exists vehicle_photos_vehicle_idx on public.vehicle_photos(vehicle_id, position);

create table if not exists public.sell_requests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('carro','moto')),
  brand text not null check (char_length(brand) between 1 and 80),
  model text not null check (char_length(model) between 1 and 80),
  year int not null check (year between 1950 and 2100),
  mileage int not null check (mileage >= 0),
  color text not null check (char_length(color) between 1 and 50),
  asking_price numeric(12,2) not null check (asking_price > 0),
  name text not null check (char_length(name) between 2 and 120),
  whatsapp text not null check (char_length(whatsapp) between 10 and 20),
  email text check (email is null or char_length(email) <= 254),
  notes text check (notes is null or char_length(notes) <= 3000),
  consent boolean not null check (consent = true),
  contacted boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.sell_request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.sell_requests(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.financing_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  whatsapp text not null check (char_length(whatsapp) between 10 and 20),
  email text check (email is null or char_length(email) <= 254),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_text text check (vehicle_text is null or char_length(vehicle_text) <= 150),
  amount numeric(12,2) not null check (amount > 0),
  down_payment numeric(12,2) not null check (down_payment >= 0),
  installments int not null check (installments in (12,24,36,48,60)),
  consent boolean not null check (consent = true),
  contacted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.sell_requests enable row level security;
alter table public.sell_request_photos enable row level security;
alter table public.financing_requests enable row level security;

create policy "own role read" on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
create policy "public vehicle read" on public.vehicles for select to anon, authenticated using (true);
create policy "admin vehicle insert" on public.vehicles for insert to authenticated with check (public.has_role((select auth.uid()), 'admin'));
create policy "admin vehicle update" on public.vehicles for update to authenticated using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "admin vehicle delete" on public.vehicles for delete to authenticated using (public.has_role((select auth.uid()), 'admin'));
create policy "public photo read" on public.vehicle_photos for select to anon, authenticated using (true);
create policy "admin photo insert" on public.vehicle_photos for insert to authenticated with check (public.has_role((select auth.uid()), 'admin'));
create policy "admin photo update" on public.vehicle_photos for update to authenticated using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "admin photo delete" on public.vehicle_photos for delete to authenticated using (public.has_role((select auth.uid()), 'admin'));
create policy "public sell lead insert" on public.sell_requests for insert to anon, authenticated with check (consent = true and contacted = false);
create policy "admin sell lead manage" on public.sell_requests for all to authenticated using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "public sell photo insert" on public.sell_request_photos for insert to anon, authenticated with check (true);
create policy "admin sell photo manage" on public.sell_request_photos for all to authenticated using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
create policy "public finance lead insert" on public.financing_requests for insert to anon, authenticated with check (consent = true and contacted = false);
create policy "admin finance lead manage" on public.financing_requests for all to authenticated using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));

grant select on public.vehicles, public.vehicle_photos to anon, authenticated;
grant insert, update, delete on public.vehicles, public.vehicle_photos to authenticated;
grant select on public.user_roles to authenticated;
grant insert on public.sell_requests, public.sell_request_photos, public.financing_requests to anon, authenticated;
grant select, update, delete on public.sell_requests, public.sell_request_photos, public.financing_requests to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('vehicle-photos','vehicle-photos',true,10485760,array['image/jpeg','image/png','image/webp']),
       ('sell-requests','sell-requests',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "public vehicle storage read" on storage.objects for select to anon, authenticated using (bucket_id = 'vehicle-photos');
create policy "admin vehicle storage insert" on storage.objects for insert to authenticated with check (bucket_id = 'vehicle-photos' and public.has_role((select auth.uid()), 'admin'));
create policy "admin vehicle storage update" on storage.objects for update to authenticated using (bucket_id = 'vehicle-photos' and public.has_role((select auth.uid()), 'admin')) with check (bucket_id = 'vehicle-photos' and public.has_role((select auth.uid()), 'admin'));
create policy "admin vehicle storage delete" on storage.objects for delete to authenticated using (bucket_id = 'vehicle-photos' and public.has_role((select auth.uid()), 'admin'));
create policy "public sell storage upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'sell-requests' and (storage.foldername(name))[1] = 'public' and lower(storage.extension(name)) in ('jpg','jpeg','png','webp'));
create policy "admin sell storage read" on storage.objects for select to authenticated using (bucket_id = 'sell-requests' and public.has_role((select auth.uid()), 'admin'));
create policy "admin sell storage delete" on storage.objects for delete to authenticated using (bucket_id = 'sell-requests' and public.has_role((select auth.uid()), 'admin'));
