import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Users,
  QrCode,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
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
import { Input } from "@/components/ui/input";
import { api, queryKeys } from "@/services/api";
import type { EventItem, Registration, CheckInResponse } from "@/types";

interface CheckinTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  registrations: Registration[];
}

interface CheckInLog {
  id: string;
  ticketCode: string;
  name: string;
  time: string;
  status: "success" | "warning" | "error";
  message: string;
}

export function CheckinTerminalModal({
  isOpen,
  onClose,
  event,
  registrations,
}: CheckinTerminalModalProps) {
  const queryClient = useQueryClient();
  const [ticketInput, setTicketInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<CheckInLog[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"quick" | "camera">("quick");

  const [barcodeSupported, setBarcodeSupported] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const eventAttendees = registrations.filter((r) => r.eventId === event.id);
  const checkedInCount = eventAttendees.filter((r) => r.attendance === "attended").length;
  const totalRegistrations = eventAttendees.length || event.currentRegistrations;

  // Process check in action
  const handleCheckIn = useCallback(async (code: string) => {
    const match = code.match(/SEMS-[A-Z0-9]{3}-[A-Z0-9]{4}/i);
    const cleanCode = match ? match[0].toUpperCase() : code.trim().toUpperCase();
    if (!cleanCode) return;

    setIsProcessing(true);
    try {
      const res = await api.checkInParticipant(cleanCode, event.id);
      setLastCheckIn(res);

      const newLog: CheckInLog = {
        id: `${Date.now()}-${Math.random()}`,
        ticketCode: cleanCode,
        name: res.registration?.participant || "Attendee",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        status: res.alreadyCheckedIn ? "warning" : res.success ? "success" : "error",
        message: res.message,
      };

      setRecentLogs((prev) => [newLog, ...prev.slice(0, 9)]);

      if (res.alreadyCheckedIn) {
        toast.warning("Already Checked In", {
          description: res.message,
        });
      } else {
        toast.success("Check-In Successful!", {
          description: `${res.registration?.participant || cleanCode} is now marked as attended.`,
        });
      }

      // Invalidate queries so live counts and lists refresh across the app
      queryClient.invalidateQueries({ queryKey: queryKeys.events });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(event.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities });
      setTicketInput("");
    } catch (err: any) {
      const errorMsg = err.message || "Failed to check in participant.";
      toast.error("Check-In Error", { description: errorMsg });
      setLastCheckIn({
        success: false,
        message: errorMsg,
        alreadyCheckedIn: false,
        timestamp: new Date().toISOString(),
      });
      const errorLog: CheckInLog = {
        id: `${Date.now()}-${Math.random()}`,
        ticketCode: cleanCode,
        name: "Unknown Attendee",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        status: "error",
        message: errorMsg,
      };
      setRecentLogs((prev) => [errorLog, ...prev.slice(0, 9)]);
    } finally {
      setIsProcessing(false);
    }
  }, [event.id, queryClient]);

  // Start Camera Stream & native BarcodeDetector scan if supported
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      // Check for BarcodeDetector API in modern browsers
      if ("BarcodeDetector" in window) {
        setBarcodeSupported(true);
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39"],
        });

        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4 && !isProcessing) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                if (rawValue) {
                  const match = rawValue.match(/SEMS-[A-Z0-9]{3}-[A-Z0-9]{4}/i);
                  if (match) {
                    handleCheckIn(match[0].toUpperCase());
                  }
                }
              }
            } catch {
              // detection frame skipped
            }
          }
        }, 400);
      } else {
        setBarcodeSupported(false);
      }
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access or use manual code entry."
          : "Camera not available on this device. Use manual lookup below."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Live Check-In Terminal - {event.title}</DialogTitle>
          <DialogDescription>
            Scan QR codes or enter ticket codes to check in attendees at the event entrance.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Top Banner */}
        <div className="border-b border-border bg-gradient-to-r from-muted/50 via-muted/30 to-background px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <UserCheck className="size-4" />
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Live Attendance Check-In Terminal
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-md">
                {event.title} · {event.location || "Campus Venue"}
              </p>
            </div>

            {/* Live Progress Gauge */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2 shadow-xs">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Turnout</p>
                <p className="text-sm font-bold text-foreground tabular-nums">
                  {checkedInCount} / {totalRegistrations}
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="text-sm font-bold text-primary tabular-nums">
                  {totalRegistrations > 0
                    ? `${Math.round((checkedInCount / totalRegistrations) * 100)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 flex gap-2">
            <Button
              variant={activeTab === "quick" ? "default" : "outline"}
              size="sm"
              className="rounded-lg text-xs gap-1.5"
              onClick={() => setActiveTab("quick")}
            >
              <Search className="size-3.5" /> Manual & Quick Lookup
            </Button>
            <Button
              variant={activeTab === "camera" ? "default" : "outline"}
              size="sm"
              className="rounded-lg text-xs gap-1.5"
              onClick={() => setActiveTab("camera")}
            >
              <Camera className="size-3.5" /> QR Camera Scanner
            </Button>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="grid gap-6 p-6 md:grid-cols-5">
          {/* Main Action Left Column (3 cols) */}
          <div className="space-y-4 md:col-span-3">
            {activeTab === "camera" ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-black aspect-video flex flex-col items-center justify-center text-center text-white">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="size-full object-cover"
                  />

                  {/* Viewfinder Reticle Overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative size-44 border-2 border-dashed border-primary/80 rounded-xl">
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 size-4 border-t-2 border-l-2 border-primary" />
                        <div className="absolute -top-1 -right-1 size-4 border-t-2 border-r-2 border-primary" />
                        <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-primary" />
                        <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-primary" />
                        {/* Scanning Laser Animation */}
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Camera Fallback / Error State */}
                  {!cameraActive && (
                    <div className="p-6 text-xs text-muted-foreground flex flex-col items-center">
                      <CameraOff className="size-10 text-muted-foreground/60 mb-2" />
                      <p className="font-semibold text-foreground">Camera is Inactive</p>
                      <p className="mt-1 text-center max-w-xs">{cameraError || "Click below to activate your webcam or phone camera."}</p>
                      <Button
                        size="sm"
                        className="mt-3 rounded-lg gap-1.5 text-xs"
                        onClick={startCamera}
                      >
                        <Camera className="size-3.5" /> Start Camera
                      </Button>
                    </div>
                  )}
                </div>

                {!barcodeSupported && cameraActive && (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
                    <p className="font-semibold">Browser QR Detection Notice</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      Your browser does not support native live camera QR detection. You can enter or paste the unique ticket code in the <strong>Manual Ticket Verification</strong> box below.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Quick Ticket Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckIn(ticketInput);
              }}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <label htmlFor="ticket-code-input" className="block text-xs font-semibold text-foreground">
                Manual Ticket Code Verification
              </label>
              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="ticket-code-input"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder="e.g. SEMS-801-4921"
                    className="pl-9 font-mono text-sm uppercase rounded-xl"
                    disabled={isProcessing}
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!ticketInput.trim() || isProcessing}
                  className="rounded-xl gap-1.5 text-xs font-semibold px-4"
                >
                  {isProcessing ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3.5" />
                  )}
                  Check In
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Tip: Pure software verification — enter the attendee's ticket code or paste the QR pass link if camera scanning is unavailable.
              </p>
            </form>

            {/* Feedback Alert Card */}
            {lastCheckIn && (
              <div
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  lastCheckIn.alreadyCheckedIn
                    ? "border-warning/30 bg-warning/10 text-warning-foreground"
                    : lastCheckIn.success
                      ? "border-success/30 bg-success/10 text-success-foreground"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastCheckIn.alreadyCheckedIn ? (
                    <AlertTriangle className="size-5 shrink-0 text-warning mt-0.5" />
                  ) : lastCheckIn.success ? (
                    <CheckCircle2 className="size-5 shrink-0 text-success mt-0.5" />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground">
                      {lastCheckIn.message}
                    </p>
                    {lastCheckIn.registration && (
                      <div className="mt-2 rounded-xl bg-background/80 p-2.5 text-xs border border-border/50 text-foreground">
                        <p className="font-medium">{lastCheckIn.registration.participant}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {lastCheckIn.registration.email} · Ticket:{" "}
                          <strong className="font-mono text-foreground">{lastCheckIn.registration.ticketCode}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Session Activity Feed (2 cols) */}
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="size-3.5 text-primary" /> Live Check-In Log
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {recentLogs.length} recent
                </span>
              </div>

              {recentLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <UserCheck className="size-8 text-muted-foreground/40 mb-1" />
                  <p className="text-xs font-medium">Ready for check-ins</p>
                  <p className="text-[11px] mt-0.5">Scanned attendees will appear here in real-time.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border overflow-y-auto max-h-[280px] mt-2 pr-1 space-y-1">
                  {recentLogs.map((log) => (
                    <li key={log.id} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {log.status === "success" && (
                            <span className="size-1.5 rounded-full bg-success shrink-0" />
                          )}
                          {log.status === "warning" && (
                            <span className="size-1.5 rounded-full bg-warning shrink-0" />
                          )}
                          {log.status === "error" && (
                            <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                          )}
                          <p className="font-semibold truncate text-foreground">{log.name}</p>
                        </div>
                        <p className="font-mono text-[10px] text-muted-foreground pl-3">
                          {log.ticketCode}
                        </p>
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                        {log.time}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" /> Verified SEMS Gate Check
          </span>
          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={onClose}>
            Close Terminal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
