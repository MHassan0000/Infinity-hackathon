"use client";

import { useEffect } from "react";
import { AlertTriangleIcon } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>This page couldn&apos;t load</AlertTitle>
        <AlertDescription>
          The data service didn&apos;t respond. Check the connection and try again — nothing was changed.
        </AlertDescription>
      </Alert>
      <Button variant="outline" className="w-fit" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
