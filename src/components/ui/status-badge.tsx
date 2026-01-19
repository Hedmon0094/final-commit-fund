import { cn } from "@/lib/utils";
import { Check, Clock, AlertCircle } from "lucide-react";

type Status = 'completed' | 'in-progress' | 'pending';

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  'completed': {
    label: 'Completed',
    className: 'status-completed',
    icon: Check,
  },
  'in-progress': {
    label: 'In Progress',
    className: 'status-in-progress',
    icon: Clock,
  },
  'pending': {
    label: 'Not Started',
    className: 'status-pending',
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(config.className, "inline-flex items-center gap-1", className)}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
