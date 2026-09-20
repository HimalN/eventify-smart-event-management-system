import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarPlus,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationControls } from "@/components/shared/pagination-controls";
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [view, setView] = useState<"grid" | "table">("grid");

  // Fetch paginated events from backend
  const { data: paginatedData, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.paginatedEvents({ page, limit, search, status, category, sortBy, order }),
    queryFn: () => api.getPaginatedEvents({ page, limit, search, status, category, sortBy, order }),
  });

  // Fetch distinct categories
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.eventCategories,
    queryFn: api.getEventCategories,
  });

  const events = paginatedData?.items || [];
  const total = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;
  const hasNext = paginatedData?.hasNext || false;
  const hasPrev = paginatedData?.hasPrev || false;

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    if (val === "date_asc") {
      setSortBy("date");
      setOrder("asc");
    } else if (val === "date_desc") {
      setSortBy("date");
      setOrder("desc");
    } else if (val === "title") {
      setSortBy("title");
      setOrder("asc");
    } else if (val === "capacity_desc") {
      setSortBy("capacity");
      setOrder("desc");
    } else if (val === "predicted_desc") {
      setSortBy("predicted_attendance");
      setOrder("desc");
    }
    setPage(1);
  };

  const handleLimitChange = (val: string) => {
    setLimit(Number(val));
    setPage(1);
  };

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

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

      {/* Filter and Search Bar */}
      <SectionCard
        title="Filters & Search"
        description={
          total > 0
            ? `Showing ${startRecord}–${endRecord} of ${total} events (Page ${page} of ${totalPages})`
            : "No events matching filter criteria"
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_auto_auto_auto_auto_auto]">
          {/* Search Input */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search title, venue or description..."
              className="h-10 rounded-lg pl-9 text-xs"
              aria-label="Search events"
            />
          </div>

          {/* Status Filter */}
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-10 rounded-lg text-xs" aria-label="Filter by status">
              <SlidersHorizontal className="size-3.5 text-muted-foreground mr-1" aria-hidden="true" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["all", "draft", "upcoming", "ongoing", "completed", "cancelled"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize text-xs">
                  {s === "all" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-10 rounded-lg text-xs" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={`${sortBy}_${order}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="h-10 rounded-lg text-xs" aria-label="Sort events">
              <ArrowUpDown className="size-3.5 text-muted-foreground mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_asc" className="text-xs">Date: Soonest first</SelectItem>
              <SelectItem value="date_desc" className="text-xs">Date: Latest first</SelectItem>
              <SelectItem value="title_asc" className="text-xs">Title: A to Z</SelectItem>
              <SelectItem value="capacity_desc_asc" className="text-xs">Capacity: High to Low</SelectItem>
              <SelectItem value="predicted_attendance_desc_asc" className="text-xs">Predicted Turnout</SelectItem>
            </SelectContent>
          </Select>

          {/* Page Size Selector */}
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="h-10 rounded-lg text-xs w-28" aria-label="Page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6" className="text-xs">6 / page</SelectItem>
              <SelectItem value="9" className="text-xs">9 / page</SelectItem>
              <SelectItem value="18" className="text-xs">18 / page</SelectItem>
              <SelectItem value="27" className="text-xs">27 / page</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-md h-8 w-8 p-0"
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-md h-8 w-8 p-0"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex justify-center p-16 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No events found"
          description="Try a different search term or clear the filters to see all events."
          action={
            <Button
              variant="outline"
              className="rounded-lg text-xs"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setCategory("all");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="relative">
          {isFetching && !isLoading && (
            <div className="absolute top-2 right-2 z-10 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-xs flex items-center gap-1.5 border border-border">
              <Loader2 className="size-3 animate-spin text-primary" /> Updating...
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((e) => {
              const Icon = weatherIcon[e.weather?.condition || "Sunny"] || weatherIcon["Sunny"];
              return (
                <Link
                  key={e.id}
                  to="/events/$eventId"
                  params={{ eventId: e.id }}
                  className="surface-card group overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div>
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
                          <dd className="font-medium tabular-nums text-primary font-semibold">{e.predictedAttendance}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="border-t border-border/60 px-5 py-3 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 truncate">
                      {Icon && <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />}
                      <span className="truncate">{e.weather?.condition || "Sunny"} · {e.weather?.temperature || 28}°C</span>
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      View details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
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
                {events.map((e) => (
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

      {/* Pagination Controls Footer */}
      <PaginationControls
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
        limitOptions={[6, 9, 18, 27]}
        label="events"
      />
    </AppShell>
  );
}


