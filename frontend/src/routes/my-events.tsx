import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Ticket, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { api, queryKeys } from "@/services/api";

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
  
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events,
    queryFn: api.getEvents,
  });

  const { data: allRegistrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: queryKeys.registrations,
    queryFn: api.getRegistrations,
  });

  const isParticipant = user.role === "participant";
  
  if (eventsLoading || registrationsLoading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </AppShell>
    );
  }

  const mine = events.filter(e => isParticipant ? false : true); // In a real app, filter by organizer ID
  const myRegistrations = allRegistrations.filter(r => r.email === user?.email);

  return (
    <AppShell>
      <PageHeader
        title="My Events"
        description={isParticipant ? "Events you've registered for." : "Events you organize."}
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
          {!isParticipant && <TabsTrigger value="organizing">Organizing</TabsTrigger>}
          <TabsTrigger value="registered">Registered</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        {!isParticipant && (
          <TabsContent value="organizing" className="mt-4">
            <SectionCard
              title="Organizing"
              description={`${mine.length} events`}
              bodyClassName="p-0"
            >
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
                        Predicted
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mine.map((e) => (
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
                        <td className="px-5 py-3 tabular-nums">
                          {e.currentRegistrations}/{e.capacity}
                        </td>
                        <td className="px-5 py-3 tabular-nums">{e.predictedAttendance}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={e.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </TabsContent>
        )}

        <TabsContent value="registered" className="mt-4">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {myRegistrations
              .filter((r) => r.status !== "cancelled")
              .map((r) => (
                <div key={r.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold">{r.eventTitle}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Registered {r.registeredAt}</p>
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Ticket className="size-3.5" aria-hidden="true" /> Ticket
                    </span>
                    <span className="font-mono text-xs font-medium">{r.ticketCode}</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-lg">
                    <Link to="/events/$eventId" params={{ eventId: r.eventId }}>
                      View event
                    </Link>
                  </Button>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {events.filter((e) => e.status === "completed").length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No past events"
              description="Completed events will appear here after they finish."
            />
          ) : (
            <SectionCard
              title="Past events"
              description="Completed with attendance results"
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-border">
                {events
                  .filter((e) => e.status === "completed")
                  .map((e) => (
                    <li
                      key={e.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.date} · predicted {e.predictedAttendance} · actual {e.actualAttendance}
                        </p>
                      </div>
                      <StatusBadge status="completed" />
                    </li>
                  ))}
              </ul>
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
