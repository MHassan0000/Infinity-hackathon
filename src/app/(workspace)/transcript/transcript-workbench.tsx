"use client";

import Link from "next/link";
import { type FormEvent, useActionState, useState, useTransition } from "react";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BanIcon,
  CheckCircleIcon,
  SparklesIcon,
  SpinnerIcon,
  XCircleIcon,
} from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/form-controls";
import type { ProjectPlan } from "@/domain/plan";
import type { AppUser } from "@/domain/user";
import type { PlanIssue } from "@/domain/validate-plan";
import { formatHours, pluralize } from "@/lib/utils";
import { processTranscriptAction, resetProjectsAction, type WorkbenchState } from "./actions";

type DirectoryEntry = Pick<AppUser, "id" | "name" | "role">;

type Intent = "extract" | "save-reviewed";

export function TranscriptWorkbench({
  sampleTranscript,
  directory,
  existingProjectCount,
}: {
  sampleTranscript: string;
  directory: DirectoryEntry[];
  existingProjectCount: number;
}) {
  const [state, formAction, pending] = useActionState(processTranscriptAction, null);
  const [transcript, setTranscript] = useState("");
  const [intent, setIntent] = useState<Intent>("extract");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>Meeting transcript</CardTitle>
            <CardDescription>Paste the full meeting, including corrections and the final recap.</CardDescription>
          </div>
        </CardHeader>
        <form action={formAction} onSubmit={() => setIntent("extract")} className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="extract" />
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="transcript">Transcript</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTranscript(sampleTranscript)}
                  disabled={pending}
                >
                  Use sample meeting
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setTranscript("")} disabled={pending || !transcript}>
                  Clear
                </Button>
              </div>
            </div>
            <Textarea
              id="transcript"
              name="transcript"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Meeting: NovaWorks Client Delivery Planning…"
              className="h-[26rem] resize-y font-mono text-xs"
              disabled={pending}
              required
            />
            <p className="text-xs text-muted-foreground">
              {transcript.length.toLocaleString()} characters. Passwords and emails are never sent to the AI.
            </p>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3">
            {existingProjectCount > 0 && (
              <ExistingProjectsNotice count={existingProjectCount} disabled={pending} />
            )}
            <Button type="submit" size="lg" disabled={pending || transcript.trim().length === 0}>
              {pending && intent === "extract" ? <SpinnerIcon /> : <SparklesIcon />}
              {pending && intent === "extract" ? "Reading the meeting…" : "Create from transcript"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {pending ? (
          <PendingPanel intent={intent} />
        ) : (
          <ResultPanel
            state={state}
            directory={directory}
            formAction={formAction}
            onSaveReviewed={() => setIntent("save-reviewed")}
          />
        )}
      </div>
    </div>
  );
}

function ExistingProjectsNotice({ count, disabled }: { count: number; disabled: boolean }) {
  const [resetting, startReset] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const reset = () => {
    if (!window.confirm("Delete all projects and tasks? Team accounts are kept.")) return;
    startReset(async () => {
      const result = await resetProjectsAction();
      setMessage("error" in result ? result.error : `Removed ${pluralize(result.deleted, "project")}.`);
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      <span>
        {message ?? `${pluralize(count, "project")} already exist. Creating again adds new ones.`}
      </span>
      <Button variant="outline" size="sm" onClick={reset} disabled={disabled || resetting}>
        {resetting && <SpinnerIcon />}
        Reset demo data
      </Button>
    </div>
  );
}

function PendingPanel({ intent }: { intent: Intent }) {
  return (
    <Card aria-live="polite">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <SpinnerIcon className="size-6 text-primary" />
        <p className="font-medium">{intent === "extract" ? "Reading the meeting…" : "Checking your corrections…"}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {intent === "extract"
            ? "Finding projects, owners, deadlines and estimates. This usually takes 10–30 seconds."
            : "Validating the plan before saving it."}
        </p>
      </CardContent>
    </Card>
  );
}

function ResultPanel({
  state,
  directory,
  formAction,
  onSaveReviewed,
}: {
  state: WorkbenchState;
  directory: DirectoryEntry[];
  formAction: (formData: FormData) => void;
  onSaveReviewed: () => void;
}) {
  if (!state) return <HowItWorks />;

  switch (state.status) {
    case "failed":
      return (
        <Alert variant="destructive" aria-live="polite">
          <XCircleIcon />
          <AlertTitle>Nothing was created</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      );

    case "created": {
      const taskCount = state.projects.reduce((sum, project) => sum + project.taskCount, 0);
      return (
        <>
          <Alert variant="success" aria-live="polite">
            <CheckCircleIcon />
            <AlertTitle>
              Created {pluralize(state.projects.length, "project")} with {pluralize(taskCount, "task")}
            </AlertTitle>
            <AlertDescription>Saved together in one transaction. Managers and developers can see them now.</AlertDescription>
          </Alert>
          <Card className="gap-0 py-2">
            {state.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-0 hover:bg-muted/50"
              >
                <span className="font-medium">{project.name}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground [&_svg]:size-4">
                  {pluralize(project.taskCount, "task")} · {formatHours(project.totalHours)}
                  <ArrowRightIcon />
                </span>
              </Link>
            ))}
          </Card>
          {state.excluded.length > 0 && <ExcludedList items={state.excluded} />}
        </>
      );
    }

    case "needs-review":
      return (
        <ReviewPanel
          key={JSON.stringify(state.plan)}
          plan={state.plan}
          issues={state.issues}
          directory={directory}
          formAction={formAction}
          onSubmit={onSaveReviewed}
        />
      );
  }
}

function ExcludedList({ items }: { items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Left out on purpose</CardTitle>
          <CardDescription>Ruled out in the meeting, so no tasks were created for these.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0">
              <BanIcon className="text-muted-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ReviewPanel({
  plan,
  issues,
  directory,
  formAction,
  onSubmit,
}: {
  plan: ProjectPlan;
  issues: PlanIssue[];
  directory: DirectoryEntry[];
  formAction: (formData: FormData) => void;
  onSubmit: () => void;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(plan, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const managers = directory.filter((person) => person.role === "MANAGER");
  const agents = directory.filter((person) => person.role === "AGENT");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    try {
      JSON.parse(draft);
      setJsonError(null);
      onSubmit();
    } catch {
      event.preventDefault();
      setJsonError("This isn't valid JSON yet. Check for a missing comma, quote or bracket.");
    }
  };

  return (
    <>
      <Alert variant="warning" aria-live="polite">
        <AlertTriangleIcon />
        <AlertTitle>Nothing was saved. {pluralize(issues.length, "value needs", "values need")} a decision</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 flex flex-col gap-1.5">
            {issues.map((issue) => (
              <li key={issue.path}>
                <span className="font-medium text-foreground">{issue.context}:</span> {issue.message}{" "}
                <code className="font-mono text-xs">{issue.path}</code>
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Correct the draft</CardTitle>
            <CardDescription>Edit the values below, then save. The AI is not called again.</CardDescription>
          </div>
        </CardHeader>
        <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="save-reviewed" />
          <CardContent className="flex flex-col gap-3">
            <Textarea
              name="plan"
              aria-label="Draft plan JSON"
              aria-invalid={jsonError ? true : undefined}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-80 resize-y font-mono text-xs"
              spellCheck={false}
            />
            {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
            <div className="grid gap-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">managerId:</span>{" "}
                {managers.map((person) => `${person.id} ${person.name}`).join(" · ")}
              </p>
              <p>
                <span className="font-medium text-foreground">assigneeId:</span>{" "}
                {agents.map((person) => `${person.id} ${person.name}`).join(" · ")}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Validate and save</Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

function HowItWorks() {
  const checks = [
    "Final decisions win: later corrections replace earlier dates, estimates and owners.",
    "Only people in the team directory are assigned. Nobody is invented.",
    "Features the meeting rejected are left out.",
    "Every project and task is checked, then saved together — or nothing is saved.",
  ];
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">What happens when you create</CardTitle>
          <CardDescription>The AI drafts the plan; the application decides whether it is safe to save.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3 text-sm">
          {checks.map((check) => (
            <li key={check} className="flex items-start gap-2 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0">
              <CheckCircleIcon className="text-success" />
              <span>{check}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
