import { CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";

type Status = "PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED";

const config: Record<Status, { cls: string; icon: React.ReactNode; label: string }> = {
  PENDING:   { cls: "badge badge-amber",  icon: <Clock size={10} />,         label: "Pending" },
  CONFIRMED: { cls: "badge badge-green",  icon: <CheckCircle2 size={10} />,  label: "Confirmed" },
  RELEASED:  { cls: "badge badge-red",    icon: <XCircle size={10} />,       label: "Released" },
  EXPIRED:   { cls: "badge badge-muted",  icon: <AlertTriangle size={10} />, label: "Expired" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { cls, icon, label } = config[status] ?? config.PENDING;
  return <span className={cls}>{icon}{label}</span>;
}
