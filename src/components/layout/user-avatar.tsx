import type { Role } from "@/domain/user";
import { cn, initials } from "@/lib/utils";

const ROLE_TONE: Record<Role, string> = {
  ADMIN: "bg-foreground text-background",
  MANAGER: "bg-primary text-primary-foreground",
  AGENT: "bg-success text-white",
};

export function UserAvatar({
  name,
  role,
  className,
}: {
  name: string;
  role: Role;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold",
        ROLE_TONE[role],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
