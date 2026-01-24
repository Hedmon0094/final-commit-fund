import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useAllMembersWithContributions, useGroupStats, getMemberStatus, usePublicStats, useContributionsRealtime } from "@/hooks/useContributions";
import { useAuth } from "@/hooks/useAuth";
import { TARGET_AMOUNT, TOTAL_MEMBERS, TOTAL_TARGET } from "@/lib/constants";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Crown, 
  TrendingUp, 
  Trophy,
  UserPlus,
  Percent,
  Target,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";

export default function GroupProgress() {
  const { profile } = useAuth();
  const isTreasurer = profile?.is_treasurer ?? false;
  
  // Set up real-time updates
  useContributionsRealtime();
  
  // Use treasurer-specific or public stats based on role
  const { data: members = [], isLoading: membersLoading } = useAllMembersWithContributions();
  const { data: publicStats, isLoading: statsLoading } = usePublicStats();
  const treasurerStats = useGroupStats();
  
  const isLoading = isTreasurer ? membersLoading : statsLoading;
  
  // Use fixed total target of 7,000 (10 members × 700)
  const stats = isTreasurer ? treasurerStats : publicStats;
  const totalCollected = stats?.totalCollected ?? 0;
  const totalTarget = TOTAL_TARGET; // Always 7,000
  const progressPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;
  const completedCount = stats?.completedCount ?? 0;
  const inProgressCount = stats?.inProgressCount ?? 0;
  const memberCount = stats?.memberCount ?? 0;
  const notStartedCount = TOTAL_MEMBERS - completedCount - inProgressCount;
  const notJoinedCount = TOTAL_MEMBERS - memberCount;
  
  // State for expanded member details (treasurer only)
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Sort members: completed first, then in-progress, then pending
  const sortedMembers = [...members].sort((a, b) => {
    const statusOrder = { 'completed': 0, 'in-progress': 1, 'pending': 2 };
    return statusOrder[getMemberStatus(a.totalPaid)] - statusOrder[getMemberStatus(b.totalPaid)];
  });

  // Calculate milestones
  const milestones = [
    { percent: 25, amount: TOTAL_TARGET * 0.25, reached: totalCollected >= TOTAL_TARGET * 0.25 },
    { percent: 50, amount: TOTAL_TARGET * 0.5, reached: totalCollected >= TOTAL_TARGET * 0.5 },
    { percent: 75, amount: TOTAL_TARGET * 0.75, reached: totalCollected >= TOTAL_TARGET * 0.75 },
    { percent: 100, amount: TOTAL_TARGET, reached: totalCollected >= TOTAL_TARGET },
  ];

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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Group Progress
                </h1>
                {isTreasurer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Crown className="w-3 h-3" />
                    Treasurer View
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                {isTreasurer 
                  ? "Manage and track all member contributions."
                  : "See how our group is progressing toward the goal."}
              </p>
            </div>
            {isTreasurer && (
              <Link to="/treasurer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Treasurer Dashboard
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Overall Progress Card */}
        <section className="card-elevated p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Progress
              </h2>
              {progressPercentage >= 50 && (
                <Trophy className="w-4 h-4 text-warning animate-pulse" />
              )}
            </div>
            <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
          </div>

          <ProgressBar value={totalCollected} max={totalTarget} size="lg" className="mb-4" />

          {/* Milestone Markers */}
          <div className="flex justify-between mb-6 px-1">
            {milestones.map((milestone) => (
              <div 
                key={milestone.percent}
                className={`flex flex-col items-center ${milestone.reached ? 'text-success' : 'text-muted-foreground'}`}
              >
                <div className={`w-3 h-3 rounded-full mb-1 ${milestone.reached ? 'bg-success' : 'bg-muted'}`}>
                  {milestone.reached && <CheckCircle2 className="w-3 h-3 text-success-foreground" />}
                </div>
                <span className="text-xs font-medium">{milestone.percent}%</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collected</p>
              <div className="flex items-center justify-center gap-1">
                <MoneyDisplay amount={totalCollected} size="sm" />
                {totalCollected > 0 && <TrendingUp className="w-3 h-3 text-success" />}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <MoneyDisplay amount={Math.max(0, totalTarget - totalCollected)} size="sm" muted />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Group Target</p>
              <MoneyDisplay amount={totalTarget} size="sm" muted />
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="card-elevated p-4 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <p className="text-xl font-bold text-foreground">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>

          <div className="card-elevated p-4 text-center animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-2">
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

          <div className="card-elevated p-4 text-center animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
              <UserPlus className="w-4 h-4 text-secondary-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{notJoinedCount}</p>
            <p className="text-xs text-muted-foreground">Not Joined</p>
          </div>
        </section>

        {/* Quick Stats for Treasurer */}
        {isTreasurer && members.length > 0 && (
          <section className="grid grid-cols-3 gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="card-elevated p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground">KES {TARGET_AMOUNT}</p>
              <p className="text-xs text-muted-foreground">Per Member Target</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Percent className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {members.length > 0 ? Math.round(totalCollected / members.length) : 0}
              </p>
              <p className="text-xs text-muted-foreground">Avg. per Joined</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground">{memberCount} / {TOTAL_MEMBERS}</p>
              <p className="text-xs text-muted-foreground">Members Joined</p>
            </div>
          </section>
        )}

        {/* Members List */}
        <section className="card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {isTreasurer ? "All Members Details" : "Member Status"}
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {memberCount} joined
            </span>
          </div>

          {!isTreasurer ? (
            // Non-treasurer view: Show anonymous status list
            <div className="space-y-2">
              {completedCount > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-success/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm text-foreground">{completedCount} member{completedCount !== 1 ? 's' : ''} completed</span>
                  </div>
                  <span className="text-xs text-success font-medium">100%</span>
                </div>
              )}
              {inProgressCount > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-warning/5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-sm text-foreground">{inProgressCount} member{inProgressCount !== 1 ? 's' : ''} in progress</span>
                  </div>
                  <span className="text-xs text-warning font-medium">Contributing</span>
                </div>
              )}
              {notStartedCount > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{notStartedCount} member{notStartedCount !== 1 ? 's' : ''} not started</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
              )}
              {notJoinedCount > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-secondary-foreground" />
                    <span className="text-sm text-foreground">{notJoinedCount} spot{notJoinedCount !== 1 ? 's' : ''} available</span>
                  </div>
                  <span className="text-xs text-secondary-foreground">Not Joined</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center pt-2">
                Individual contribution details are private. Only the treasurer can view member specifics.
              </p>
            </div>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No members have joined yet.
            </p>
          ) : (
            // Treasurer view: Show detailed member list
            <div className="space-y-1">
              {sortedMembers.map((member) => {
                const status = getMemberStatus(member.totalPaid);
                const isExpanded = expandedMember === member.profile.id;
                const progressPercent = Math.min(100, Math.round((member.totalPaid / TARGET_AMOUNT) * 100));
                
                return (
                  <div key={member.profile.id} className="border-b border-border last:border-0">
                    <button 
                      onClick={() => setExpandedMember(isExpanded ? null : member.profile.id)}
                      className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          status === 'completed' 
                            ? 'bg-success/10 text-success' 
                            : status === 'in-progress'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {member.profile.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{member.profile.name}</span>
                            {member.profile.is_treasurer && (
                              <Crown className="w-3 h-3 text-warning" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>KES {member.totalPaid.toLocaleString()} / {TARGET_AMOUNT}</span>
                            <span>•</span>
                            <span>{progressPercent}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={status} showIcon={true} />
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 bg-muted/30 rounded-lg mx-2 mb-2 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Paid</p>
                            <MoneyDisplay amount={member.totalPaid} size="sm" />
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Remaining</p>
                            <MoneyDisplay amount={Math.max(0, TARGET_AMOUNT - member.totalPaid)} size="sm" muted />
                          </div>
                        </div>
                        
                        <ProgressBar 
                          value={member.totalPaid} 
                          max={TARGET_AMOUNT} 
                          size="sm" 
                          className="mb-3" 
                        />
                        
                        {member.contributions.length > 0 && (
                          <div className="border-t border-border pt-3">
                            <p className="text-xs text-muted-foreground mb-2">
                              {member.contributions.length} contribution{member.contributions.length !== 1 ? 's' : ''}
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {member.contributions.map((contrib) => (
                                <div 
                                  key={contrib.id}
                                  className="flex items-center justify-between text-xs py-1"
                                >
                                  <span className="text-muted-foreground">
                                    {new Date(contrib.created_at).toLocaleDateString('en-KE', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    KES {contrib.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Expected Members Not Yet Joined (Treasurer Only) */}
        {isTreasurer && notJoinedCount > 0 && (
          <section className="card-elevated p-6 mt-6 animate-fade-in border-dashed border-2 border-muted" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Awaiting Sign Up ({notJoinedCount})
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {notJoinedCount} of {TOTAL_MEMBERS} expected members haven't joined yet. Share the signup link with them.
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => {
              navigator.clipboard.writeText(window.location.origin + '/signup');
            }}>
              <Mail className="w-4 h-4" />
              Copy Signup Link
            </Button>
          </section>
        )}
      </div>
    </Layout>
  );
}