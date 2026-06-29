alter table public.profiles
add column if not exists email text;

alter table public.tasks
add column if not exists created_by uuid references public.profiles(id) on delete set null;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

update public.tasks
set created_by = reporter_id
where created_by is null
  and reporter_id is not null;

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_tasks_created_by on public.tasks(created_by);

create or replace function public.shares_workspace_with(target_user_id uuid, viewer_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members viewer
    join public.workspace_members target on target.workspace_id = viewer.workspace_id
    where viewer.user_id = viewer_user_id
      and target.user_id = target_user_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop policy if exists "Workspace members can create tasks" on public.tasks;
create policy "Workspace members can create tasks" on public.tasks
for insert with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and public.can_write_workspace(p.workspace_id)
  )
);

drop policy if exists "Workspace admins can delete projects" on public.projects;
create policy "Workspace admins can delete projects" on public.projects
for delete using (public.can_manage_workspace(projects.workspace_id));

drop policy if exists "Workspace members can read member profiles" on public.profiles;
create policy "Workspace members can read member profiles" on public.profiles
for select using (
  auth.uid() = id
  or public.shares_workspace_with(profiles.id)
);

drop policy if exists "Members can read workspace memberships" on public.workspace_members;
create policy "Members can read workspace memberships" on public.workspace_members
for select using (
  public.is_workspace_member(workspace_members.workspace_id)
);

drop policy if exists "Authenticated users can read task files" on storage.objects;
create policy "Workspace members can read task files" on storage.objects
for select to authenticated
using (
  bucket_id = 'task-attachments'
  and exists (
    select 1
    from public.attachments a
    left join public.tasks t on t.id = a.task_id
    left join public.comments c on c.id = a.comment_id
    left join public.tasks ct on ct.id = c.task_id
    left join public.projects p on p.id = coalesce(t.project_id, ct.project_id)
    where a.file_url = storage.objects.name
      and p.workspace_id is not null
      and public.is_workspace_member(p.workspace_id)
  )
);
