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

drop policy if exists "Members can read workspace memberships" on public.workspace_members;
create policy "Members can read workspace memberships" on public.workspace_members
for select using (
  user_id = auth.uid()
);

drop policy if exists "Workspace admins can manage members" on public.workspace_members;
drop policy if exists "Workspace admins can update members" on public.workspace_members;
drop policy if exists "Workspace admins can delete members" on public.workspace_members;

create policy "Workspace admins can update members" on public.workspace_members
for update using (public.can_manage_workspace(workspace_members.workspace_id))
with check (public.can_manage_workspace(workspace_members.workspace_id));

create policy "Workspace admins can delete members" on public.workspace_members
for delete using (public.can_manage_workspace(workspace_members.workspace_id));

drop policy if exists "Workspace members can read workspaces" on public.workspaces;
create policy "Workspace members can read workspaces" on public.workspaces
for select using (
  owner_id = auth.uid()
  or public.is_workspace_member(workspaces.id)
);
