import type { ReactNode } from "react";
import Link from "next/link";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  switchHref: string;
  switchLabel: string;
  children: ReactNode;
};

export function AuthCard({ title, description, switchHref, switchLabel, children }: AuthCardProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </CardHeader>
        <CardContent>
          <GoogleAuthButton />
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">hoặc</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          {children}
          <Link className="mt-5 block text-center text-sm font-medium text-blue-600 hover:text-blue-700" href={switchHref}>
            {switchLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
