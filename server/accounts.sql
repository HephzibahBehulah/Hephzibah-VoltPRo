begin;
-- Apply once in the dedicated Supabase project. No browser/service-role secrets.
create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(name) between 1 and 100), kind text not null check(kind in ('schematic','breadboard','learning','plc','system')),
 data jsonb not null check(octet_length(data::text)<=1500000), version integer not null default 1,
 archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.project_revisions (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, version integer not null,
 name text not null, kind text not null, data jsonb not null, created_at timestamptz not null default now(), unique(project_id,version)
);
alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;
revoke all on public.projects, public.project_revisions from anon, authenticated;
grant select,insert,update on public.projects to authenticated;
grant select on public.project_revisions to authenticated;
create policy projects_owner_select on public.projects for select to authenticated using((select auth.uid())=user_id);
create policy projects_owner_insert on public.projects for insert to authenticated with check((select auth.uid())=user_id and version=1);
create policy projects_owner_update on public.projects for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy revisions_owner_select on public.project_revisions for select to authenticated using((select auth.uid())=user_id);
create index if not exists projects_user_updated on public.projects(user_id,updated_at desc);
create index if not exists revisions_user_project on public.project_revisions(user_id,project_id,version desc);
create or replace function public.version_project() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.user_id is distinct from old.user_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at then raise exception 'Project ownership and identity are immutable'; end if;
 insert into public.project_revisions(project_id,user_id,version,name,kind,data) values(old.id,old.user_id,old.version,old.name,old.kind,old.data);
 new.version := old.version+1; new.updated_at := now();
 return new;
end $$;
revoke all on function public.version_project() from public,anon,authenticated;
create trigger projects_version before update on public.projects for each row execute function public.version_project();

commit;
