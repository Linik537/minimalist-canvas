-- Impede que uma solicitação anexe metadados de fotos de outra solicitação.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sell_request_photos_path_matches_request'
      and conrelid = 'public.sell_request_photos'::regclass
  ) then
    alter table public.sell_request_photos
      add constraint sell_request_photos_path_matches_request
      check (storage_path like 'public/' || request_id::text || '/%');
  end if;
end $$;

drop policy if exists "public sell photo insert" on public.sell_request_photos;
create policy "public sell photo insert" on public.sell_request_photos
  for insert to anon, authenticated
  with check (storage_path like 'public/' || request_id::text || '/%');
