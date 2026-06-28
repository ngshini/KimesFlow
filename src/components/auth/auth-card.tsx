import type { ReactNode } from "react";
import Link from "next/link";
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
          {children}
          <Link className="mt-5 block text-center text-sm font-medium text-blue-600 hover:text-blue-700" href={switchHref}>
            {switchLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
