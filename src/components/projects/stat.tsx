export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card px-5 py-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-display text-3xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
