import { Layout } from "@/components/layout/Layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAllMembersWithContributions, useGroupStats, getMemberStatus } from "@/hooks/useContributions";
import { TARGET_AMOUNT } from "@/lib/constants";
import { Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function GroupProgress() {
  const { data: members = [], isLoading } = useAllMembersWithContributions();
  const { totalCollected, totalTarget, progressPercentage, completedCount, inProgressCount, notStartedCount } = useGroupStats();

  // Sort members: completed first, then in-progress, then pending
  const sortedMembers = [...members].sort((a, b) => {
    const statusOrder = { 'completed': 0, 'in-progress': 1, 'pending': 2 };
    return statusOrder[getMemberStatus(a.totalPaid)] - statusOrder[getMemberStatus(b.totalPaid)];
  });

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
      <div className="container py-8 md:py-12">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Group Progress
          </h1>
          <p className="text-muted-foreground">
            See how our group is progressing toward the goal.
          </p>
        </section>

        {/* Overall Progress Card */}
        <section className="card-elevated p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Total Progress
            </h2>
            <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
          </div>

          <ProgressBar value={totalCollected} max={totalTarget || 1} size="lg" className="mb-6" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collected</p>
              <MoneyDisplay amount={totalCollected} size="sm" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <MoneyDisplay amount={Math.max(0, totalTarget - totalCollected)} size="sm" muted />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Target</p>
              <MoneyDisplay amount={totalTarget} size="sm" muted />
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-3 gap-3 mb-8">
          <div className="card-elevated p-4 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-8 h-8 rounded-full bg-success-muted flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <p className="text-xl font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>

          <div className="card-elevated p-4 text-center animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="w-8 h-8 rounded-full bg-warning-muted flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-warning" />
            </div>
            <p className="text-xl font-bold text-foreground">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>

          <div className="card-elevated p-4 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{notStartedCount}</p>
            <p className="text-xs text-muted-foreground">Not Started</p>
          </div>
        </section>

        {/* Members List */}
        <section className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              All Members
            </h2>
          </div>

          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No members have joined yet.
            </p>
          ) : (
            <div className="space-y-1">
              {sortedMembers.map((member, index) => {
                const status = getMemberStatus(member.totalPaid);
                return (
                  <div 
                    key={member.profile.id}
                    className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                        {member.profile.name.charAt(0)}
                      </div>
                      <span className="font-medium text-foreground">{member.profile.name}</span>
                    </div>
                    <StatusBadge status={status} showIcon={true} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
