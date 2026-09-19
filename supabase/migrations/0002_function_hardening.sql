create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;
alter function public.has_role(uuid, public.app_role) set schema app_private;
revoke all on function app_private.has_role(uuid, public.app_role) from public, anon;
grant execute on function app_private.has_role(uuid, public.app_role) to authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
