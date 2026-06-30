create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  email text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  token text not null unique,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_invites_workspace_id on public.workspace_invites(workspace_id);
create index if not exists idx_workspace_invites_project_id on public.workspace_invites(project_id);
create index if not exists idx_workspace_invites_email on public.workspace_invites(lower(email));
create index if not exists idx_workspace_invites_token on public.workspace_invites(token);

alter table public.project_members
drop constraint if exists project_members_role_check;

update public.project_members
set role = 'admin'
where role = 'manager';

alter table public.project_members
add constraint project_members_role_check check (role in ('owner', 'admin', 'member', 'viewer'));

create or replace function public.project_role(target_project_id uuid, target_user_id uuid default auth.uid())
returns text
language sql
security definer
set search_path = public
as $$
  select pm.role
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = target_user_id
  limit 1;
$$;

create or replace function public.can_access_project(target_project_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        public.is_workspace_member(p.workspace_id, target_user_id)
        or public.project_role(target_project_id, target_user_id) is not null
      )
  );
$$;

create or replace function public.can_write_project(target_project_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        public.can_write_workspace(p.workspace_id, target_user_id)
        or public.project_role(target_project_id, target_user_id) in ('owner', 'admin', 'member')
      )
  );
$$;

create or replace function public.can_manage_project(target_project_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        public.can_manage_workspace(p.workspace_id, target_user_id)
        or public.project_role(target_project_id, target_user_id) in ('owner', 'admin')
      )
  );
$$;

alter table public.workspace_invites enable row level security;

drop policy if exists "Workspace admins can create invites" on public.workspace_invites;
create policy "Workspace admins can create invites" on public.workspace_invites
for insert with check (
  invited_by = auth.uid()
  and (
    (project_id is null and public.can_manage_workspace(workspace_id))
    or exists (
      select 1 from public.projects p
      where p.id = workspace_invites.project_id
        and p.workspace_id = workspace_invites.workspace_id
        and public.can_manage_project(p.id)
    )
  )
);

drop policy if exists "Workspace admins can read invites" on public.workspace_invites;
create policy "Workspace admins can read invites" on public.workspace_invites
for select using (
  public.can_manage_workspace(workspace_id)
  or (project_id is not null and public.can_manage_project(project_id))
  or (accepted_at is null and expires_at > now() and auth.uid() is not null)
  or (
    email is not null
    and lower(email) = lower((select p.email from public.profiles p where p.id = auth.uid()))
  )
);

drop policy if exists "Workspace admins can update invites" on public.workspace_invites;
create policy "Workspace admins can update invites" on public.workspace_invites
for update using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Workspace members can read projects" on public.projects;
create policy "Workspace members can read projects" on public.projects
for select using (
  public.is_workspace_member(projects.workspace_id)
  or exists (
    select 1 from public.project_members pm
    where pm.project_id = projects.id and pm.user_id = auth.uid()
  )
);

drop policy if exists "Project members can read project data" on public.project_members;
create policy "Project members can read project data" on public.project_members
for select using (
  user_id = auth.uid()
  or public.can_manage_project(project_members.project_id)
);

drop policy if exists "Project admins can update members" on public.project_members;
create policy "Project admins can update members" on public.project_members
for update using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

drop policy if exists "Project admins can delete members" on public.project_members;
create policy "Project admins can delete members" on public.project_members
for delete using (public.can_manage_project(project_id));

drop policy if exists "Project members can read statuses" on public.task_statuses;
create policy "Project members can read statuses" on public.task_statuses
for select using (public.can_access_project(task_statuses.project_id));

drop policy if exists "Project members can read tasks" on public.tasks;
create policy "Project members can read tasks" on public.tasks
for select using (public.can_access_project(tasks.project_id));

drop policy if exists "Workspace members can create tasks" on public.tasks;
create policy "Workspace members can create tasks" on public.tasks
for insert with check (
  created_by = auth.uid()
  and public.can_write_project(tasks.project_id)
);

drop policy if exists "Workspace members can update tasks" on public.tasks;
create policy "Workspace members can update tasks" on public.tasks
for update using (public.can_write_project(tasks.project_id))
with check (public.can_write_project(tasks.project_id));

drop policy if exists "Workspace members can delete tasks" on public.tasks;
create policy "Workspace members can delete tasks" on public.tasks
for delete using (public.can_write_project(tasks.project_id));

drop policy if exists "Project members can read subtasks" on public.subtasks;
create policy "Project members can read subtasks" on public.subtasks
for select using (
  exists (
    select 1 from public.tasks t
    where t.id = subtasks.task_id and public.can_access_project(t.project_id)
  )
);

drop policy if exists "Workspace members can create subtasks" on public.subtasks;
create policy "Workspace members can create subtasks" on public.subtasks
for insert with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.tasks t
    where t.id = subtasks.task_id and public.can_write_project(t.project_id)
  )
);

drop policy if exists "Workspace members can update subtasks" on public.subtasks;
create policy "Workspace members can update subtasks" on public.subtasks
for update using (
  exists (
    select 1 from public.tasks t
    where t.id = subtasks.task_id and public.can_write_project(t.project_id)
  )
) with check (
  exists (
    select 1 from public.tasks t
    where t.id = subtasks.task_id and public.can_write_project(t.project_id)
  )
);

drop policy if exists "Project members can read comments" on public.comments;
create policy "Project members can read comments" on public.comments
for select using (
  exists (
    select 1 from public.tasks t
    where t.id = comments.task_id and public.can_access_project(t.project_id)
  )
);

drop policy if exists "Workspace members can create comments" on public.comments;
create policy "Workspace members can create comments" on public.comments
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.tasks t
    where t.id = comments.task_id and public.can_write_project(t.project_id)
  )
);

create or replace function public.accept_workspace_invite(invite_token text)
returns table(workspace_id uuid, project_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.workspace_invites%rowtype;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into invite_row
  from public.workspace_invites wi
  where wi.token = invite_token
  limit 1;

  if invite_row.id is null then
    raise exception 'invalid_invite';
  end if;

  if invite_row.accepted_at is not null then
    raise exception 'invite_already_accepted';
  end if;

  if invite_row.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (
    invite_row.workspace_id,
    current_user_id,
    case when invite_row.project_id is null then invite_row.role else 'viewer' end
  )
  on conflict (workspace_id, user_id) do update
  set role = case
    when public.workspace_members.role = 'owner' then 'owner'
    when invite_row.project_id is null then excluded.role
    else public.workspace_members.role
  end,
  updated_at = now();

  if invite_row.project_id is not null then
    insert into public.project_members (project_id, user_id, role)
    values (invite_row.project_id, current_user_id, invite_row.role)
    on conflict (project_id, user_id) do update
    set role = excluded.role,
        updated_at = now();
  end if;

  update public.workspace_invites
  set accepted_at = now()
  where id = invite_row.id;

  return query select invite_row.workspace_id, invite_row.project_id;
end;
$$;
