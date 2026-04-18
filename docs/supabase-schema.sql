-- À coller dans Supabase → SQL Editor → New query

create table if not exists projects (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  color       text,
  "createdAt" timestamptz default now()
);

create table if not exists crs (
  id            text primary key default gen_random_uuid()::text,
  title         text,
  content       text,
  "projectId"   text references projects(id) on delete set null,
  "projectName" text,
  "meetingType" text,
  transcription text,
  config        jsonb,
  "projectColor" text,
  "audioPath"   text,
  duration      text,
  "createdAt"   timestamptz default now(),
  "updatedAt"   timestamptz
);

-- Accès public en lecture/écriture (adapter selon vos besoins de sécurité)
alter table projects enable row level security;
alter table crs enable row level security;

create policy "Accès public projects" on projects for all using (true) with check (true);
create policy "Accès public crs"      on crs      for all using (true) with check (true);
