import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { OrganizerDashboard } from "@/components/dashboard/organizer-dashboard";
import { ParticipantDashboard } from "@/components/dashboard/participant-dashboard";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Eventify" },
      {
        name: "description",
        content: "Events, attendance predictions and weather insights at a glance.",
      },
      { property: "og:title", content: "Dashboard — Eventify" },
      {
        property: "og:description",
        content: "Events, attendance predictions and weather insights at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? "admin";

  return (
    <AppShell>
      <PageHeader
        title={
          role === "admin"
            ? "Admin Dashboard"
            : role === "organizer"
              ? "Organizer Dashboard"
              : "My Dashboard"
        }
        description={`Welcome back${user?.name ? `, ${user.name}` : ""} — here's what's happening across your events.`}
        crumbs={[{ label: "Home", to: "/" }, { label: "Dashboard" }]}
      />
      {role === "admin" ? (
        <AdminDashboard />
      ) : role === "organizer" ? (
        <OrganizerDashboard />
      ) : (
        <ParticipantDashboard />
      )}
    </AppShell>
  );
}
