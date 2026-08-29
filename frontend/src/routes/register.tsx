import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Eventify" },
      {
        name: "description",
        content: "Create a Eventify account to register for campus events.",
      },
      { property: "og:title", content: "Create account — Eventify" },
      { property: "og:description", content: "Join Eventify as a participant or organizer." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register: formRegister, handleSubmit, formState } = useForm<{
    name: string;
    email: string;
    password: string;
  }>();
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("participant");

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the campus event platform in under a minute."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={handleSubmit(async (data) => {
          try {
            await authRegister(data.name, data.email, role, "Computer Science");
            toast.success("Account created", {
              description: "Welcome to Eventify.",
            });
            navigate({ to: "/dashboard" });
          } catch (e: any) {
            toast.error("Registration failed", {
              description: e.message || "Please check your connection."
            });
          }
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Amara Jayasinghe"
            {...formRegister("name", { required: "Name is required" })}
          />
          {formState.errors.name && (
            <p className="text-xs text-destructive">{formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">University email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@university.edu"
            {...formRegister("email", { required: "Email is required" })}
          />
          {formState.errors.email && (
            <p className="text-xs text-destructive">{formState.errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...formRegister("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Minimum 8 characters" },
              })}
            />
            {formState.errors.password && (
              <p className="text-xs text-destructive">{formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">I am a</Label>
            <Select defaultValue="participant" onValueChange={setRole}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="participant">Participant</SelectItem>
                <SelectItem value="organizer">Event Organizer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox id="terms" defaultChecked className="mt-0.5" />
          <Label htmlFor="terms" className="text-sm font-normal leading-snug text-muted-foreground">
            I agree to the university event policy and data processing terms.
          </Label>
        </div>
        <Button type="submit" className="h-11 w-full rounded-xl">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
