-- Add the cross-workspace envelope without changing ownership or RLS rules.
begin;
alter table public.projects drop constraint if exists projects_kind_check;
alter table public.projects add constraint projects_kind_check check(kind in ('schematic','breadboard','learning','plc','system'));
commit;
select 'PASS: system project kind enabled; ownership policies unchanged.' as result;
