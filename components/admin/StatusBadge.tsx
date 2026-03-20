type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  const base = "inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize";

  const map: Record<string, string> = {
    new: "border-gray-300 bg-gray-50",
    accepted: "border-blue-300 bg-blue-50",
    preparing: "border-yellow-300 bg-yellow-50",
    ready: "border-green-300 bg-green-50",
    completed: "border-emerald-400 bg-emerald-50",
    cancelled: "border-red-300 bg-red-50"
  };

  return <span className={`${base} ${map[status] || "border-gray-300 bg-gray-50"}`}>{status}</span>;
}
