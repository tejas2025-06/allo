import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/expiry";
import { MapPin, Package, TrendingUp, AlertTriangle } from "lucide-react";
import MetricCard from "@/components/ui/metric-card";
import StockBar from "@/components/ui/stock-bar";

export const dynamic = "force-dynamic";

async function getData() {
  await releaseExpiredReservations();
  return prisma.warehouse.findMany({
    include: {
      stock: {
        include: { product: { select: { name: true, sku: true, price: true } } },
        orderBy: { product: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function WarehousesPage() {
  const warehouses = await getData();

  const totalStock     = warehouses.reduce((s, w) => s + w.stock.reduce((a, st) => a + st.total, 0), 0);
  const totalReserved  = warehouses.reduce((s, w) => s + w.stock.reduce((a, st) => a + st.reserved, 0), 0);
  const totalAvailable = totalStock - totalReserved;
  const utilization    = totalStock > 0 ? Math.round((totalReserved / totalStock) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Warehouse Network</h1>
        <p className="page-subtitle">Stock distribution and utilization across all fulfillment centers.</p>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard label="Total Units" value={totalStock} icon={Package} iconColor="var(--accent)" />
        <MetricCard label="Available" value={totalAvailable} icon={TrendingUp} iconColor="var(--green)" />
        <MetricCard label="Reserved" value={totalReserved} icon={AlertTriangle} iconColor="var(--amber)" />
        <MetricCard label="Utilization" value={`${utilization}%`} icon={MapPin} iconColor="var(--blue)" />
      </div>

      {/* Warehouse cards */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
        {warehouses.map((wh) => {
          const whTotal     = wh.stock.reduce((s, st) => s + st.total, 0);
          const whReserved  = wh.stock.reduce((s, st) => s + st.reserved, 0);
          const whAvailable = whTotal - whReserved;
          const whUtil      = whTotal > 0 ? Math.round((whReserved / whTotal) * 100) : 0;

          return (
            <div key={wh.id} className="card" style={{ overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 32, height: 32, background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Package size={14} style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{wh.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <MapPin size={10} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{wh.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 11, background: "var(--bg-elevated)", color: "var(--text-muted)", padding: "3px 8px", borderRadius: 20, border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                  {wh.stock.length} SKUs
                </span>
              </div>

              {/* Stats */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <StatBox label="Total" value={whTotal} />
                  <StatBox label="Available" value={whAvailable} color="var(--green)" />
                  <StatBox label="Reserved" value={whReserved} color="var(--amber)" />
                </div>
                <StockBar total={whTotal} reserved={whReserved} available={whAvailable} height={6} />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{whUtil}% utilization</span>
                </div>
              </div>

              {/* Product table */}
              <div style={{ padding: "12px 0" }}>
                <div style={{ padding: "0 20px 8px", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Stock by product
                </div>
                {wh.stock.map((s) => {
                  const avail = s.total - s.reserved;
                  const pct   = s.total > 0 ? (avail / s.total) * 100 : 0;
                  const color = avail === 0 ? "var(--red)" : avail <= 3 ? "var(--amber)" : "var(--green)";
                  return (
                    <div key={s.productId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                            {s.product.name}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: "var(--font-mono)", flexShrink: 0, marginLeft: 8 }}>
                            {avail}/{s.total}
                          </span>
                        </div>
                        <div style={{ height: 3, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color ?? "var(--text-primary)", letterSpacing: "-0.3px", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}
