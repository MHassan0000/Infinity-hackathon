"use client";

import { useActionState, useState } from "react";
import { AlertTriangleIcon, ArrowRightIcon, SpinnerIcon } from "@/components/icons";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-controls";
import { DEMO_PASSWORD, type DemoUser } from "@/domain/demo-users";
import { ROLE_LABELS, ROLES } from "@/domain/user";
import { cn } from "@/lib/utils";
import { loginAction } from "./actions";

type DemoAccount = Pick<DemoUser, "id" | "name" | "email" | "role" | "specialization">;

export function LoginForm({ accounts }: { accounts: DemoAccount[] }) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="name@novaworks.example"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {state?.error && (
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>{state.error}</AlertTitle>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <SpinnerIcon /> : <ArrowRightIcon />}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <section aria-labelledby="demo-accounts" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="demo-accounts" className="text-sm font-medium">
            Demo accounts
          </h2>
          <p className="text-xs text-muted-foreground">
            Password for all: <span className="font-mono">{DEMO_PASSWORD}</span>
          </p>
        </div>
        {ROLES.map((role) => (
          <div key={role} className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            <div className="flex flex-wrap gap-1.5">
              {accounts
                .filter((account) => account.role === role)
                .map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => fillAccount(account)}
                    title={`${account.email} · ${account.specialization}`}
                    className={cn(
                      "rounded-md border border-border bg-card px-2.5 py-1 text-xs transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      email === account.email && "border-primary bg-secondary text-secondary-foreground",
                    )}
                  >
                    {account.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
