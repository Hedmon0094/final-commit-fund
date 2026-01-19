import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  muted?: boolean;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export function MoneyDisplay({ 
  amount, 
  currency = 'KES',
  size = 'md',
  className,
  muted = false,
}: MoneyDisplayProps) {
  return (
    <span className={cn(
      "money-display",
      sizeClasses[size],
      muted ? "text-muted-foreground" : "text-foreground",
      className
    )}>
      <span className="text-muted-foreground font-normal">{currency} </span>
      {amount.toLocaleString()}
    </span>
  );
}
