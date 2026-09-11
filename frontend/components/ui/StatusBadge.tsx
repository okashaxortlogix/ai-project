import React from "react";

export type BadgeVariant =
  | "active"
  | "connected"
  | "online"
  | "success"
  | "new"
  | "qualified"
  | "contacted"
  | "converted"
  | "lost"
  | "warning"
  | "pending"
  | "error"
  | "failed"
  | "neutral";

interface StatusBadgeProps {
  status?: string;
  label?: string;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  variant = "active",
  pulse = true,
  className = ""
}) => {
  const getStyles = () => {
    switch (variant.toLowerCase()) {
      case "active":
      case "connected":
      case "online":
      case "success":
      case "converted":
      case "qualified":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          dot: "bg-emerald-500"
        };
      case "new":
      case "contacted":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/80",
          dot: "bg-blue-500"
        };
      case "warning":
      case "pending":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/80",
          dot: "bg-amber-500"
        };
      case "error":
      case "failed":
      case "lost":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200/80",
          dot: "bg-rose-500"
        };
      case "neutral":
      default:
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400"
        };
    }
  };

  const style = getStyles();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style.bg} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${style.dot} ${
          pulse ? "badge-pulse" : ""
        }`}
      />
      {label || status || "Active"}
    </span>
  );
};

export default StatusBadge;
