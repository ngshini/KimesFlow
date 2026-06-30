"use client";

import { useState, useTransition } from "react";
import { acceptInviteAction } from "@/actions/collaboration.actions";
import { Button } from "@/components/ui/button";

type AcceptInviteButtonProps = {
  token: string;
  disabled?: boolean;
};

export function AcceptInviteButton({ token, disabled }: AcceptInviteButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        disabled={disabled || isPending}
        type="button"
        onClick={() => {
          const formData = new FormData();
          formData.set("token", token);
          setError(null);
          startTransition(async () => {
            const result = await acceptInviteAction(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        {isPending ? "Đang tham gia..." : "Tham gia"}
      </Button>
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
