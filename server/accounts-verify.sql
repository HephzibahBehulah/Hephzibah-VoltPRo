-- Temporary fixtures roll back completely; this script sends no emails.
begin;
insert into auth.users(id,aud,role,email) values
 ('00000000-0000-4000-8000-0000000000a1','authenticated','authenticated','voltpro-rls-a@example.invalid'),
 ('00000000-0000-4000-8000-0000000000b2','authenticated','authenticated','voltpro-rls-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
insert into public.projects(id,user_id,name,kind,data) values
 ('00000000-0000-4000-8000-0000000000c3','00000000-0000-4000-8000-0000000000a1','RLS verification','schematic','{"components":[],"wires":[]}');
update public.projects set name='RLS revision two' where id='00000000-0000-4000-8000-0000000000c3' and version=1;
do $$ begin
 if not exists(select 1 from public.projects where id='00000000-0000-4000-8000-0000000000c3' and version=2) then raise exception 'Owner update/version failed'; end if;
 if not exists(select 1 from public.project_revisions where project_id='00000000-0000-4000-8000-0000000000c3' and version=1) then raise exception 'Revision capture failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000b2',true);
do $$ begin
 if exists(select 1 from public.projects where id='00000000-0000-4000-8000-0000000000c3') then raise exception 'Cross-user project leak'; end if;
 if exists(select 1 from public.project_revisions where project_id='00000000-0000-4000-8000-0000000000c3') then raise exception 'Cross-user revision leak'; end if;
 update public.projects set name='Unauthorized' where id='00000000-0000-4000-8000-0000000000c3';
 if found then raise exception 'Cross-user update allowed'; end if;
 begin
  insert into public.projects(user_id,name,kind,data) values('00000000-0000-4000-8000-0000000000a1','Spoof','plc','{}');
  raise exception 'Ownership spoof allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
set local role anon;
do $$ begin
 begin
  perform id from public.projects limit 1;
  raise exception 'Anonymous project access allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;
select 'PASS: owner updates, revision capture, cross-user isolation, ownership spoof rejection, anonymous denial; fixtures rolled back.' as verification;
