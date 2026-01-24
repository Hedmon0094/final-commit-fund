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
import { Calendar, ArrowRight, Clock, CheckCircle2, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: contributions = [], isLoading } = useMyContributions();
  const totalPaid = useMyTotal();
  
  const status = getMemberStatus(totalPaid);
  const remaining = Math.max(0, TARGET_AMOUNT - totalPaid);
  const daysLeft = getDaysUntilDeadline();
  const deadlinePassed = isDeadlinePassed();
  const isComplete = totalPaid >= TARGET_AMOUNT;
  const progressPercent = Math.round((totalPaid / TARGET_AMOUNT) * 100);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-lg w-1/3" />
            <div className="card-elevated p-6 h-52" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 pb-28 md:pb-12">
        {/* Page Header */}
        <header className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">My Contributions</h1>
              <p className="page-description">
                Welcome back, {profile?.name?.split(' ')[0] || 'Member'}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
        </header>

        {/* Main Progress Card */}
        <section className="card-elevated p-6 md:p-8 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="section-header mb-1">Contribution Progress</p>
              <p className="text-sm text-muted-foreground">
                {isComplete ? 'Target reached!' : `${progressPercent}% of your target`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{progressPercent}%</span>
            </div>
          </div>

          <ProgressBar 
            value={totalPaid} 
            max={TARGET_AMOUNT} 
            size="lg" 
            showLabel={false}
            className="mb-8"
          />

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
              <div className="flex items-center gap-2">
                <MoneyDisplay amount={totalPaid} size="lg" />
                {totalPaid > 0 && !isComplete && (
                  <TrendingUp className="w-4 h-4 text-success" />
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Target Amount</p>
              <MoneyDisplay amount={TARGET_AMOUNT} size="lg" muted />
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-3">
              {isComplete ? (
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="stat-label">{isComplete ? 'Completed' : 'Remaining'}</p>
            <MoneyDisplay 
              amount={isComplete ? totalPaid : remaining} 
              size="md" 
            />
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                daysLeft <= 7 ? 'bg-destructive/10' : daysLeft <= 14 ? 'bg-warning/10' : 'bg-muted'
              }`}>
                <Calendar className={`w-4 h-4 ${
                  daysLeft <= 7 ? 'text-destructive' : daysLeft <= 14 ? 'text-warning' : 'text-muted-foreground'
                }`} />
              </div>
            </div>
            <p className="stat-label">Deadline</p>
            <p className={`stat-value ${daysLeft <= 7 ? 'text-destructive' : ''}`}>
              {daysLeft > 0 ? `${daysLeft} days` : 'Passed'}
            </p>
          </div>
        </section>

        {/* Payment History */}
        <section className="card-elevated overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="p-6 border-b border-border/60">
            <h2 className="section-header">Payment History</h2>
          </div>
          
          {contributions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No payments yet. Start contributing today!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {contributions.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                Contribution completed!
              </p>
            </div>
          ) : deadlinePassed ? (
            <div className="text-center py-2">
              <p className="text-muted-foreground font-medium">
                Contribution period closed
              </p>
            </div>
          ) : (
            <Link to="/contribute">
              <Button className="w-full gap-2 shadow-sm" size="lg">
                Contribute Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Desktop CTA */}
        <section className="hidden md:block mt-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          {isComplete ? (
            <div className="notice-card-success p-6 text-center">
              <p className="text-success font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Contribution completed. Thank you for your support!
              </p>
            </div>
          ) : deadlinePassed ? (
            <div className="card-elevated p-6 text-center">
              <p className="text-muted-foreground font-medium">
                Contribution period has closed
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Link to="/contribute">
                <Button size="lg" className="gap-2 px-8 shadow-sm">
                  Contribute Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
