"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Package, ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { Product, StockWithWarehouse } from "@/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import StockBar from "@/components/ui/stock-bar";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [reserving, setReserving] = useState(false);
  // Stable idempotency key per reserve attempt — generated once, reused on retry
  const [reserveKey, setReserveKey] = useState(() => `reserve_${Date.now()}_${Math.random()}`);
  const [selectedWh, setSelectedWh] = useState<string>(
    product.stock.find((s) => s.available > 0)?.warehouseId ?? product.stock[0]?.warehouseId ?? ""
  );

  const totalAvailable = product.stock.reduce((s, w) => s + w.available, 0);
  const totalReserved  = product.stock.reduce((s, w) => s + w.reserved, 0);
  const totalStock     = product.stock.reduce((s, w) => s + w.total, 0);
  const selectedStock  = product.stock.find((s) => s.warehouseId === selectedWh);
  const canReserve     = !!selectedStock && selectedStock.available > 0;

  async function handleReserve() {
    if (!canReserve || reserving) return;
    setReserving(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": reserveKey,
        },
        body: JSON.stringify({ productId: product.id, warehouseId: selectedWh, quantity: 1 }),
      });
      const data = await res.json();

      if (res.status === 409) {
        toast({ variant: "error", title: "Insufficient stock", description: data.error ?? "No units available at this warehouse." });
        // New key for next attempt — this was a different intent (different stock state)
        setReserveKey(`reserve_${Date.now()}_${Math.random()}`);
        return;
      }
      if (!res.ok) {
        toast({ variant: "error", title: "Reservation failed", description: data.error ?? "Please try again." });
        // New key for next attempt
        setReserveKey(`reserve_${Date.now()}_${Math.random()}`);
        return;
      }
      toast({ variant: "success", title: "Unit reserved", description: "Redirecting to checkout…" });
      router.push(`/checkout/${data.id}`);
    } catch {
      toast({ variant: "error", title: "Network error", description: "Check your connection and try again." });
    } finally {
      setReserving(false);
    }
  }

  const stockColor =
    totalAvailable === 0 ? "var(--red)" :
    totalAvailable <= 3  ? "var(--amber)" :
    "var(--green)";

  return (
    <motion.div
      className="product-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
    >
      {/* Image */}
      <div className="product-img-wrap">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="product-img" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={36} style={{ color: "var(--text-muted)" }} />
          </div>
        )}
        <div className="product-img-overlay" />

        {/* Stock badge */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <span
            className="badge"
            style={{
              background: "rgba(8,8,9,0.75)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${stockColor}40`,
              color: stockColor,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: stockColor, display: "inline-block" }} />
            {totalAvailable === 0 ? "Out of stock" : `${totalAvailable} available`}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="product-body">
        {/* Name + desc */}
        <div>
          <h3 className="product-name">{product.name}</h3>
          <p className="product-desc" style={{ marginTop: 4 }}>{product.description}</p>
        </div>

        {/* Price + SKU */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="product-price">{formatPrice(product.price)}</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", background: "var(--bg-elevated)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border)" }}>
            {product.sku}
          </span>
        </div>

        {/* Stock bar */}
        <StockBar total={totalStock} reserved={totalReserved} available={totalAvailable} height={4} />

        <div className="divider" />

        {/* Warehouse selector */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Select warehouse
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {product.stock.map((s) => (
              <WarehouseChip
                key={s.warehouseId}
                stock={s}
                selected={selectedWh === s.warehouseId}
                onSelect={() => setSelectedWh(s.warehouseId)}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: "auto" }}>
          {canReserve ? (
            <motion.button
              className="btn btn-primary"
              style={{ width: "100%", fontSize: 13 }}
              onClick={handleReserve}
              disabled={reserving}
              whileTap={{ scale: 0.98 }}
            >
              {reserving ? (
                <><Loader2 size={14} className="spin" /> Reserving…</>
              ) : (
                <><ShoppingCart size={14} /> Reserve Unit</>
              )}
            </motion.button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", fontSize: 12, color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
              <AlertCircle size={13} />
              {totalAvailable === 0 ? "Out of stock" : "Out of stock at this warehouse"}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function WarehouseChip({ stock, selected, onSelect }: { stock: StockWithWarehouse; selected: boolean; onSelect: () => void }) {
  const unavailable = stock.available === 0;
  const stockColor =
    unavailable          ? "var(--red)" :
    stock.available <= 3 ? "var(--amber)" :
    "var(--green)";

  return (
    <button
      className="wh-chip"
      data-selected={selected}
      disabled={unavailable}
      onClick={onSelect}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <MapPin size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: selected ? "var(--text-primary)" : "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {stock.warehouseName}
        </span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: stockColor, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
        {stock.available}/{stock.total}
      </span>
    </button>
  );
}
