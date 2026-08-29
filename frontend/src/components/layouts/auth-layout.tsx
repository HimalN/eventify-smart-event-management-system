import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BrainCircuit, CloudSun, LineChart, Sparkles } from "lucide-react";

const highlights = [
  {
    icon: BrainCircuit,
    title: "ML attendance forecasts",
    body: "Gradient-boosted predictions with confidence scoring.",
  },
  {
    icon: CloudSun,
    title: "Weather-aware planning",
    body: "7-day forecasts and venue impact scores per event.",
  },
  {
    icon: LineChart,
    title: "Live analytics",
    body: "Registrations, trends and performance in real time.",
  },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden p-12 text-primary-foreground lg:flex lg:flex-col [background-image:var(--gradient-brand)]">
        <div className="pointer-events-none absolute -left-24 top-1/3 size-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-white/20">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          Eventify
        </Link>
        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Smart Event Management with Attendance &amp; Weather Prediction
          </h2>
          <ul className="mt-8 space-y-5">
            {highlights.map((h, i) => (
              <motion.li
                key={h.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex gap-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/20">
                  <h.icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="block text-sm opacity-85">{h.body}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex items-center gap-2 text-base font-semibold lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg text-primary-foreground [background-image:var(--gradient-brand)]">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            Eventify
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}
