import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { useMyContributions, useMyTotal, getMemberStatus } from "@/hooks/useContributions";
import { 
  TARGET_AMOUNT,
  getDaysUntilDeadline,
  isDeadlinePassed,
  formatCurrency,
} from "@/lib/constants";
import { Calendar, ArrowRight, Clock, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: contributions = [], isLoading } = useMyContributions();
  const totalPaid = useMyTotal();
  
  const status = getMemberStatus(totalPaid);
  const remaining = Math.max(0, TARGET_AMOUNT - totalPaid);
  const daysLeft = getDaysUntilDeadline();
  const deadlinePassed = isDeadlinePassed();
  const isComplete = totalPaid >= TARGET_AMOUNT;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="card-elevated p-6 h-48" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 pb-28 md:pb-12">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            My Contributions
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.name?.split(' ')[0] || 'Member'}
          </p>
        </section>

        {/* Status Card */}
        <section className="card-elevated p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Contribution Status
            </h2>
            <StatusBadge status={status} />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
              <MoneyDisplay amount={totalPaid} size="lg" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Target</p>
              <MoneyDisplay amount={TARGET_AMOUNT} size="lg" muted />
            </div>
          </div>

          <ProgressBar 
            value={totalPaid} 
            max={TARGET_AMOUNT} 
            size="md" 
            showLabel 
          />
        </section>

        {/* Remaining & Deadline */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="card-elevated p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Clock className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {isComplete ? 'Completed' : 'Remaining'}
              </span>
            </div>
            <MoneyDisplay 
              amount={isComplete ? 0 : remaining} 
              size="md" 
            />
          </div>

          <div className="card-elevated p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Deadline</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {daysLeft > 0 ? `${daysLeft} days` : 'Passed'}
            </p>
          </div>
        </section>

        {/* Payment History */}
        <section className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Payment History
          </h2>
          
          {contributions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No payments yet. Start contributing today!
            </p>
          ) : (
            <div className="space-y-3">
              {contributions.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="status-completed">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sticky CTA for Mobile */}
        <div className="sticky-footer md:hidden">
          {isComplete ? (
            <div className="text-center py-2">
              <p className="text-success font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Contribution completed. Thank you!
              </p>
            </div>
          ) : deadlinePassed ? (
            <div className="text-center py-2">
              <p className="text-muted-foreground font-medium">
                Contribution period closed.
              </p>
            </div>
          ) : (
            <Link to="/contribute">
              <Button className="w-full gap-2" size="lg">
                Contribute Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Desktop CTA */}
        <section className="hidden md:block mt-8 text-center animate-fade-in" style={{ animationDelay: '0.25s' }}>
          {isComplete ? (
            <div className="card-elevated p-6 bg-success-muted border-success/20">
              <p className="text-success font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Contribution completed. Thank you!
              </p>
            </div>
          ) : deadlinePassed ? (
            <div className="card-elevated p-6">
              <p className="text-muted-foreground font-medium">
                Contribution period closed.
              </p>
            </div>
          ) : (
            <Link to="/contribute">
              <Button size="lg" className="gap-2 px-8">
                Contribute Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </section>
      </div>
    </Layout>
  );
}
