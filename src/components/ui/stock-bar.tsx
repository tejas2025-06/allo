interface Props {
  total: number;
  reserved: number;
  available: number;
  showLabels?: boolean;
  height?: number;
}

export default function StockBar({ total, reserved, available, showLabels = true, height = 5 }: Props) {
  const reservedPct  = total > 0 ? (reserved  / total) * 100 : 0;
  const availablePct = total > 0 ? (available / total) * 100 : 0;

  const availColor =
    availablePct === 0 ? "var(--red)" :
    availablePct < 30  ? "var(--amber)" :
    "var(--green)";

  return (
    <div>
      {showLabels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--green)", fontWeight: 700 }}>{available}</span> avail
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--amber)", fontWeight: 700 }}>{reserved}</span> held
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{total} total</span>
        </div>
      )}
      <div style={{ height, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden", display: "flex", border: "1px solid var(--border)" }}>
        <div style={{ width: `${availablePct}%`, background: availColor, transition: "width 0.5s ease" }} />
        <div style={{ width: `${reservedPct}%`, background: "var(--amber)", opacity: 0.5, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}
