"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Warehouse, BookMarked, Activity, LayoutDashboard } from "lucide-react";

const nav = [
  { href: "/",            label: "Products",     icon: Package },
  { href: "/reservations",label: "Reservations", icon: BookMarked },
  { href: "/warehouses",  label: "Warehouses",   icon: Warehouse },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const path = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} onClick={onClose}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(79,70,229,0.35)",
            }}>
              <Package size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", lineHeight: 1 }}>
                Allo
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em", marginTop: 1 }}>
                Inventory Platform
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-link ${active ? "active" : ""}`}
                onClick={onClose}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
                {href === "/reservations" && (
                  <span style={{
                    marginLeft: "auto", fontSize: 10, fontWeight: 700,
                    background: "var(--accent-bg)", color: "var(--accent)",
                    padding: "1px 6px", borderRadius: 10,
                    border: "1px solid var(--accent-border)",
                  }}>
                    Live
                  </span>
                )}
              </Link>
            );
          })}

          <div className="sidebar-section-label">System</div>
          <div className="sidebar-link" style={{ opacity: 0.45, cursor: "default" }}>
            <Activity size={15} />
            Analytics
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>
              Soon
            </span>
          </div>
          <div className="sidebar-link" style={{ opacity: 0.45, cursor: "default" }}>
            <LayoutDashboard size={15} />
            Dashboard
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>
              Soon
            </span>
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block", color: "var(--green)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>All systems operational</span>
          </div>
        </div>
      </aside>
    </>
  );
}
