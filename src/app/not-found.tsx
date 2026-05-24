import Link from "next/link";
import { Package } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Package size={24} style={{ color: "var(--text-muted)" }} />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Page not found</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      </div>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
        ← Back to catalog
      </Link>
    </div>
  );
}
