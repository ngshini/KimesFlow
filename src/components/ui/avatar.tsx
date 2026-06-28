import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

export function Avatar({ name, src, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return <Image alt={name} className={cn("h-8 w-8 rounded-full object-cover", className)} height={32} src={src} width={32} />;
  }

  return (
    <div className={cn("grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold", className)}>
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}
