import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarPlus,
  Ticket,
  Loader2,
  QrCode,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Calendar,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrTicketModal } from "@/components/shared/qr-ticket-modal";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { useAuth } from "@/contexts/auth-context";
import { api, queryKeys } from "@/services/api";
import type { Registration } from "@/types";

export const Route = createFileRoute("/my-events")({
  head: () => ({
    meta: [
      { title: "My Events — Eventify" },
      {
        name: "description",
        content: "Your organized events, registrations and event tickets in one place.",
      },
      { property: "og:title", content: "My Events — Eventify" },
      {
        property: "og:description",
        content: "Your organized events, registrations and event tickets in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyEventsPage,
});

function MyEventsPage() {
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<Registration | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Organizing Tab States
  const [orgSearch, setOrgSearch] = useState("");
  const [orgStatus, setOrgStatus] = useState("all");
  const [orgPage, setOrgPage] = useState(1);
  const [orgLimit, setOrgLimit] = useState(6);

  // Registered Tab States
  const [regSearch, setRegSearch] = useState("");
  const [regStatus, setRegStatus] = useState("all");
  const [regPage, setRegPage] = useState(1);
  const [regLimit, setRegLimit] = useState(6);

  // Past Tab States
  const [pastSearch, setPastSearch] = useState("");
  const [pastPage, setPastPage] = useState(1);
  const [pastLimit, setPastLimit] = useState(6);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: api.getEvents,
  });

  const { data: allRegistrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: queryKeys.registrations,
    queryFn: api.getRegistrations,
  });

  const isParticipant = user.role === "participant";

  // Filter organized events
  const organizedEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(orgSearch.toLowerCase()) ||
        e.location.toLowerCase().includes(orgSearch.toLowerCase()) ||
        e.category.toLowerCase().includes(orgSearch.toLowerCase());
      const matchesStatus = orgStatus === "all" || e.status === orgStatus;
      return matchesSearch && matchesStatus;
    });
  }, [events, orgSearch, orgStatus]);

  // Paginate organized events
  const totalOrgPages = Math.max(1, Math.ceil(organizedEvents.length / orgLimit));
  const paginatedOrgEvents = useMemo(() => {
    const start = (orgPage - 1) * orgLimit;
    return organizedEvents.slice(start, start + orgLimit);
  }, [organizedEvents, orgPage, orgLimit]);

  // Filter user registrations
  const userRegistrations = useMemo(() => {
    return allRegistrations
      .filter((r) => r.email === user?.email && r.status !== "cancelled")
      .filter((r) => {
        const matchesSearch =
          r.eventTitle.toLowerCase().includes(regSearch.toLowerCase()) ||
          r.ticketCode.toLowerCase().includes(regSearch.toLowerCase());
        const matchesStatus =
          regStatus === "all" ||
          (regStatus === "attended" && r.attendance === "attended") ||
          (regStatus === "pending" && r.attendance === "pending");
        return matchesSearch && matchesStatus;
      });
  }, [allRegistrations, user?.email, regSearch, regStatus]);

  // Paginate registrations
  const totalRegPages = Math.max(1, Math.ceil(userRegistrations.length / regLimit));
  const paginatedRegistrations = useMemo(() => {
    const start = (regPage - 1) * regLimit;
    return userRegistrations.slice(start, start + regLimit);
  }, [userRegistrations, regPage, regLimit]);

  // Filter past events
  const pastEvents = useMemo(() => {
    return events
      .filter((e) => e.status === "completed")
      .filter((e) =>
        e.title.toLowerCase().includes(pastSearch.toLowerCase()) ||
        e.location.toLowerCase().includes(pastSearch.toLowerCase())
      );
  }, [events, pastSearch]);

  // Paginate past events
  const totalPastPages = Math.max(1, Math.ceil(pastEvents.length / pastLimit));
  const paginatedPastEvents = useMemo(() => {
    const start = (pastPage - 1) * pastLimit;
    return pastEvents.slice(start, start + pastLimit);
  }, [pastEvents, pastPage, pastLimit]);

  if (eventsLoading || registrationsLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="My Events"
        description={isParticipant ? "Events you've registered for." : "Events you organize & tickets you hold."}
        crumbs={[{ label: "My Events" }]}
        actions={
          !isParticipant && (
            <Button asChild className="rounded-lg">
              <Link to="/events/new">
                <CalendarPlus className="size-4" aria-hidden="true" /> New event
              </Link>
            </Button>
          )
        }
      />

      <Tabs defaultValue={isParticipant ? "registered" : "organizing"}>
        <TabsList className="rounded-xl">
          {!isParticipant && <TabsTrigger value="organizing">Organizing ({events.length})</TabsTrigger>}
          <TabsTrigger value="registered">Registered Passes ({userRegistrations.length})</TabsTrigger>
          <TabsTrigger value="past">Past Events ({pastEvents.length})</TabsTrigger>
        </TabsList>

        {/* TAB: Organizing Events */}
        {!isParticipant && (
          <TabsContent value="organizing" className="mt-4 space-y-4">
            {/* Search & Filter bar for organizing events */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={orgSearch}
                  onChange={(e) => {
                    setOrgSearch(e.target.value);
                    setOrgPage(1);
                  }}
                  placeholder="Search organized events..."
                  className="h-10 pl-9 text-xs rounded-xl"
                />
              </div>

              <Select
                value={orgStatus}
                onValueChange={(v) => {
                  setOrgStatus(v);
                  setOrgPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-40 text-xs rounded-xl">
                  <SlidersHorizontal className="size-3.5 mr-1 text-muted-foreground" />
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
            </div>

            <SectionCard
              title="Organizing Events"
              description={`Showing ${paginatedOrgEvents.length} of ${organizedEvents.length} events`}
              bodyClassName="p-0"
            >
              {paginatedOrgEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No organized events match your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="px-5 py-3 font-medium">
                          Event
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Date
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Registered
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          ML Predicted
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedOrgEvents.map((e) => (
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
                          <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                          <td className="px-5 py-3 tabular-nums font-medium">
                            {e.currentRegistrations}/{e.capacity}
                          </td>
                          <td className="px-5 py-3 tabular-nums font-semibold text-primary">
                            {e.predictedAttendance}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={e.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <PaginationControls
              page={orgPage}
              totalPages={totalOrgPages}
              total={organizedEvents.length}
              limit={orgLimit}
              onPageChange={setOrgPage}
              onLimitChange={(l) => {
                setOrgLimit(l);
                setOrgPage(1);
              }}
              label="organized events"
            />
          </TabsContent>
        )}

        {/* TAB: Registered Passes */}
        <TabsContent value="registered" className="mt-4 space-y-4">
          {/* Search & Filter bar for registered passes */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={regSearch}
                onChange={(e) => {
                  setRegSearch(e.target.value);
                  setRegPage(1);
                }}
                placeholder="Search ticket passes by event name or code..."
                className="h-10 pl-9 text-xs rounded-xl"
              />
            </div>

            <Select
              value={regStatus}
              onValueChange={(v) => {
                setRegStatus(v);
                setRegPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-44 text-xs rounded-xl">
                <SlidersHorizontal className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Attendance</SelectItem>
                <SelectItem value="attended" className="text-xs">Checked In (Attended)</SelectItem>
                <SelectItem value="pending" className="text-xs">Pending Check-In</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paginatedRegistrations.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No registrations found"
              description="You have no registered event tickets matching your search criteria."
              action={
                <Button asChild variant="outline" className="rounded-lg text-xs">
                  <Link to="/events">Browse Events</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedRegistrations.map((r) => {
                const isCheckedIn = r.attendance === "attended";
                return (
                  <div key={r.id} className="surface-card p-5 flex flex-col justify-between hover:shadow-[var(--shadow-lift)] transition-all">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold">{r.eventTitle}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">Registered {r.registeredAt}</p>
                        {isCheckedIn && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                            <CheckCircle2 className="size-3" /> Attended
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border px-3 py-2 bg-muted/20">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Ticket className="size-3.5" aria-hidden="true" /> Ticket Code
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">{r.ticketCode}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 rounded-lg gap-1.5 text-xs font-medium"
                        onClick={() => {
                          setSelectedTicket(r);
                          setIsQrModalOpen(true);
                        }}
                      >
                        <QrCode className="size-3.5" /> Show QR Pass
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-lg text-xs">
                        <Link to="/events/$eventId" params={{ eventId: r.eventId }}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <PaginationControls
            page={regPage}
            totalPages={totalRegPages}
            total={userRegistrations.length}
            limit={regLimit}
            onPageChange={setRegPage}
            onLimitChange={(l) => {
              setRegLimit(l);
              setRegPage(1);
            }}
            label="registered passes"
          />
        </TabsContent>

        {/* TAB: Past Events */}
        <TabsContent value="past" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={pastSearch}
              onChange={(e) => {
                setPastSearch(e.target.value);
                setPastPage(1);
              }}
              placeholder="Search past completed events..."
              className="h-10 pl-9 text-xs rounded-xl"
            />
          </div>

          {paginatedPastEvents.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No past events"
              description="Completed events will appear here after they finish."
            />
          ) : (
            <SectionCard
              title="Past Events"
              description={`Completed with attendance results (${pastEvents.length} total)`}
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-border">
                {paginatedPastEvents.map((e) => (
                  <li
                    key={e.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <Link
                        to="/events/$eventId"
                        params={{ eventId: e.id }}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {e.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.date} · Predicted: <strong className="text-foreground">{e.predictedAttendance}</strong> · Actual Check-Ins:{" "}
                        <strong className="text-foreground">{e.actualAttendance ?? "—"}</strong>
                      </p>
                    </div>
                    <StatusBadge status="completed" />
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <PaginationControls
            page={pastPage}
            totalPages={totalPastPages}
            total={pastEvents.length}
            limit={pastLimit}
            onPageChange={setPastPage}
            onLimitChange={(l) => {
              setPastLimit(l);
              setPastPage(1);
            }}
            label="past events"
          />
        </TabsContent>
      </Tabs>

      <QrTicketModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedTicket(null);
        }}
        registration={selectedTicket}
        event={events.find((e) => e.id === selectedTicket?.eventId)}
      />
    </AppShell>
  );
}


