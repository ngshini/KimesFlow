"use client";

import { useFormStatus } from "react-dom";
import { googleLoginAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full border-slate-300" disabled={pending} type="submit" variant="secondary">
      <span className="flex size-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700">
        G
      </span>
      {pending ? "Đang chuyển đến Google..." : "Tiếp tục với Google"}
    </Button>
  );
}

export function GoogleAuthButton({ next = "" }: { next?: string }) {
  return (
    <form action={googleLoginAction}>
      <input name="next" type="hidden" value={next} />
      <GoogleSubmitButton />
    </form>
  );
}
