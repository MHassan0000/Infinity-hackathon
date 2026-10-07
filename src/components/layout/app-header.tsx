import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { LogOutIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { type AppUser, homePathFor, ROLE_LABELS } from "@/domain/user";
import { NavLinks } from "./nav-links";
import { UserAvatar } from "./user-avatar";

export function AppHeader({ user }: { user: AppUser }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href={homePathFor(user.role)} className="font-display text-base font-semibold tracking-tight">
          NovaWorks <span className="font-normal text-muted-foreground">Delivery</span>
        </Link>

        <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <NavLinks role={user.role} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={user.name} role={user.role} />
            <div className="hidden leading-tight md:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
              <LogOutIcon />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
