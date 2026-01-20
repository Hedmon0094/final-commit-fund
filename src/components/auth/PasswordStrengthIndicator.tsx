import { getPasswordStrength } from '@/lib/validations';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);

  return (
    <div className="space-y-1.5 animate-fade-in">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className={cn(
        'text-xs font-medium',
        score <= 25 && 'text-destructive',
        score === 50 && 'text-warning',
        score >= 75 && 'text-success'
      )}>
        Password strength: {label}
      </p>
    </div>
  );
}
