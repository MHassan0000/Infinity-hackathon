import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_TIMEZONE } from "@/domain/company";
import { daysBetween, formatDate, todayIn } from "@/domain/dates";
import { formatHours } from "@/lib/utils";
import type { ProjectTask } from "@/server/data/projects";

/**
 * A compact timeline of the project: one lane per task, each ending at the
 * task's deadline, against the project's delivery date and today.
 */
export function DeliveryRunway({ deadline, tasks }: { deadline: string; tasks: ProjectTask[] }) {
  if (tasks.length === 0) return null;

  const today = todayIn(COMPANY_TIMEZONE);
  const dates = [today, deadline, ...tasks.map((task) => task.deadline)].sort();
  const start = dates[0];
  const end = dates[dates.length - 1];
  const span = Math.max(1, daysBetween(start, end));
  const position = (date: string) => `${(daysBetween(start, date) / span) * 100}%`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Delivery runway</CardTitle>
          <CardDescription>
            Each task&apos;s deadline on the way to delivery on {formatDate(deadline)}.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[minmax(0,11rem)_1fr] items-center gap-x-4 gap-y-2.5 sm:grid-cols-[minmax(0,15rem)_1fr]">
          <span />
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{formatDate(start)}</span>
            <span>{formatDate(end)}</span>
          </div>

          {tasks.map((task) => (
            <div key={task.id} className="contents">
              <span className="truncate text-sm" title={task.title}>
                {task.title}
              </span>
              <div className="relative h-6">
                <div className="absolute inset-y-[11px] right-0 left-0 rounded-full bg-muted" />
                <div
                  className="absolute inset-y-[9px] left-0 rounded-full bg-primary/20"
                  style={{ width: position(task.deadline) }}
                />
                <div
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-sm"
                  style={{ left: position(task.deadline) }}
                  title={`${task.title} · ${task.assignee.name} · due ${formatDate(task.deadline)} · ${formatHours(task.estimatedHours)}`}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 w-px bg-warning"
                  style={{ left: position(deadline) }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 w-px border-l border-dashed border-foreground/40"
                  style={{ left: position(today) }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" /> Task deadline
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-px bg-warning" /> Project delivery
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-px border-l border-dashed border-foreground/60" /> Today
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
