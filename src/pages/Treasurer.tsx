import { Layout } from "@/components/layout/Layout";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { useAllMembersWithContributions, useGroupStats, getMemberStatus, useContributionsRealtime } from "@/hooks/useContributions";
import { useAuth } from "@/hooks/useAuth";
import { 
  TARGET_AMOUNT,
  TOTAL_MEMBERS,
  TOTAL_TARGET,
  formatCurrency,
  getDaysUntilDeadline,
  DEADLINE,
} from "@/lib/constants";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  Users,
  Target,
  Calendar,
  Copy,
  UserPlus,
  Percent,
  ArrowUpRight,
  Crown,
  Mail,
  RefreshCw,
  BarChart3,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { ReminderManager } from "@/components/treasurer/ReminderManager";

export default function Treasurer() {
  const { profile } = useAuth();
  const { data: members = [], isLoading, refetch } = useAllMembersWithContributions();
  const treasurerStats = useGroupStats();
  const daysLeft = getDaysUntilDeadline();
  
  // Real-time updates
  useContributionsRealtime();
  
  // Use fixed total target
  const totalCollected = treasurerStats?.totalCollected ?? 0;
  const totalTarget = TOTAL_TARGET;
  const memberCount = members.length;
  const completedCount = treasurerStats?.completedCount ?? 0;
  const inProgressCount = treasurerStats?.inProgressCount ?? 0;
  const notStartedCount = members.filter(m => m.totalPaid === 0).length;
  const notJoinedCount = TOTAL_MEMBERS - memberCount;
  const progressPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  // Calculate additional stats
  const avgContribution = memberCount > 0 ? Math.round(totalCollected / memberCount) : 0;
  const remainingAmount = Math.max(0, totalTarget - totalCollected);

  // Members who need attention
  const membersNotStarted = members.filter(m => m.totalPaid === 0);
  const membersInProgress = members.filter(m => m.totalPaid > 0 && m.totalPaid < TARGET_AMOUNT);

  // Get all payments sorted by date
  const allPayments = members
    .flatMap(m => m.contributions.map(c => ({ ...c, memberName: m.profile.name })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  // Copy functions
  const copySignupLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/signup');
    toast({
      title: "Link Copied",
      description: "Signup link copied to clipboard",
    });
  };

  const copyProgressSummary = () => {
    const summary = `FinalCommit Fund Progress Update 📊
━━━━━━━━━━━━━━━━━━━━
💰 Collected: KES ${totalCollected.toLocaleString()} / ${totalTarget.toLocaleString()} (${progressPercentage}%)
👥 Members: ${memberCount} / ${TOTAL_MEMBERS} joined
✅ Completed: ${completedCount} members
⏳ In Progress: ${inProgressCount} members
📅 Days Left: ${daysLeft}
━━━━━━━━━━━━━━━━━━━━
Join now: ${window.location.origin}/signup`;
    
    navigator.clipboard.writeText(summary);
    toast({
      title: "Summary Copied",
      description: "Progress summary copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-lg w-1/3" />
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
        <header className="page-header">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="page-title">Treasurer Dashboard</h1>
                  <Crown className="w-5 h-5 text-warning" />
                </div>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Welcome back, {profile?.name || 'Treasurer'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh data">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Link to="/group">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Group View</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Progress Card */}
        <section className="card-elevated p-6 md:p-8 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Fund Collection Status</h2>
            </div>
            <span className="text-3xl font-bold text-primary">{progressPercentage}%</span>
          </div>
          
          <ProgressBar value={totalCollected} max={totalTarget} size="lg" className="mb-6" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="stat-label">Collected</p>
              <p className="text-xl font-bold text-success font-mono">{formatCurrency(totalCollected)}</p>
            </div>
            <div>
              <p className="stat-label">Remaining</p>
              <p className="text-xl font-bold text-warning font-mono">{formatCurrency(remainingAmount)}</p>
            </div>
            <div>
              <p className="stat-label">Group Target</p>
              <p className="text-xl font-bold text-foreground font-mono">{formatCurrency(totalTarget)}</p>
            </div>
            <div>
              <p className="stat-label">Days Left</p>
              <p className={`text-xl font-bold ${daysLeft <= 14 ? 'text-destructive' : 'text-foreground'}`}>
                {daysLeft}
              </p>
            </div>
          </div>
        </section>

        {/* Overview Stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="stat-card animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="stat-label">Per Member</p>
            <p className="stat-value font-mono">{formatCurrency(TARGET_AMOUNT)}</p>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="stat-label">Joined</p>
            <p className="stat-value">{memberCount}<span className="text-muted-foreground font-normal">/{TOTAL_MEMBERS}</span></p>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="stat-label">Completed</p>
            <p className="stat-value text-success">{completedCount}</p>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="stat-label">In Progress</p>
            <p className="stat-value text-warning">{inProgressCount}</p>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Percent className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="stat-label">Avg. Paid</p>
            <p className="stat-value font-mono">{formatCurrency(avgContribution)}</p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="card-elevated p-5 mb-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h3 className="section-header mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={copySignupLink}>
              <Copy className="w-4 h-4" />
              Copy Signup Link
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={copyProgressSummary}>
              <Mail className="w-4 h-4" />
              Copy Summary
            </Button>
            <Link to="/contribute">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Contribute
              </Button>
            </Link>
          </div>
        </section>

        {/* Admin Notices */}
        {(notJoinedCount > 0 || membersNotStarted.length > 0 || (daysLeft <= 14 && membersInProgress.length > 0)) && (
          <section className="mb-6 space-y-3">
            {notJoinedCount > 0 && (
              <div className="notice-card-info animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <UserPlus className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        {notJoinedCount} member{notJoinedCount > 1 ? 's' : ''} haven't signed up
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Share the signup link with remaining members
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copySignupLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {membersNotStarted.length > 0 && (
              <div className="notice-card-warning animate-fade-in" style={{ animationDelay: '0.35s' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {membersNotStarted.length} member{membersNotStarted.length > 1 ? 's' : ''} haven't contributed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {membersNotStarted.map(m => m.profile.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {daysLeft <= 14 && membersInProgress.length > 0 && (
              <div className="notice-card-error animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {membersInProgress.length} member{membersInProgress.length > 1 ? 's' : ''} still in progress
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Only {daysLeft} days left — deadline: {DEADLINE.toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* All Members Table */}
          <section className="card-elevated overflow-hidden animate-fade-in" style={{ animationDelay: '0.45s' }}>
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <h2 className="section-header">All Members ({memberCount})</h2>
              <div className="flex items-center gap-1 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-success/10 text-success font-medium">{completedCount}</span>
                <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning font-medium">{inProgressCount}</span>
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{notStartedCount}</span>
              </div>
            </div>
            
            {members.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No members have joined yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th className="text-right">Paid</th>
                      <th className="text-right">Balance</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...members]
                      .sort((a, b) => b.totalPaid - a.totalPaid)
                      .map((member) => {
                        const status = getMemberStatus(member.totalPaid);
                        const balance = Math.max(0, TARGET_AMOUNT - member.totalPaid);
                        const progressPercent = Math.min(100, Math.round((member.totalPaid / TARGET_AMOUNT) * 100));
                        
                        return (
                          <tr key={member.profile.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                  status === 'completed' 
                                    ? 'bg-success/10 text-success' 
                                    : status === 'in-progress'
                                      ? 'bg-warning/10 text-warning'
                                      : 'bg-muted text-muted-foreground'
                                }`}>
                                  {member.profile.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-foreground">{member.profile.name}</span>
                                    {member.profile.is_treasurer && (
                                      <Crown className="w-3 h-3 text-warning" />
                                    )}
                                  </div>
                                  <div className="w-16 h-1 bg-muted rounded-full overflow-hidden mt-1.5">
                                    <div 
                                      className={`h-full rounded-full transition-all ${
                                        status === 'completed' ? 'bg-success' : status === 'in-progress' ? 'bg-warning' : 'bg-muted'
                                      }`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-right font-mono text-foreground">
                              {formatCurrency(member.totalPaid)}
                            </td>
                            <td className="text-right font-mono text-muted-foreground">
                              {balance > 0 ? formatCurrency(balance) : '—'}
                            </td>
                            <td className="text-right">
                              <StatusBadge status={status} showIcon={false} />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/30">
                      <td className="font-semibold text-foreground">Total</td>
                      <td className="text-right font-mono font-semibold text-success">
                        {formatCurrency(totalCollected)}
                      </td>
                      <td className="text-right font-mono font-semibold text-warning">
                        {formatCurrency(remainingAmount)}
                      </td>
                      <td className="text-right text-xs text-muted-foreground font-medium">
                        {progressPercentage}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Recent Payments */}
          <section className="card-elevated overflow-hidden animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <h2 className="section-header">Recent Payments</h2>
              <span className="text-xs text-muted-foreground font-medium">
                {allPayments.length} transactions
              </span>
            </div>
            
            {allPayments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {allPayments.map((payment) => (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{payment.memberName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono font-semibold text-success text-sm">
                      +{formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Reminder Manager Section */}
        <section className="mt-6 animate-fade-in" style={{ animationDelay: '0.55s' }}>
          <ReminderManager />
        </section>

        {/* Fund Summary Footer */}
        <section className="mt-6 p-5 rounded-xl bg-muted/40 border border-border/60 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-muted-foreground">Target:</span>
                <span className="ml-2 font-semibold text-foreground">{TOTAL_MEMBERS} × {formatCurrency(TARGET_AMOUNT)} = {formatCurrency(totalTarget)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deadline:</span>
                <span className="ml-2 font-semibold text-foreground">{DEADLINE.toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Updated {new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
