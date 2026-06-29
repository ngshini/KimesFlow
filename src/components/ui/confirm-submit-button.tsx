"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  pendingLabel = "Đang xử lý...",
  variant = "danger",
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={className}
      disabled={pending}
      type="submit"
      variant={variant}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
