import { useEffect, useState } from "react";
import { DEADLINE } from "@/lib/constants";
import { Clock } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const now = new Date();
    const diff = DEADLINE.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && 
                    timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div className="text-center py-3 px-4 bg-destructive/10 rounded-lg">
        <p className="text-sm font-medium text-destructive">Deadline has passed</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Time remaining</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3">
        <TimeUnit value={timeLeft.days} label="days" />
        <Separator />
        <TimeUnit value={timeLeft.hours} label="hrs" />
        <Separator />
        <TimeUnit value={timeLeft.minutes} label="min" />
        <Separator />
        <TimeUnit value={timeLeft.seconds} label="sec" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums min-w-[2.5rem] text-center">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return <span className="text-muted-foreground/50 text-lg font-light">:</span>;
}
