import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, LayoutGrid, List, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { weatherIcon } from "@/components/shared/weather-widget";
import { api, queryKeys } from "@/services/api";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "All Events — Eventify" },
      {
        name: "description",
        content:
          "Browse, filter and manage every campus event with attendance and weather insight.",
      },
      { property: "og:title", content: "All Events — Eventify" },
      {
        property: "og:description",
        content:
          "Browse, filter and manage every campus event with attendance and weather insight.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const { data: events = [], isLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: api.getEvents,
  });

  const categories = useMemo(() => [...new Set(events.map((e) => e.category))], [events]);
  const filtered = events.filter(
    (e) =>
      (status === "all" || e.status === status) &&
      (category === "all" || e.category === category) &&
      (e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.location.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell>
      <PageHeader
        title="All Events"
        description="Search, filter and manage every event across the campus."
        crumbs={[{ label: "Events" }]}
        actions={
          <Button asChild className="rounded-lg">
            <Link to="/events/new">
              <CalendarPlus className="size-4" aria-hidden="true" /> New event
            </Link>
          </Button>
        }
      />

      <SectionCard title="Filters" description={`${filtered.length} of ${events.length} events`}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events or venues"
              className="h-10 rounded-lg pl-9"
              aria-label="Search events"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 rounded-lg md:w-40" aria-label="Filter by status">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["all", "draft", "upcoming", "ongoing", "completed", "cancelled"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 rounded-lg md:w-44" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-md"
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-md"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </SectionCard>

      {isLoading ? (
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No events found"
          description="Try a different search term or clear the filters to see all events."
          action={
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const Icon = weatherIcon[e.weather?.condition || "Sunny"] || weatherIcon["Sunny"];
            return (
              <Link
                key={e.id}
                to="/events/$eventId"
                params={{ eventId: e.id }}
                className="surface-card group overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <div
                  className="h-24 w-full"
                  style={{
                    backgroundImage: `linear-gradient(135deg, oklch(0.62 0.16 ${e.bannerHue || 200}), oklch(0.52 0.18 ${((e.bannerHue || 200) + 40) % 360}))`,
                  }}
                  aria-hidden="true"
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold group-hover:text-primary">
                      {e.title}
                    </p>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {e.category} · {e.location}
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Date</dt>
                      <dd className="font-medium">{e.date}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Registered</dt>
                      <dd className="font-medium tabular-nums">
                        {e.currentRegistrations}/{e.capacity}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Predicted</dt>
                      <dd className="font-medium tabular-nums">{e.predictedAttendance}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                    {e.weather?.condition || "Sunny"} · {e.weather?.temperature || 28}°C · {e.weather?.rainProbability || 0}%
                    rain
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <SectionCard title="Events" description="Tabular view" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Event
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Date & Venue
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Registered
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    ML Predicted
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Weather Advisory
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <Link
                        to="/events/$eventId"
                        params={{ eventId: e.id }}
                        className="font-medium hover:text-primary"
                      >
                        {e.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{e.category}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {e.date} · {e.location} ({e.venueType})
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {e.currentRegistrations}/{e.capacity}
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-primary">
                      {e.predictedAttendance}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          e.weather?.advisory === "attention_required"
                            ? "bg-destructive/15 text-destructive"
                            : e.weather?.advisory === "moderate"
                              ? "bg-warning/15 text-warning"
                              : "bg-success/15 text-success"
                        }`}
                      >
                        {e.weather?.condition || "Sunny"} ({e.weather?.rainProbability || 0}% rain)
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </AppShell>
  );
}
