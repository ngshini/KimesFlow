create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  zalo_user_id text,
  telegram_chat_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  color text,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('planned', 'active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'manager', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.task_statuses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  color text,
  position integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status_id uuid not null references public.task_statuses(id) on delete restrict,
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  reporter_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  start_date date,
  due_date date,
  completed_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  is_completed boolean not null default false,
  position integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_url text not null,
  file_path text,
  file_name text not null,
  file_type text,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  constraint attachments_owner_check check (task_id is not null or comment_id is not null)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  body text,
  type text,
  message text,
  channel text not null default 'in_app' check (channel in ('app', 'in_app', 'telegram', 'zalo')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  status text check (status is null or status in ('pending', 'sent', 'failed', 'read')),
  error_message text,
  sent_at timestamptz,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_workspaces_owner_id on public.workspaces(owner_id);
create index idx_profiles_email on public.profiles(email);
create index idx_profiles_zalo_user_id on public.profiles(zalo_user_id);
create index idx_workspace_members_workspace_id on public.workspace_members(workspace_id);
create index idx_workspace_members_user_id on public.workspace_members(user_id);
create index idx_projects_workspace_id on public.projects(workspace_id);
create index idx_projects_owner_id on public.projects(owner_id);
create index idx_projects_created_by on public.projects(created_by);
create index idx_projects_status on public.projects(status);
create index idx_project_members_project_id on public.project_members(project_id);
create index idx_project_members_user_id on public.project_members(user_id);
create index idx_task_statuses_project_id on public.task_statuses(project_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_status_id on public.tasks(status_id);
create index idx_tasks_assignee_id on public.tasks(assignee_id);
create index idx_tasks_created_by on public.tasks(created_by);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_tasks_start_date on public.tasks(start_date);
create index idx_tasks_completed_at on public.tasks(completed_at);
create index idx_subtasks_task_id on public.subtasks(task_id);
create index idx_subtasks_created_by on public.subtasks(created_by);
create index idx_comments_task_id on public.comments(task_id);
create index idx_comments_user_id on public.comments(user_id);
create index idx_attachments_task_id on public.attachments(task_id);
create index idx_attachments_comment_id on public.attachments(comment_id);
create index idx_activity_logs_workspace_id on public.activity_logs(workspace_id);
create index idx_activity_logs_project_id on public.activity_logs(project_id);
create index idx_activity_logs_task_id on public.activity_logs(task_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_channel on public.notifications(channel);
create index idx_notifications_status on public.notifications(status);
create index idx_notifications_read_at on public.notifications(read_at);

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger set_workspace_members_updated_at before update on public.workspace_members for each row execute function public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger set_project_members_updated_at before update on public.project_members for each row execute function public.set_updated_at();
create trigger set_task_statuses_updated_at before update on public.task_statuses for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger set_subtasks_updated_at before update on public.subtasks for each row execute function public.set_updated_at();
create trigger set_comments_updated_at before update on public.comments for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = target_user_id
  );
$$;

create or replace function public.workspace_role(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns text
language sql
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = target_user_id
  limit 1;
$$;

create or replace function public.can_write_workspace(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(public.workspace_role(target_workspace_id, target_user_id) in ('owner', 'admin', 'member'), false);
$$;

create or replace function public.can_manage_workspace(target_workspace_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(public.workspace_role(target_workspace_id, target_user_id) in ('owner', 'admin'), false);
$$;

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

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.task_statuses enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Workspace members can read member profiles" on public.profiles
for select using (auth.uid() = id or public.shares_workspace_with(profiles.id));
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Workspace members can read workspaces" on public.workspaces
for select using (
  owner_id = auth.uid()
  or public.is_workspace_member(workspaces.id)
);

create policy "Users can create owned workspaces" on public.workspaces
for insert with check (owner_id = auth.uid());

create policy "Owners can manage workspaces" on public.workspaces for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Members can read workspace memberships" on public.workspace_members
for select using (
  public.is_workspace_member(workspace_members.workspace_id)
);

create policy "Workspace admins can update members" on public.workspace_members
for update using (public.can_manage_workspace(workspace_members.workspace_id))
with check (public.can_manage_workspace(workspace_members.workspace_id));

create policy "Workspace admins can delete members" on public.workspace_members
for delete using (public.can_manage_workspace(workspace_members.workspace_id));

create policy "Workspace owners can insert own owner membership" on public.workspace_members
for insert with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1 from public.workspaces w
    where w.id = workspace_members.workspace_id and w.owner_id = auth.uid()
  )
);

create policy "Workspace members can read projects" on public.projects
for select using (
  public.is_workspace_member(projects.workspace_id)
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = projects.id and pm.user_id = auth.uid()
  )
);

create policy "Workspace members can create projects" on public.projects
for insert with check (public.can_write_workspace(projects.workspace_id));

create policy "Workspace admins can update projects" on public.projects
for update using (public.can_manage_workspace(projects.workspace_id))
with check (public.can_manage_workspace(projects.workspace_id));

create policy "Workspace admins can delete projects" on public.projects
for delete using (public.can_manage_workspace(projects.workspace_id));

create policy "Project members can read project data" on public.project_members for select using (user_id = auth.uid());

create policy "Project creators can insert own owner membership" on public.project_members
for insert with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1 from public.projects p
    where p.id = project_members.project_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Project members can read statuses" on public.task_statuses
for select using (
  exists (
    select 1 from public.projects p
    where p.id = task_statuses.project_id and public.is_workspace_member(p.workspace_id)
  )
);

create policy "Workspace members can create statuses" on public.task_statuses
for insert with check (
  exists (
    select 1 from public.projects p
    where p.id = task_statuses.project_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Workspace members can update statuses" on public.task_statuses
for update using (
  exists (
    select 1 from public.projects p
    where p.id = task_statuses.project_id
      and public.can_manage_workspace(p.workspace_id)
  )
) with check (
  exists (
    select 1 from public.projects p
    where p.id = task_statuses.project_id
      and public.can_manage_workspace(p.workspace_id)
  )
);

create policy "Workspace members can delete empty statuses" on public.task_statuses
for delete using (
  exists (
    select 1 from public.projects p
    where p.id = task_statuses.project_id
      and public.can_manage_workspace(p.workspace_id)
  )
  and not exists (
    select 1 from public.tasks t
    where t.status_id = task_statuses.id
  )
);

create policy "Project members can read tasks" on public.tasks
for select using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id and public.is_workspace_member(p.workspace_id)
  )
);

create policy "Workspace members can create tasks" on public.tasks
for insert with check (
  created_by = auth.uid()
  and
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Workspace members can update tasks" on public.tasks
for update using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and public.can_write_workspace(p.workspace_id)
  )
) with check (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Workspace members can delete tasks" on public.tasks
for delete using (
  exists (
    select 1 from public.projects p
    where p.id = tasks.project_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Project members can read subtasks" on public.subtasks
for select using (
  exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = subtasks.task_id and public.is_workspace_member(p.workspace_id)
  )
);

create policy "Workspace members can create subtasks" on public.subtasks
for insert with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = subtasks.task_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Workspace members can update subtasks" on public.subtasks
for update using (
  exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = subtasks.task_id
      and public.can_write_workspace(p.workspace_id)
  )
) with check (
  exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = subtasks.task_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Workspace members can delete subtasks" on public.subtasks
for delete using (
  exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = subtasks.task_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Project members can read comments" on public.comments
for select using (
  exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = comments.task_id and public.is_workspace_member(p.workspace_id)
  )
);

create policy "Workspace members can create comments" on public.comments
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = comments.task_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Project members can read attachments" on public.attachments
for select using (
  exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = attachments.task_id and public.is_workspace_member(p.workspace_id)
  )
  or exists (
    select 1 from public.comments c
    join public.tasks t on t.id = c.task_id
    join public.projects p on p.id = t.project_id
    where c.id = attachments.comment_id and public.is_workspace_member(p.workspace_id)
  )
);

create policy "Workspace members can create task attachments" on public.attachments
for insert with check (
  uploaded_by = auth.uid()
  and task_id is not null
  and exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = attachments.task_id
      and public.can_write_workspace(p.workspace_id)
  )
);

create policy "Workspace members can read activity logs" on public.activity_logs
for select using (activity_logs.workspace_id is not null and public.is_workspace_member(activity_logs.workspace_id));

create policy "Workspace members can create activity logs" on public.activity_logs
for insert with check (
  user_id = auth.uid()
  and activity_logs.workspace_id is not null
  and public.can_write_workspace(activity_logs.workspace_id)
);

create policy "Users can read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users can update own notifications" on public.notifications for update using (user_id = auth.uid());
create policy "Workspace members can create notifications" on public.notifications
for insert with check (
  notifications.workspace_id is not null
  and public.can_write_workspace(notifications.workspace_id)
);

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload task files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'task-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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
