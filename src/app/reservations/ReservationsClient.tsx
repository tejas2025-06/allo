"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked, Clock, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Package, MapPin, ArrowRight, Filter,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "@/components/ui/status-badge";

type Status = "PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED";

interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: Status;
  expiresAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  customerEmail: string | null;
  createdAt: string;
  product: { name: string; price: number; sku: string; imageUrl: string | null };
  warehouse: { name: string; location: string };
}

const STATUS_FILTERS: { label: string; value: Status | "ALL" }[] = [
  { label: "All",       value: "ALL" },
  { label: "Pending",   value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Released",  value: "RELEASED" },
  { label: "Expired",   value: "EXPIRED" },
];

export default function ReservationsClient({ reservations: initial }: { reservations: Reservation[] }) {
  const router = useRouter();
  const [reservations, setReservations] = useState(initial);
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(handleRefresh, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/reservations", { cache: "no-store" });
      if (res.ok) setReservations(await res.json());
    } catch {}
    finally { setRefreshing(false); }
  }

  const filtered = filter === "ALL" ? reservations : reservations.filter((r) => r.status === filter);

  const counts = {
    ALL:       reservations.length,
    PENDING:   reservations.filter((r) => r.status === "PENDING").length,
    CONFIRMED: reservations.filter((r) => r.status === "CONFIRMED").length,
    RELEASED:  reservations.filter((r) => r.status === "RELEASED").length,
    EXPIRED:   reservations.filter((r) => r.status === "EXPIRED").length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="page-subtitle">All reservation activity across your inventory.</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={13} className={refreshing ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total"     value={counts.ALL}       color="var(--accent)"  bg="var(--accent-bg)"  border="var(--accent-border)" icon={<BookMarked size={14} />} />
        <StatCard label="Pending"   value={counts.PENDING}   color="var(--amber)"   bg="var(--amber-bg)"   border="var(--amber-border)"  icon={<Clock size={14} />} />
        <StatCard label="Confirmed" value={counts.CONFIRMED} color="var(--green)"   bg="var(--green-bg)"   border="var(--green-border)"  icon={<CheckCircle2 size={14} />} />
        <StatCard label="Released"  value={counts.RELEASED}  color="var(--red)"     bg="var(--red-bg)"     border="var(--red-border)"    icon={<XCircle size={14} />} />
        <StatCard label="Expired"   value={counts.EXPIRED}   color="var(--text-muted)" bg="var(--bg-elevated)" border="var(--border)"   icon={<AlertTriangle size={14} />} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <Filter size={13} style={{ color: "var(--text-muted)" }} />
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid",
              transition: "all 0.12s ease",
              background: filter === value ? "var(--accent)" : "var(--bg-elevated)",
              color: filter === value ? "#fff" : "var(--text-secondary)",
              borderColor: filter === value ? "var(--accent)" : "var(--border)",
            }}
          >
            {label}
            <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.8 }}>
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      {/* Table / cards */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card" style={{ overflow: "hidden", display: "block" }} id="res-table">
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-elevated)" }}>
                    <Th>Product</Th>
                    <Th>Warehouse</Th>
                    <Th>Qty</Th>
                    <Th>Status</Th>
                    <Th>Expires / Ended</Th>
                    <Th>Created</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((r, i) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ cursor: "pointer" }}
                        onClick={() => router.push(`/checkout/${r.id}`)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {r.product.imageUrl && (
                              <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--bg-elevated)" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={r.product.imageUrl} alt={r.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.product.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{r.product.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <MapPin size={11} style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.warehouse.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Package size={11} style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.quantity}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                          <StatusBadge status={r.status} />
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                          <TimeCell reservation={r} />
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                            View <ArrowRight size={12} />
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div style={{ display: "none" }} id="res-cards">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                className="card"
                style={{ padding: 16, marginBottom: 10, cursor: "pointer" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/checkout/${r.id}`)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {r.product.imageUrl && (
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.product.imageUrl} alt={r.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{r.product.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusBadge status={r.status} />
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.quantity} unit{r.quantity > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={10} /> {r.warehouse.name}
                  </span>
                  <TimeCell reservation={r} />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Inject responsive CSS to swap table/cards */}
      <style>{`
        @media (max-width: 640px) {
          #res-table { display: none !important; }
          #res-cards  { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function TimeCell({ reservation: r }: { reservation: Reservation }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (r.status !== "PENDING") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [r.status]);

  if (r.status === "CONFIRMED" && r.confirmedAt) {
    return <span style={{ fontSize: 11, color: "var(--green)" }}>{new Date(r.confirmedAt).toLocaleString()}</span>;
  }
  if ((r.status === "RELEASED" || r.status === "EXPIRED") && r.releasedAt) {
    return <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(r.releasedAt).toLocaleString()}</span>;
  }
  if (r.status === "PENDING") {
    const ms = Math.max(0, new Date(r.expiresAt).getTime() - now);
    const m  = Math.floor(ms / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    const urgent = ms < 120000;
    return (
      <span style={{ fontSize: 11, fontWeight: 600, color: urgent ? "var(--red)" : "var(--amber)", fontFamily: "var(--font-mono)" }}>
        {ms === 0 ? "Expired" : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
      </span>
    );
  }
  return <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>;
}

function StatCard({ label, value, color, bg, border, icon }: { label: string; value: number; color: string; bg: string; border: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: "var(--radius)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.5px" }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", gap: 12, textAlign: "center" }}>
      <div style={{ width: 52, height: 52, background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BookMarked size={22} style={{ color: "var(--text-muted)" }} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>No reservations</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          {filter === "ALL" ? "No reservations have been made yet." : `No ${filter.toLowerCase()} reservations.`}
        </p>
      </div>
    </div>
  );
}
