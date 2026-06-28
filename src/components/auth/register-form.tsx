"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { registerAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth.schema";

export function RegisterForm() {
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(registerAction, {} satisfies AuthActionState);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
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
        formData.set("fullName", values.fullName);
        formData.set("email", values.email);
        formData.set("password", values.password);

        startTransition(() => {
          formAction(formData);
        });
      })}
    >
      {state.error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p> : null}
      <div className="space-y-1.5">
        <Input autoComplete="name" placeholder="Họ và tên" {...register("fullName")} />
        {errors.fullName?.message ? <p className="text-xs text-rose-600">{errors.fullName.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Input autoComplete="email" placeholder="Email" type="email" {...register("email")} />
        {errors.email?.message ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Input autoComplete="new-password" placeholder="Mật khẩu" type="password" {...register("password")} />
        {errors.password?.message ? <p className="text-xs text-rose-600">{errors.password.message}</p> : null}
      </div>
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </Button>
    </form>
  );
}
