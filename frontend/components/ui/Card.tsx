import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs transition-all duration-150 ${
        hoverable ? "hover:border-slate-300 hover:shadow-xs cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = "" }) => {
  return (
    <div
      className={`flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-100 ${className}`}
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default Card;
