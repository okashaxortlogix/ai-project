import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none";

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs font-semibold px-3.5 py-2 gap-2",
    lg: "text-sm font-semibold px-4 py-2.5 gap-2.5"
  };

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-xs focus:ring-blue-500 border border-transparent",
    secondary:
      "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-2xs hover:border-slate-300 focus:ring-slate-300",
    outline:
      "bg-transparent text-slate-700 hover:bg-slate-100 border border-slate-300 focus:ring-slate-300",
    destructive:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs focus:ring-rose-500 border border-transparent",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border-transparent"
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return <span className="shrink-0">{icon}</span>;
    if (typeof icon === "function" || typeof icon === "object") {
      const IconComp = icon as React.ComponentType<{ className?: string }>;
      return <IconComp className="w-3.5 h-3.5 shrink-0" />;
    }
    return <span className="shrink-0">{icon as React.ReactNode}</span>;
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        renderIcon()
      )}
      {children}
    </button>
  );
};

export default Button;
