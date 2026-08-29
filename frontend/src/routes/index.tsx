import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  CloudSun,
  FileBarChart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eventify — Smart Event Management System" },
      {
        name: "description",
        content:
          "Create campus events, forecast attendance with machine learning and plan around live weather data — all in one enterprise dashboard.",
      },
      { property: "og:title", content: "Eventify — Smart Event Management System" },
      {
        property: "og:description",
        content:
          "ML attendance forecasts, weather intelligence and event analytics for universities.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: CalendarCheck,
    title: "Event lifecycle",
    body: "Create, publish, edit and track every campus event with capacity and registration control.",
  },
  {
    icon: BrainCircuit,
    title: "Attendance prediction",
    body: "ML forecasts with confidence scoring, feature importance and accuracy tracking.",
  },
  {
    icon: CloudSun,
    title: "Weather intelligence",
    body: "7-day forecasts, rain probability and venue impact scores per event.",
  },
  {
    icon: Users,
    title: "Role-based access",
    body: "Dedicated dashboards for administrators, organizers and participants.",
  },
  {
    icon: FileBarChart,
    title: "Reports & exports",
    body: "Attendance, registration, weather and prediction reports as PDF or Excel.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise ready",
    body: "Accessible, responsive UI ready to connect to a FastAPI backend.",
  },
];

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="glass-panel sticky top-0 z-30 border-b">
        <nav className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
          <span className="flex min-w-0 items-center gap-2.5 font-semibold">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl text-primary-foreground [background-image:var(--gradient-brand)]">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate">Eventify</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 [background-image:var(--gradient-surface)]" />
          <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              Model v2.4 · 94.2% prediction accuracy
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl"
            >
              Smart Event Management with{" "}
              <span className="text-gradient-brand">attendance &amp; weather prediction</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
            >
              Plan campus events, understand who will actually show up, and adapt to the forecast —
              powered by machine learning and live weather data.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-9 flex flex-wrap items-center justify-center gap-3"
            >
              <Button asChild size="lg" className="h-12 rounded-xl px-6">
                <Link to="/dashboard">
                  Open dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
                <Link to="/events">Browse events</Link>
              </Button>
            </motion.div>

            <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { k: "Events managed", v: "1,284" },
                { k: "Participants", v: "18.4k" },
                { k: "Prediction accuracy", v: "94.2%" },
                { k: "Weather sources", v: "3" },
              ].map((s) => (
                <div key={s.k} className="surface-card p-4">
                  <dt className="text-xs text-muted-foreground">{s.k}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <h2 className="text-2xl font-semibold tracking-tight">Everything you need</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A complete, responsive frontend ready to plug into a FastAPI backend.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="surface-card p-5"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </motion.li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="text-center text-xs text-muted-foreground">
          Smart Event Management System
        </p>
      </footer>
    </div>
  );
}
