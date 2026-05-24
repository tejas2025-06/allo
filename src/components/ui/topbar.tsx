"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";

const titles: Record<string, string> = {
  "/":             "Product Catalog",
  "/reservations": "Reservations",
  "/warehouses":   "Warehouses",
};

interface Props {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: Props) {
  const path = usePathname();
  const isCheckout = path.startsWith("/checkout/");
  const title = isCheckout ? "Checkout" : (titles[path] ?? "Allo Inventory");

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Hamburger — mobile only */}
        <button className="hamburger" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          className="topbar-search"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <span>Search…</span>
          <span style={{ fontSize: 10, background: "var(--bg-surface)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--border)", color: "var(--text-muted)" }}>⌘K</span>
        </button>
        <button style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "7px 8px", cursor: "pointer", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
          <Bell size={14} />
        </button>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}>
          A
        </div>
      </div>
    </header>
  );
}
