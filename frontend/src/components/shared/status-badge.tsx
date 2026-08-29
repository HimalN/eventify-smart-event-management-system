import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary ring-primary/20",
  ongoing: "bg-info/15 text-info ring-info/25",
  completed: "bg-success/15 text-success ring-success/25",
  draft: "bg-muted text-muted-foreground ring-border",
  cancelled: "bg-destructive/10 text-destructive ring-destructive/20",
  confirmed: "bg-success/15 text-success ring-success/25",
  waitlisted: "bg-warning/15 text-warning ring-warning/25",
  attended: "bg-success/15 text-success ring-success/25",
  absent: "bg-destructive/10 text-destructive ring-destructive/20",
  pending: "bg-muted text-muted-foreground ring-border",
  active: "bg-success/15 text-success ring-success/25",
  invited: "bg-warning/15 text-warning ring-warning/25",
  suspended: "bg-destructive/10 text-destructive ring-destructive/20",
  high: "bg-destructive/10 text-destructive ring-destructive/20",
  medium: "bg-warning/15 text-warning ring-warning/25",
  low: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        map[status] ?? map["pending"],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
