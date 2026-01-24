import { useEffect, useState } from "react";
import { DEADLINE } from "@/lib/constants";
import { Clock, AlertTriangle } from "lucide-react";

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
  const isUrgent = timeLeft.days <= 7;

  if (isExpired) {
    return (
      <div className="text-center py-4 px-5">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <p className="text-sm font-semibold text-destructive">Deadline passed</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-warning' : ''}`} />
        <span>Time remaining</span>
      </div>
      <div className="flex items-center gap-0.5">
        <TimeUnit value={timeLeft.days} label="days" isUrgent={isUrgent} />
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

function TimeUnit({ value, label, isUrgent = false }: { value: number; label: string; isUrgent?: boolean }) {
  return (
    <div className="flex flex-col items-center px-1.5">
      <span className={`text-xl sm:text-2xl font-bold tabular-nums font-mono min-w-[2.25rem] text-center ${
        isUrgent ? 'text-warning' : 'text-foreground'
      }`}>
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span className="text-muted-foreground/40 text-lg font-light self-start mt-1">:</span>
  );
}
