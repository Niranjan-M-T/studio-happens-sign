import type { DocStatus } from "@/lib/types";

const STYLES: Record<DocStatus, string> = {
  draft: "bg-white/10 text-white/60",
  sent: "bg-blue-500/15 text-blue-300",
  viewed: "bg-amber-500/15 text-amber-300",
  signed: "bg-emerald-500/15 text-emerald-300",
};

const LABELS: Record<DocStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
};

export default function StatusBadge({ status }: { status: DocStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
