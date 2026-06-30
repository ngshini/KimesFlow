"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { loginAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";

export function LoginForm({ next = "" }: { next?: string }) {
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(loginAction, {} satisfies AuthActionState);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isPending = isTransitionPending || isActionPending;

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit((values) => {
        const formData = new FormData();
        formData.set("email", values.email);
        formData.set("password", values.password);
        formData.set("next", next);

        startTransition(() => {
          formAction(formData);
        });
      })}
    >
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      <input name="next" type="hidden" value={next} />
      <div className="space-y-1.5">
        <Input autoComplete="email" placeholder="Email" type="email" {...register("email")} />
        {errors.email?.message ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Input autoComplete="current-password" placeholder="Mật khẩu" type="password" {...register("password")} />
        {errors.password?.message ? <p className="text-xs text-rose-600">{errors.password.message}</p> : null}
      </div>
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
