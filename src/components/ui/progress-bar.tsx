import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ProgressBar({ 
  value, 
  max, 
  className,
  showLabel = false,
  size = 'md',
  animated = true
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  const prevValueRef = useRef(value);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  // Detect value changes and trigger update animation
  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsUpdating(true);
      prevValueRef.current = value;
      
      // Reset updating state after animation
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className={cn(
            "text-xs font-medium text-foreground transition-all duration-300",
            isUpdating && "scale-110 text-primary"
          )}>
            {percentage}%
          </span>
        </div>
      )}
      <div className={cn("progress-track", sizeClasses[size])}>
        <div 
          className={cn(
            animated ? "progress-fill-animated" : "progress-fill",
            isUpdating && "shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
