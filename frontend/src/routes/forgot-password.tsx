import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Eventify" },
      {
        name: "description",
        content: "Request a password reset link for your Eventify account.",
      },
      { property: "og:title", content: "Reset your password — Eventify" },
      { property: "og:description", content: "Recover access to your Eventify account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit } = useForm<{ email: string }>();

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="We'll email you a secure link to set a new one."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="surface-card flex flex-col items-center p-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
            <MailCheck className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-base font-semibold">Check your inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If an account exists for that address, a reset link is on its way.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-xl">
            <Link to="/reset-password">Open reset link (demo)</Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(() => setSent(true))}>
          <div className="space-y-2">
            <Label htmlFor="email">University email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              {...register("email", { required: true })}
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
