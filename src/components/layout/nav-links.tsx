"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { FolderIcon, ListChecksIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import type { Role } from "@/domain/user";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

/** Navigation per role. Hiding links is UX only — access is enforced server-side. */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/projects", label: "Projects", icon: FolderIcon },
    { href: "/transcript", label: "Create from transcript", icon: SparklesIcon },
    { href: "/team", label: "Team", icon: UsersIcon },
  ],
  MANAGER: [
    { href: "/projects", label: "My projects", icon: FolderIcon },
    { href: "/team", label: "Team", icon: UsersIcon },
  ],
  AGENT: [
    { href: "/my-tasks", label: "My tasks", icon: ListChecksIcon },
    { href: "/projects", label: "Projects", icon: FolderIcon },
    { href: "/team", label: "Team", icon: UsersIcon },
  ],
};

export function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto">
      {NAV_BY_ROLE[role].map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4",
              active && "bg-secondary font-medium text-secondary-foreground hover:bg-secondary",
            )}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
