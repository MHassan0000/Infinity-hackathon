import { CalendarIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { COMPANY_TIMEZONE } from "@/domain/company";
import { daysBetween, formatDate, isIsoDate, todayIn } from "@/domain/dates";

function relativeLabel(date: string): { text: string; tone: "muted" | "warning" | "destructive" } {
  const days = daysBetween(todayIn(COMPANY_TIMEZONE), date);
  if (days < 0) return { text: `${-days}d overdue`, tone: "destructive" };
  if (days === 0) return { text: "due today", tone: "warning" };
  if (days <= 3) return { text: `in ${days}d`, tone: "warning" };
  return { text: `in ${days}d`, tone: "muted" };
}

/** A deadline with its distance from today, e.g. "20 Oct 2026 · in 13d". */
export function DueDate({ date, compact = false }: { date: string; compact?: boolean }) {
  if (!isIsoDate(date)) return <span className="text-muted-foreground">{date || "—"}</span>;
  const relative = relativeLabel(date);

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 whitespace-nowrap">
      {!compact && <CalendarIcon className="size-3.5 text-muted-foreground" />}
      <time dateTime={date} className="font-mono text-[13px]">
        {formatDate(date)}
      </time>
      <Badge variant={relative.tone}>{relative.text}</Badge>
    </span>
  );
}
