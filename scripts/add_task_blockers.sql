-- Migration: add task_blockers table for "blocked by" relationships
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.task_blockers (
  id               uuid primary key default gen_random_uuid(),
  blocked_task_id  uuid not null references public.tasks(id) on delete cascade,
  blocking_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at       timestamptz not null default now(),
  created_by       uuid not null references auth.users(id),
  unique (blocked_task_id, blocking_task_id),
  check  (blocked_task_id <> blocking_task_id)
);

alter table public.task_blockers enable row level security;

create policy "Authenticated users can view task_blockers"
  on public.task_blockers for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert task_blockers"
  on public.task_blockers for insert
  with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy "Authenticated users can delete task_blockers"
  on public.task_blockers for delete
  using (auth.role() = 'authenticated');
