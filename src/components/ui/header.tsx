import Link from "next/link";
import { Package, Warehouse } from "lucide-react";

export default function Header() {
  return (
    <header
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
            }}
          >
            <Package size={14} color="var(--bg)" />
          </div>
          <span
            className="font-display font-800 text-lg tracking-tight"
            style={{ color: "var(--text-primary)", fontWeight: 800 }}
          >
            ALLO
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
          >
            /inventory
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
              textDecoration: "none",
            }}
          >
            <Package size={12} />
            Products
          </Link>
          <span style={{ color: "var(--border-bright)" }}>·</span>
          <Link
            href="/warehouses"
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
              textDecoration: "none",
            }}
          >
            <Warehouse size={12} />
            Warehouses
          </Link>
        </nav>
      </div>
    </header>
  );
}
