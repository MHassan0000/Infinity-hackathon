import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEMO_USERS } from "@/domain/demo-users";
import { homePathFor } from "@/domain/user";
import { getCurrentUser } from "@/server/auth/current-user";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const FLOW = [
  { label: "Paste the meeting", detail: "The administrator drops in the planning transcript." },
  { label: "AI drafts the plan", detail: "Projects, owners, deadlines and estimates — checked against the team directory." },
  { label: "Everyone sees their work", detail: "Managers get their projects. Developers get their tasks." },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  const accounts = DEMO_USERS.map(({ id, name, email, role, specialization }) => ({
    id,
    name,
    email,
    role,
    specialization,
  }));

  return (
    <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-12 text-background lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <p className="relative font-display text-lg font-semibold tracking-tight">
          NovaWorks <span className="font-normal opacity-60">Delivery</span>
        </p>

        <div className="relative flex max-w-md flex-col gap-10">
          <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight">
            From meeting
            <br />
            to execution.
          </h1>
          <ol className="flex flex-col gap-5">
            {FLOW.map((step, index) => (
              <li key={step.label} className="grid grid-cols-[2rem_1fr] gap-x-3">
                <span className="font-mono text-sm opacity-50">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm opacity-60">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative text-xs opacity-50">NovaWorks Technologies · Lahore</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-2">
            <p className="font-display text-sm font-semibold lg:hidden">NovaWorks Delivery</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use your NovaWorks account, or pick a demo account below.
            </p>
          </div>
          <LoginForm accounts={accounts} />
        </div>
      </section>
    </main>
  );
}
