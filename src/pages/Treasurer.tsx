import { Layout } from "@/components/layout/Layout";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAllMembersWithContributions, useGroupStats, getMemberStatus } from "@/hooks/useContributions";
import { 
  TARGET_AMOUNT,
  formatCurrency,
  getDaysUntilDeadline,
} from "@/lib/constants";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  User,
} from "lucide-react";

export default function Treasurer() {
  const { data: members = [], isLoading } = useAllMembersWithContributions();
  const { totalCollected, totalTarget, progressPercentage, completedCount } = useGroupStats();
  const daysLeft = getDaysUntilDeadline();

  // Members who need attention
  const membersNotStarted = members.filter(m => m.totalPaid === 0);
  const membersCloseToDeadline = members.filter(m => {
    const remaining = TARGET_AMOUNT - m.totalPaid;
    return remaining > 0 && remaining >= 300;
  });

  // Get all payments sorted by date
  const allPayments = members
    .flatMap(m => m.contributions.map(c => ({ ...c, memberName: m.profile.name })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card-elevated p-5 h-24" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
            <MoneyDisplay amount={totalTarget} size="lg" muted />
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
        {(membersNotStarted.length > 0 || (daysLeft <= 14 && membersCloseToDeadline.length > 0)) && (
          <section className="mb-8 space-y-3">
            {membersNotStarted.length > 0 && (
              <div className="card-elevated p-4 border-warning/30 bg-warning-muted/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {membersNotStarted.length} member{membersNotStarted.length > 1 ? 's' : ''} haven't started contributing
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {membersNotStarted.map(m => m.profile.name).join(', ')}
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
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No members have joined yet.
              </p>
            ) : (
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
                      const status = getMemberStatus(member.totalPaid);
                      const balance = Math.max(0, TARGET_AMOUNT - member.totalPaid);
                      return (
                        <tr key={member.profile.id} className="border-b border-border last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                                {member.profile.name.charAt(0)}
                              </div>
                              <span className="font-medium text-foreground">{member.profile.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-mono text-foreground">
                            {formatCurrency(member.totalPaid)}
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
            )}
          </section>

          {/* Recent Payments */}
          <section className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Recent Payments
            </h2>
            {allPayments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No payments recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {allPayments.map((payment) => (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{payment.memberName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString('en-GB', {
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
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
