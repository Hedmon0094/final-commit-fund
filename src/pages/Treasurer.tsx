import { Layout } from "@/components/layout/Layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  members, 
  getTotalCollected, 
  TOTAL_TARGET,
  getMemberStatus,
  getAllPayments,
  formatCurrency,
  getCompletedCount,
  getNotStartedCount,
  getDaysUntilDeadline,
} from "@/lib/data";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  User,
} from "lucide-react";

export default function Treasurer() {
  const totalCollected = getTotalCollected();
  const progressPercentage = Math.round((totalCollected / TOTAL_TARGET) * 100);
  const recentPayments = getAllPayments().slice(0, 5);
  const completedCount = getCompletedCount();
  const notStartedCount = getNotStartedCount();
  const daysLeft = getDaysUntilDeadline();

  // Members who need attention
  const membersNotStarted = members.filter(m => m.amountPaid === 0);
  const membersCloseToDeadline = members.filter(m => {
    const remaining = m.targetAmount - m.amountPaid;
    return remaining > 0 && remaining >= 300; // More than half remaining
  });

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Treasurer Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">
                Full visibility & fund management
              </p>
            </div>
          </div>
        </section>

        {/* Overview Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Collected</span>
            </div>
            <MoneyDisplay amount={totalCollected} size="lg" />
          </div>

          <div className="card-elevated p-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Expected</span>
            </div>
            <MoneyDisplay amount={TOTAL_TARGET} size="lg" muted />
          </div>

          <div className="card-elevated p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Completion</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{progressPercentage}%</p>
          </div>

          <div className="card-elevated p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Completed</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedCount}/{members.length}</p>
          </div>
        </section>

        {/* Admin Notices */}
        {(notStartedCount > 0 || membersCloseToDeadline.length > 0) && (
          <section className="mb-8 space-y-3">
            {notStartedCount > 0 && (
              <div className="card-elevated p-4 border-warning/30 bg-warning-muted/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {notStartedCount} member{notStartedCount > 1 ? 's' : ''} haven't started contributing
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {membersNotStarted.map(m => m.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {daysLeft <= 14 && membersCloseToDeadline.length > 0 && (
              <div className="card-elevated p-4 border-destructive/30 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {membersCloseToDeadline.length} member{membersCloseToDeadline.length > 1 ? 's' : ''} may not meet deadline
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {daysLeft} days left with significant balance remaining
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* All Members Table */}
          <section className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              All Members
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Name</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Paid</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Balance</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const status = getMemberStatus(member);
                    const balance = member.targetAmount - member.amountPaid;
                    return (
                      <tr key={member.id} className="border-b border-border last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                              {member.name.charAt(0)}
                            </div>
                            <span className="font-medium text-foreground">{member.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono text-foreground">
                          {formatCurrency(member.amountPaid)}
                        </td>
                        <td className="py-3 text-right font-mono text-muted-foreground">
                          {formatCurrency(balance)}
                        </td>
                        <td className="py-3 text-right">
                          <StatusBadge status={status} showIcon={false} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Payments */}
          <section className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Recent Payments
            </h2>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{payment.memberName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-foreground">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span className="text-xs text-success">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
