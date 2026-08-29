import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Eventify" },
      { name: "description", content: "Choose a new password for your Eventify account." },
      { property: "og:title", content: "Set a new password — Eventify" },
      { property: "og:description", content: "Complete your Eventify password reset." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { register, handleSubmit, watch, formState } = useForm<{
    password: string;
    confirm: string;
  }>();
  const navigate = useNavigate();
  const password = watch("password", "");
  const strength = Math.min(100, password.length * 12);

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={handleSubmit(() => {
          toast.success("Password updated", { description: "You can now sign in." });
          navigate({ to: "/login" });
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
          />
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full transition-all [background-image:var(--gradient-brand)]"
              style={{ width: `${strength}%` }}
            />
          </div>
          {formState.errors.password && (
            <p className="text-xs text-destructive">{formState.errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            {...register("confirm", {
              validate: (v) => v === password || "Passwords do not match",
            })}
          />
          {formState.errors.confirm && (
            <p className="text-xs text-destructive">{formState.errors.confirm.message}</p>
          )}
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl">
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
