import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Eventify" },
      {
        name: "description",
        content: "Sign in to the Eventify Smart Event Management System.",
      },
      { property: "og:title", content: "Sign in — Eventify" },
      { property: "og:description", content: "Access your Eventify dashboard." },
    ],
  }),
  component: LoginPage,
});


function LoginPage() {
  const { register, handleSubmit, formState } = useForm<{ email: string; password: string }>({
    defaultValues: { email: "", password: "" },
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data.email, data.password);
      toast.success("Signed in", { description: "Welcome back to Eventify." });
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error("Sign in failed", { description: e.message || "Please check your connection." });
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage events, forecasts and attendance insights."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">University email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            {...register("email", { required: "Email is required" })}
          />
          {formState.errors.email && (
            <p className="text-xs text-destructive">{formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password", { required: "Password is required" })}
          />
          {formState.errors.password && (
            <p className="text-xs text-destructive">{formState.errors.password.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
            Keep me signed in for 30 days
          </Label>
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
