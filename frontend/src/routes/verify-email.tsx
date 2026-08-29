import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify your email — Eventify" },
      {
        name: "description",
        content: "Enter the 6-digit code we sent to verify your Eventify account.",
      },
      { property: "og:title", content: "Verify your email — Eventify" },
      {
        property: "og:description",
        content: "Confirm your email to activate your Eventify account.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a 6-digit code to your university inbox."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="surface-card flex flex-col items-center p-8 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="mt-6">
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="mt-6 h-11 w-full rounded-xl"
          onClick={() => {
            toast.success("Email verified");
            navigate({ to: "/dashboard" });
          }}
        >
          Verify email
        </Button>
        <button
          type="button"
          className="mt-4 text-xs font-medium text-primary hover:underline"
          onClick={() => toast("Verification code resent")}
        >
          Resend code
        </button>
      </div>
    </AuthLayout>
  );
}
