# Kimes Flow

Next.js SaaS scaffold for project and task management, inspired by Coogo Flow.

## Tech Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Auth, Database, Storage, Realtime-ready schema
- dnd-kit for Kanban drag and drop
- Recharts for dashboard charts
- lucide-react icons
- zod and react-hook-form-ready validation schemas
- date-fns for date formatting

## Install

```bash
npm install
```

## Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=optional-default-chat-id
TELEGRAM_REMINDER_SECRET=optional-secret-for-reminder-route
```

Restart `npm run dev` after changing `.env.local`; Next.js only reads these values when the dev server starts.

`TELEGRAM_BOT_TOKEN` is required only for Telegram delivery. Task creation/update still succeeds if Telegram is not configured; notification history will be stored as `failed`.

## Google Login

Enable Google OAuth before using the Google login button:

1. Open Supabase Dashboard > Authentication > Providers > Google.
2. Enable Google and add your Google OAuth Client ID and Client Secret.
3. Add this redirect URL in Google Cloud OAuth and Supabase:

```text
http://localhost:3000/auth/callback
```

For Vercel, also add your deployed callback URL:

```text
https://your-vercel-domain.vercel.app/auth/callback
```

## Run Local

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Schema

1. Create a Supabase project.
2. Open SQL Editor.
3. Paste the contents of `supabase/schema.sql`.
4. Run the script.
5. Create a Storage bucket named `task-attachments` when implementing real uploads.

The schema includes a trigger on `auth.users` that creates the matching row in `public.profiles` after sign up. Re-run the schema or apply the trigger section if you already created the database before the auth implementation.

## Authentication

- Supabase Auth is wired through `@supabase/ssr`.
- `middleware.ts` refreshes the session and protects `/dashboard`, `/workspaces`, `/projects` and `/tasks`.
- Unauthenticated users are redirected to `/login`.
- Authenticated users visiting `/login` or `/register` are redirected to `/dashboard`.
- Login and register forms use `react-hook-form` with Zod validation.

## Available Pages

- `/login`
- `/register`
- `/dashboard`
- `/workspaces`
- `/projects`
- `/projects/[projectId]`
- `/tasks/[taskId]`

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

## Phase 2

- Replace mock data with Supabase queries and server actions.
- Add middleware session refresh and protected dashboard routes.
- Implement CRUD for workspace, project, task, subtask and comments.
- Add Supabase Storage uploads for attachments.
- Add realtime comments, Kanban updates and notifications.
- Add tests for forms, server actions and critical user flows.
