-- =========================================================
-- Tasks Board — Supabase schema
-- Run this in the Supabase SQL editor (project → SQL Editor)
-- =========================================================

-- ── Profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Epics ─────────────────────────────────────────────────
create table if not exists public.epics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  color text not null default '#4263eb',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete cascade
);

alter table public.epics enable row level security;
create policy "Authenticated users can read epics" on public.epics for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert epics" on public.epics for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update epics" on public.epics for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete epics" on public.epics for delete using (auth.role() = 'authenticated');


-- ── Sprints ───────────────────────────────────────────────
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.sprints enable row level security;
create policy "Authenticated users can read sprints" on public.sprints for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert sprints" on public.sprints for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update sprints" on public.sprints for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete sprints" on public.sprints for delete using (auth.role() = 'authenticated');


-- ── Tasks ─────────────────────────────────────────────────
do $$ begin
  create type task_status as enum ('not_started', 'in_progress', 'blocked', 'done');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status task_status not null default 'not_started',
  priority task_priority not null default 'medium',
  sprint_id uuid references public.sprints(id) on delete set null,
  epic_id uuid references public.epics(id) on delete set null,
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  labels text[] not null default '{}',
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete cascade
);

create index if not exists tasks_sprint_id_idx on public.tasks(sprint_id);
create index if not exists tasks_epic_id_idx on public.tasks(epic_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);

alter table public.tasks enable row level security;
create policy "Authenticated users can read tasks" on public.tasks for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert tasks" on public.tasks for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update tasks" on public.tasks for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete tasks" on public.tasks for delete using (auth.role() = 'authenticated');


-- ── Comments ──────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete cascade
);

create index if not exists comments_task_id_idx on public.comments(task_id);

alter table public.comments enable row level security;
create policy "Authenticated users can read comments" on public.comments for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert comments" on public.comments for insert with check (auth.role() = 'authenticated');
create policy "Owners can update comments" on public.comments for update using (auth.uid() = created_by);
create policy "Owners can delete comments" on public.comments for delete using (auth.uid() = created_by);


-- ── Comment Images ────────────────────────────────────────
create table if not exists public.comment_images (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  storage_path text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.comment_images enable row level security;
create policy "Authenticated users can read images" on public.comment_images for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert images" on public.comment_images for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete images" on public.comment_images for delete using (auth.role() = 'authenticated');
