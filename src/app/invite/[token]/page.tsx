import Link from "next/link";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "@/components/collaboration/accept-invite-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { routes } from "@/constants/routes";
import { getInviteByToken } from "@/lib/data/collaboration";
import { createClient } from "@/lib/supabase/server";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`${routes.login}?next=/invite/${token}`);

  const invite = await getInviteByToken(token);
  const isInvalid = !invite;
  const isExpired = Boolean(invite?.isExpired);
  const isAccepted = Boolean(invite?.acceptedAt);
  const disabled = isInvalid || isExpired || isAccepted;

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl items-center">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-xl font-semibold text-slate-950">Lời mời tham gia KimesFlow</h1>
            <p className="mt-1 text-sm text-slate-500">Đăng nhập xong, bạn có thể tham gia workspace hoặc project được mời.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {isInvalid ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Invite không hợp lệ hoặc bạn không có quyền xem invite này.</p>
            ) : (
              <>
                <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Workspace</p>
                    <p className="mt-1 text-sm font-medium text-slate-950">{invite.workspaceName}</p>
                  </div>
                  {invite.projectName ? (
                    <div>
                      <p className="text-xs uppercase text-slate-400">Project</p>
                      <p className="mt-1 text-sm font-medium text-slate-950">{invite.projectName}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs uppercase text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-medium text-slate-950">{invite.role}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Người mời</p>
                    <p className="mt-1 text-sm font-medium text-slate-950">{invite.invitedBy}</p>
                  </div>
                </div>
                {isExpired ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">Invite đã hết hạn.</p> : null}
                {isAccepted ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">Invite đã được sử dụng.</p> : null}
                <AcceptInviteButton disabled={disabled} token={token} />
              </>
            )}
            <Link className="inline-flex text-sm font-medium text-slate-500 hover:text-slate-900" href={routes.dashboard}>
              Về dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
