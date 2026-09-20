import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  CheckCircle2,
  Copy,
  MapPin,
  Printer,
  Sparkles,
  Ticket,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Registration, EventItem } from "@/types";

interface QrTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
  event?: EventItem | null;
}

export function QrTicketModal({
  isOpen,
  onClose,
  registration,
  event,
}: QrTicketModalProps) {
  const [, setCopied] = useState(false);

  if (!registration) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(registration.ticketCode);
    setCopied(true);
    toast.success("Ticket code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isCheckedIn = registration.attendance === "attended";
  const isCancelled = registration.status === "cancelled";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Event Entry Ticket - {registration.eventTitle}</DialogTitle>
          <DialogDescription>
            Present this QR code or ticket code at the event entrance for automated check-in.
          </DialogDescription>
        </DialogHeader>

        {/* Digital Ticket Pass Container */}
        <div id="printable-ticket" className="relative flex flex-col bg-card text-card-foreground">
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/80 px-6 py-5 text-primary-foreground">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                  <Sparkles className="size-3" /> Official Event Pass
                </span>
                <h3 className="mt-2 text-lg font-bold leading-tight">
                  {registration.eventTitle}
                </h3>
              </div>
            </div>

            {/* Background geometric flare */}
            <div
              className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-xl pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Ticket Body Details */}
          <div className="space-y-4 px-6 pt-5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <User className="size-3.5 text-primary" /> Participant
                </span>
                <p className="mt-1 truncate font-semibold text-foreground">
                  {registration.participant}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {registration.email}
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Calendar className="size-3.5 text-primary" /> Date & Time
                </span>
                <p className="mt-1 font-semibold text-foreground">
                  {event?.date || registration.registeredAt}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {event?.startTime ? `${event.startTime} onwards` : "Campus Venue"}
                </p>
              </div>
            </div>

            {event?.location && (
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/20 px-3.5 py-2 text-xs text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="truncate font-medium text-foreground">{event.location}</span>
                <span className="text-[11px]">({event.venueType || "Campus"})</span>
              </div>
            )}
          </div>

          {/* Perforation Divider */}
          <div className="relative my-4 flex items-center justify-between px-2">
            <div className="size-5 -ml-3.5 rounded-full bg-background border border-border shadow-inner" />
            <div className="w-full border-t-2 border-dashed border-border" />
            <div className="size-5 -mr-3.5 rounded-full bg-background border border-border shadow-inner" />
          </div>

          {/* QR Code Presentation Section */}
          <div className="flex flex-col items-center px-6 pb-6 text-center">
            <div className="relative rounded-2xl border-2 border-border bg-white p-4 shadow-sm">
              <QRCodeSVG
                value={registration.ticketCode}
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
                bgColor="#ffffff"
              />

              {isCheckedIn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/90 backdrop-blur-[2px] text-success">
                  <CheckCircle2 className="size-12 animate-bounce" />
                  <span className="mt-1 font-bold text-sm text-foreground">
                    CHECKED IN
                  </span>
                </div>
              )}
            </div>

            {/* Ticket Code Bar */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                {registration.ticketCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-md"
                onClick={handleCopyCode}
                title="Copy ticket code"
              >
                <Copy className="size-3.5" />
                <span className="sr-only">Copy code</span>
              </Button>
            </div>

            {/* Attendance Status Badge */}
            <div className="mt-3">
              {isCancelled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive">
                  Registration Cancelled
                </span>
              ) : isCheckedIn ? (
                <div className="flex flex-col items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    <CheckCircle2 className="size-3.5" /> Checked In & Verified
                  </span>
                  {registration.checkedInAt && (
                    <span className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                      Checked in at {registration.checkedInAt}
                    </span>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  <Ticket className="size-3.5" /> Ready for Scan at Entrance
                </span>
              )}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground max-w-xs">
              Present this pass at the gate. The organizer will scan the QR code to record your attendance.
            </p>

            {/* Actions */}
            <div className="mt-5 flex w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl gap-1.5 text-xs"
                onClick={handlePrint}
              >
                <Printer className="size-3.5" /> Print Pass
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 rounded-xl gap-1.5 text-xs"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
