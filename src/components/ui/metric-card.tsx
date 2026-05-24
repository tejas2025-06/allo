import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; up: boolean };
}

export default function MetricCard({ label, value, sub, icon: Icon, iconColor = "var(--accent)", trend }: Props) {
  return (
    <div className="metric-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} style={{ color: iconColor }} strokeWidth={2} />
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: trend.up ? "var(--green)" : "var(--red)",
            background: trend.up ? "var(--green-bg)" : "var(--red-bg)",
            border: `1px solid ${trend.up ? "var(--green-border)" : "var(--red-border)"}`,
            padding: "2px 7px", borderRadius: 20,
          }}>
            {trend.up ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
