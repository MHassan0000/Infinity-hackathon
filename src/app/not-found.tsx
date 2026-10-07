import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="font-display text-2xl font-semibold">This page isn&apos;t available</h1>
      <p className="text-sm text-muted-foreground">
        It doesn&apos;t exist, or your account doesn&apos;t have access to it.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Go to my home page
      </Link>
    </main>
  );
}
