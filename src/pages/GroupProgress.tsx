import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MoneyDisplay } from "@/components/ui/money-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { useAllMembersWithContributions, useGroupStats, getMemberStatus, usePublicStats, useContributionsRealtime } from "@/hooks/useContributions";
import { useAuth } from "@/hooks/useAuth";
import { TARGET_AMOUNT, TOTAL_MEMBERS, TOTAL_TARGET, formatCurrency } from "@/lib/constants";
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
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

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
  const totalTarget = TOTAL_TARGET;
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
    { percent: 25, reached: totalCollected >= TOTAL_TARGET * 0.25 },
    { percent: 50, reached: totalCollected >= TOTAL_TARGET * 0.5 },
    { percent: 75, reached: totalCollected >= TOTAL_TARGET * 0.75 },
    { percent: 100, reached: totalCollected >= TOTAL_TARGET },
  ];

  const copySignupLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/signup');
    toast({
      title: "Link Copied",
      description: "Signup link copied to clipboard",
    });
  };

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
      <div className="container py-8 md:py-12">
        {/* Header */}
        <header className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="page-title">Group Progress</h1>
                {isTreasurer && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    <Crown className="w-3 h-3" />
                    Treasurer View
                  </span>
                )}
              </div>
              <p className="page-description">
                {isTreasurer 
                  ? "Manage and track all member contributions"
                  : "See how our group is progressing toward the goal"}
              </p>
            </div>
            {isTreasurer && (
              <Link to="/treasurer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Overall Progress Card */}
        <section className="card-elevated p-6 md:p-8 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-header mb-1">Total Progress</p>
              <p className="text-sm text-muted-foreground">Group collection status</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">{progressPercentage}%</span>
              {progressPercentage >= 50 && (
                <Trophy className="w-5 h-5 text-warning" />
              )}
            </div>
          </div>

          <ProgressBar value={totalCollected} max={totalTarget} size="lg" className="mb-5" />

          {/* Milestone Markers */}
          <div className="flex justify-between mb-8 px-1">
            {milestones.map((milestone) => (
              <div 
                key={milestone.percent}
                className={`flex flex-col items-center ${milestone.reached ? 'text-success' : 'text-muted-foreground'}`}
              >
                <div className={`w-3 h-3 rounded-full mb-1.5 ${milestone.reached ? 'bg-success' : 'bg-muted'}`} />
                <span className="text-xs font-medium">{milestone.percent}%</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collected</p>
              <div className="flex items-center gap-2">
                <MoneyDisplay amount={totalCollected} size="md" />
                {totalCollected > 0 && <TrendingUp className="w-4 h-4 text-success" />}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <MoneyDisplay amount={Math.max(0, totalTarget - totalCollected)} size="md" muted />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Target</p>
              <MoneyDisplay amount={totalTarget} size="md" muted />
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="stat-card text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <p className="stat-value text-success">{completedCount}</p>
            <p className="stat-label mt-1">Completed</p>
          </div>

          <div className="stat-card text-center animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="stat-value text-warning">{inProgressCount}</p>
            <p className="stat-label mt-1">In Progress</p>
          </div>

          <div className="stat-card text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="stat-value">{notStartedCount}</p>
            <p className="stat-label mt-1">Not Started</p>
          </div>

          <div className="stat-card text-center animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <p className="stat-value">{notJoinedCount}</p>
            <p className="stat-label mt-1">Not Joined</p>
          </div>
        </section>

        {/* Quick Stats for Treasurer */}
        {isTreasurer && members.length > 0 && (
          <section className="grid grid-cols-3 gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="card-elevated p-4 text-center">
              <Target className="w-4 h-4 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground font-mono">{formatCurrency(TARGET_AMOUNT)}</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Per Member</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <Percent className="w-4 h-4 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground font-mono">
                {members.length > 0 ? formatCurrency(Math.round(totalCollected / members.length)) : '0'}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Avg. Contribution</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <Users className="w-4 h-4 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{memberCount}<span className="text-muted-foreground font-normal">/{TOTAL_MEMBERS}</span></p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Joined</p>
            </div>
          </section>
        )}

        {/* Members List */}
        <section className="card-elevated overflow-hidden animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="section-header">
                {isTreasurer ? "All Members" : "Member Status"}
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {memberCount} joined
            </span>
          </div>

          {!isTreasurer ? (
            // Non-treasurer view: Show anonymous status list
            <div className="p-4 space-y-2">
              {completedCount > 0 && (
                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-success/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-foreground">{completedCount} member{completedCount !== 1 ? 's' : ''} completed</span>
                  </div>
                  <span className="text-xs text-success font-semibold">100%</span>
                </div>
              )}
              {inProgressCount > 0 && (
                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-warning/5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-foreground">{inProgressCount} member{inProgressCount !== 1 ? 's' : ''} in progress</span>
                  </div>
                  <span className="text-xs text-warning font-semibold">Contributing</span>
                </div>
              )}
              {notStartedCount > 0 && (
                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{notStartedCount} member{notStartedCount !== 1 ? 's' : ''} not started</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Pending</span>
                </div>
              )}
              {notJoinedCount > 0 && (
                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{notJoinedCount} spot{notJoinedCount !== 1 ? 's' : ''} available</span>
                  </div>
                  <span className="text-xs text-primary font-semibold">Not Joined</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center pt-3">
                Individual details are private. Only the treasurer can view member specifics.
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No members have joined yet.</p>
            </div>
          ) : (
            // Treasurer view: Show detailed member list
            <div className="divide-y divide-border/60">
              {sortedMembers.map((member) => {
                const status = getMemberStatus(member.totalPaid);
                const isExpanded = expandedMember === member.profile.id;
                const progressPercent = Math.min(100, Math.round((member.totalPaid / TARGET_AMOUNT) * 100));
                
                return (
                  <div key={member.profile.id}>
                    <button 
                      onClick={() => setExpandedMember(isExpanded ? null : member.profile.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                          status === 'completed' 
                            ? 'bg-success/10 text-success' 
                            : status === 'in-progress'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono">{formatCurrency(member.totalPaid)} / {formatCurrency(TARGET_AMOUNT)}</span>
                            <span>•</span>
                            <span>{progressPercent}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
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
                      <div className="px-5 pb-5 pt-2 bg-muted/20 mx-4 mb-4 rounded-xl animate-fade-in">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
                          className="mb-4" 
                        />
                        
                        {member.contributions.length > 0 && (
                          <div className="border-t border-border/60 pt-4">
                            <p className="text-xs text-muted-foreground font-medium mb-2">
                              {member.contributions.length} contribution{member.contributions.length !== 1 ? 's' : ''}
                            </p>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
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
                                  <span className="font-mono font-medium text-foreground">
                                    {formatCurrency(contrib.amount)}
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
          <section className="card-elevated p-6 mt-6 animate-fade-in border-dashed border-2" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              <h2 className="section-header">Awaiting Sign Up ({notJoinedCount})</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {notJoinedCount} of {TOTAL_MEMBERS} expected members haven't joined yet.
            </p>
            <Button variant="outline" size="sm" className="gap-2" onClick={copySignupLink}>
              <Mail className="w-4 h-4" />
              Copy Signup Link
            </Button>
          </section>
        )}
      </div>
    </Layout>
  );
}
