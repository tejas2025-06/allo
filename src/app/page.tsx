import { Suspense } from "react";
import ProductsGrid from "./page-components/ProductsGrid";
import MetricCard from "@/components/ui/metric-card";
import { Package, Warehouse, Clock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Product Catalog</h1>
        <p className="page-subtitle">
          Real-time inventory across all fulfillment centers. Reservations hold units for{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>10 minutes</span>.
        </p>
      </div>

      {/* Metrics */}
      <div className="metric-strip" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        <MetricCard label="Total Products"  value="6"       icon={Package}    iconColor="var(--accent)" />
        <MetricCard label="Warehouses"      value="3"       icon={Warehouse}  iconColor="var(--blue)" />
        <MetricCard label="Hold Window"     value="10 min"  icon={Clock}      iconColor="var(--amber)" />
        <MetricCard label="Fulfillment"     value="3 cities" icon={TrendingUp} iconColor="var(--green)" />
      </div>

      {/* Section bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>All Products</span>
          <span className="badge badge-green" style={{ fontSize: 10 }}>
            <span className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", color: "var(--green)" }} />
            Live
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>6 products · 3 warehouses</span>
      </div>

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsGrid />
      </Suspense>
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="products-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 460, borderRadius: "var(--radius-lg)" }} />
      ))}
    </div>
  );
}
