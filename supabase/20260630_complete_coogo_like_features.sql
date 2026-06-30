alter table public.profiles
add column if not exists phone text,
add column if not exists zalo_user_id text;

alter table public.projects
add column if not exists owner_id uuid references public.profiles(id) on delete set null,
add column if not exists created_by uuid references public.profiles(id) on delete set null,
add column if not exists start_date date,
add column if not exists end_date date,
add column if not exists status text not null default 'active';

alter table public.task_statuses
add column if not exists is_default boolean not null default false;

alter table public.tasks
add column if not exists start_date date,
add column if not exists completed_at timestamptz;

alter table public.subtasks
add column if not exists description text,
add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.attachments
add column if not exists file_path text,
add column if not exists mime_type text;

alter table public.notifications
add column if not exists type text,
add column if not exists message text,
add column if not exists status text,
add column if not exists read_at timestamptz;

update public.projects
set owner_id = coalesce(owner_id, pm.user_id),
    created_by = coalesce(created_by, pm.user_id)
from public.project_members pm
where pm.project_id = projects.id
  and pm.role = 'owner'
  and (projects.owner_id is null or projects.created_by is null);

update public.attachments
set file_path = coalesce(file_path, file_url),
    mime_type = coalesce(mime_type, file_type);

update public.notifications
set type = coalesce(type, channel),
    message = coalesce(message, body),
    status = coalesce(status, case when is_read then 'read' else delivery_status end),
    read_at = case when is_read and read_at is null then created_at else read_at end;

create index if not exists idx_profiles_zalo_user_id on public.profiles(zalo_user_id);
create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_projects_created_by on public.projects(created_by);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_start_date on public.tasks(start_date);
create index if not exists idx_tasks_completed_at on public.tasks(completed_at);
create index if not exists idx_subtasks_created_by on public.subtasks(created_by);
create index if not exists idx_notifications_channel on public.notifications(channel);
create index if not exists idx_notifications_status on public.notifications(status);
create index if not exists idx_notifications_read_at on public.notifications(read_at);

alter table public.projects
drop constraint if exists projects_status_check;
alter table public.projects
add constraint projects_status_check check (status in ('planned', 'active', 'paused', 'completed', 'archived'));

alter table public.notifications
drop constraint if exists notifications_channel_check;
alter table public.notifications
add constraint notifications_channel_check check (channel in ('app', 'in_app', 'telegram', 'zalo'));

alter table public.notifications
drop constraint if exists notifications_status_check;
alter table public.notifications
add constraint notifications_status_check check (status is null or status in ('pending', 'sent', 'failed', 'read'));

alter table public.attachments
drop constraint if exists attachments_owner_check;
alter table public.attachments
add constraint attachments_owner_check check (task_id is not null or comment_id is not null);

drop policy if exists "Workspace admins can update projects" on public.projects;
create policy "Workspace admins can update projects" on public.projects
for update using (public.can_manage_workspace(projects.workspace_id))
with check (public.can_manage_workspace(projects.workspace_id));

drop policy if exists "Workspace members can update statuses" on public.task_statuses;
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

drop policy if exists "Workspace members can delete empty statuses" on public.task_statuses;
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

drop policy if exists "Workspace members can create subtasks" on public.subtasks;
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

drop policy if exists "Workspace members can update subtasks" on public.subtasks;
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

drop policy if exists "Workspace members can delete subtasks" on public.subtasks;
create policy "Workspace members can delete subtasks" on public.subtasks
for delete using (
  exists (
    select 1 from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = subtasks.task_id
      and public.can_write_workspace(p.workspace_id)
  )
);
