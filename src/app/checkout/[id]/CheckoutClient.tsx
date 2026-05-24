"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  ArrowLeft, ShoppingBag, Loader2, MapPin, Package,
  Timer, Info, Zap,
} from "lucide-react";
import { Reservation } from "@/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/ui/status-badge";

export default function CheckoutClient({ reservation: initial }: { reservation: Reservation }) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation>(initial);
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [email, setEmail] = useState(initial.customerEmail ?? "");

  const isTerminal = ["CONFIRMED", "RELEASED", "EXPIRED"].includes(reservation.status);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, { cache: "no-store" });
      if (res.ok) setReservation(await res.json());
    } catch {}
  }, [reservation.id]);

  // Countdown
  useEffect(() => {
    if (isTerminal) return;
    const tick = () => {
      const ms = Math.max(0, new Date(reservation.expiresAt).getTime() - Date.now());
      setTimeLeft(ms);
      if (ms === 0) refresh();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservation.expiresAt, isTerminal, refresh]);

  // Background poll
  useEffect(() => {
    if (isTerminal) return;
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [isTerminal, refresh]);

  async function handleConfirm() {
    if (confirming) return;
    setConfirming(true);
    // Stable key scoped to this reservation — same key on every retry, so the
    // server returns the cached response instead of re-running the side effect.
    const idempotencyKey = `confirm_${reservation.id}`;
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ customerEmail: email || undefined }),
      });
      const data = await res.json();
      if (res.status === 410) {
        toast({ variant: "error", title: "Reservation expired", description: "Your hold has ended. Please start a new reservation." });
        setReservation((r) => ({ ...r, status: "EXPIRED" }));
        return;
      }
      if (!res.ok) {
        toast({ variant: "error", title: "Confirmation failed", description: data.error ?? "Please try again." });
        return;
      }
      setReservation(data);
      toast({ variant: "success", title: "Order confirmed!", description: `${reservation.product.name} — ${formatPrice(reservation.product.price)}` });
    } catch {
      toast({ variant: "error", title: "Network error", description: "Check your connection." });
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/release`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "error", title: "Cancellation failed", description: data.error });
        return;
      }
      setReservation(data);
      toast({ variant: "warning", title: "Reservation cancelled", description: "Stock has been released back to inventory." });
    } catch {
      toast({ variant: "error", title: "Network error", description: "Check your connection." });
    } finally {
      setCancelling(false);
    }
  }

  const totalMs   = 10 * 60 * 1000;
  const progress  = isTerminal ? 0 : (timeLeft / totalMs) * 100;
  const minutes   = Math.floor(timeLeft / 60000);
  const seconds   = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent  = timeLeft < 120000 && !isTerminal && timeLeft > 0;
  const isExpired = timeLeft === 0 && !isTerminal;

  const timerColor = isUrgent ? "var(--red)" : progress > 50 ? "var(--green)" : "var(--amber)";
  const barColor   = isUrgent ? "var(--red)" : progress > 50 ? "var(--green)" : "var(--amber)";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13, padding: 0, marginBottom: 24, transition: "color 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Back to catalog
      </button>

      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            {reservation.product.name}
          </h1>
          <StatusBadge status={reservation.status as "PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED"} />
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Reservation ID: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{reservation.id}</span></p>
      </div>

      {/* Status alert */}
      <AnimatePresence mode="wait">
        <StatusAlert reservation={reservation} isExpired={isExpired} key={reservation.status} />
      </AnimatePresence>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>

        {/* LEFT — details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Countdown */}
          {!isTerminal && (
            <motion.div
              className="card"
              style={{ padding: 20 }}
              animate={isUrgent ? { borderColor: ["var(--border)", "var(--red-border)", "var(--border)"] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Timer size={15} style={{ color: timerColor }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Time remaining
                  </span>
                  {isUrgent && (
                    <span className="badge badge-red" style={{ fontSize: 10 }}>
                      <Zap size={9} /> Expiring soon
                    </span>
                  )}
                </div>
                <motion.span
                  className="countdown-digit"
                  style={{ fontSize: 32, fontWeight: 800, color: timerColor, letterSpacing: "0.04em", lineHeight: 1 }}
                  key={`${minutes}:${seconds}`}
                  animate={{ opacity: [0.7, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </motion.span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", background: barColor, borderRadius: 99 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Hold expires at {new Date(reservation.expiresAt).toLocaleTimeString()}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {Math.round(progress)}% remaining
                </span>
              </div>
            </motion.div>
          )}

          {/* Order summary */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
              Order Summary
            </div>

            {/* Product */}
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              {reservation.product.imageUrl && (
                <div style={{ width: 72, height: 72, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--bg-elevated)", flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reservation.product.imageUrl} alt={reservation.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{reservation.product.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{reservation.product.sku}</p>
              </div>
            </div>

            <div className="divider" style={{ marginBottom: 14 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SummaryRow label="Warehouse">
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={11} style={{ color: "var(--text-muted)" }} />
                  {reservation.warehouse.name}
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  <span style={{ color: "var(--text-muted)" }}>{reservation.warehouse.location}</span>
                </span>
              </SummaryRow>
              <SummaryRow label="Quantity">
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Package size={11} style={{ color: "var(--text-muted)" }} />
                  {reservation.quantity} unit{reservation.quantity > 1 ? "s" : ""}
                </span>
              </SummaryRow>
              {reservation.confirmedAt && (
                <SummaryRow label="Confirmed at">
                  {new Date(reservation.confirmedAt).toLocaleString()}
                </SummaryRow>
              )}
              {reservation.releasedAt && (
                <SummaryRow label="Released at">
                  {new Date(reservation.releasedAt).toLocaleString()}
                </SummaryRow>
              )}
              <div className="divider" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Total</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-light)", letterSpacing: "-0.5px" }}>
                  {formatPrice(reservation.product.price * reservation.quantity)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Confirm / Cancel */}
          {reservation.status === "PENDING" && !isExpired && (
            <motion.div className="card" style={{ padding: 20 }} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                Complete Purchase
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label-text">Email address <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Order confirmation will be sent here.</p>
              </div>

              <motion.button
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginBottom: 8 }}
                onClick={handleConfirm}
                disabled={confirming || cancelling}
                whileTap={{ scale: 0.98 }}
              >
                {confirming ? <><Loader2 size={15} className="spin" /> Processing…</> : <><ShoppingBag size={15} /> Confirm purchase</>}
              </motion.button>

              <button
                className="btn btn-danger"
                style={{ width: "100%" }}
                onClick={handleCancel}
                disabled={cancelling || confirming}
              >
                {cancelling ? <><Loader2 size={13} className="spin" /> Cancelling…</> : "Cancel reservation"}
              </button>
            </motion.div>
          )}

          {/* Confirmed state */}
          {reservation.status === "CONFIRMED" && (
            <motion.div className="card" style={{ padding: 24, textAlign: "center" }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div
                style={{ width: 56, height: 56, background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 size={26} style={{ color: "var(--green)" }} />
              </motion.div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Order confirmed</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                {reservation.confirmedAt ? `Confirmed at ${new Date(reservation.confirmedAt).toLocaleString()}` : "Payment successful"}
              </p>
              <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => router.push("/")}>
                ← Back to catalog
              </button>
            </motion.div>
          )}

          {/* Released / Expired state */}
          {(reservation.status === "RELEASED" || reservation.status === "EXPIRED") && (
            <motion.div className="card" style={{ padding: 24, textAlign: "center" }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ width: 56, height: 56, background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                {reservation.status === "EXPIRED" ? <AlertTriangle size={24} style={{ color: "var(--amber)" }} /> : <XCircle size={24} style={{ color: "var(--red)" }} />}
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                {reservation.status === "EXPIRED" ? "Reservation expired" : "Reservation cancelled"}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                Stock has been returned to the warehouse.
              </p>
              <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => router.push("/")}>
                Browse catalog
              </button>
            </motion.div>
          )}

          {/* Info card */}
          {reservation.status === "PENDING" && !isExpired && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Info size={13} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>How it works</span>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  "Units are held for 10 minutes",
                  "Confirm to permanently decrement stock",
                  "Cancel anytime to release the hold",
                  "Expired holds return stock automatically",
                ].map((t) => (
                  <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: "var(--text-muted)" }}>
                    <span style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }}>·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatusAlert({ reservation, isExpired }: { reservation: Reservation; isExpired: boolean }) {
  const styles = {
    CONFIRMED: { bg: "var(--green-bg)", border: "var(--green-border)", color: "var(--green)", icon: <CheckCircle2 size={14} />, text: "Order confirmed — payment successful" },
    RELEASED:  { bg: "var(--red-bg)",   border: "var(--red-border)",   color: "var(--red)",   icon: <XCircle size={14} />,       text: "Reservation cancelled — stock released" },
    EXPIRED:   { bg: "var(--amber-bg)", border: "var(--amber-border)", color: "var(--amber)", icon: <AlertTriangle size={14} />, text: "Reservation expired — your hold has ended" },
    PENDING:   { bg: "var(--bg-card)",  border: "var(--border)",       color: "var(--text-muted)", icon: <Clock size={14} />,    text: "Units reserved — complete checkout before the timer runs out" },
  };

  const key = (isExpired ? "EXPIRED" : reservation.status) as keyof typeof styles;
  const s = styles[key] ?? styles.PENDING;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 20, background: s.bg, border: `1px solid ${s.border}`, borderRadius: "var(--radius-sm)", color: s.color, fontSize: 13 }}
    >
      {s.icon}
      {s.text}
      {key === "PENDING" && (
        <span style={{ marginLeft: "auto" }}>
          <span className="live-dot" style={{ color: "var(--accent)", width: 7, height: 7, display: "inline-block", borderRadius: "50%", background: "var(--accent)" }} />
        </span>
      )}
    </motion.div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right" }}>{children}</span>
    </div>
  );
}
