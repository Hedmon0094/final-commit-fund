import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MoneyDisplay } from "@/components/ui/money-display";
import { CountdownTimer } from "@/components/CountdownTimer";
import { usePublicStats, useContributionsRealtime } from "@/hooks/useContributions";
import { useAuth } from "@/hooks/useAuth";
import { 
  TARGET_AMOUNT, 
  TOTAL_MEMBERS,
  TOTAL_TARGET,
} from "@/lib/constants";
import { Target, Users, ArrowRight, CheckCircle2, Loader2, TrendingUp, Trophy } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  
  // Set up real-time subscription for live updates
  useContributionsRealtime();
  
  const { data: stats, isLoading } = usePublicStats();
  
  const totalCollected = stats?.totalCollected ?? 0;
  const totalTarget = TOTAL_TARGET;
  const memberCount = stats?.memberCount ?? 0;
  const completedCount = stats?.completedCount ?? 0;
  const inProgressCount = stats?.inProgressCount ?? 0;
  const progressPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  // Calculate average contribution per active member
  const activeMembers = completedCount + inProgressCount;
  const avgContribution = activeMembers > 0 ? Math.round(totalCollected / activeMembers) : 0;

  return (
    <Layout>
      <div className="container py-10 md:py-16">
        {/* Hero Section */}
        <section className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 text-primary text-sm font-medium mb-5 animate-fade-in">
            <Trophy className="w-4 h-4" />
            <span>Final Stretch to May 1st</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
            FinalCommit<span className="text-primary">.</span>Fund
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            One last contribution before the celebration.
          </p>
        </section>

        {/* Main Progress Card */}
        <section className="card-elevated p-6 md:p-8 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-header mb-1">Overall Progress</p>
              <p className="text-sm text-muted-foreground">Group collection status</p>
            </div>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">{progressPercentage}%</span>
                {progressPercentage >= 50 && (
                  <Trophy className="w-4 h-4 text-warning inline-block ml-2 mb-1" />
                )}
              </div>
            )}
          </div>
          
          <ProgressBar value={totalCollected} max={totalTarget} size="lg" className="mb-8" />
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collected</p>
              {isLoading ? (
                <div className="h-8 w-28 bg-muted animate-pulse rounded-lg" />
              ) : (
                <div className="flex items-center gap-2">
                  <MoneyDisplay amount={totalCollected} size="lg" />
                  {totalCollected > 0 && (
                    <TrendingUp className="w-4 h-4 text-success" />
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Group Target</p>
              <MoneyDisplay amount={totalTarget} size="lg" muted />
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Per Member Target */}
          <div className="stat-card flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="stat-label">Per Member</p>
              <MoneyDisplay amount={TARGET_AMOUNT} size="md" />
              <p className="text-xs text-muted-foreground mt-1">
                × {TOTAL_MEMBERS} members
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="stat-card flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <CountdownTimer />
          </div>

          {/* Members Status */}
          <div className="stat-card flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="stat-label">Members</p>
              {isLoading ? (
                <div className="h-7 w-16 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <p className="stat-value">
                    {memberCount}<span className="text-muted-foreground font-normal">/{TOTAL_MEMBERS}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {completedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-success/10 text-success font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {completedCount}
                      </span>
                    )}
                    {inProgressCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-warning/10 text-warning font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {inProgressCount}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Quick Stats Row */}
        {!isLoading && activeMembers > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{activeMembers}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Active Contributors</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground font-mono">
                {avgContribution.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Avg. Contribution</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground font-mono">
                {(totalTarget - totalCollected).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Remaining (KES)</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{TOTAL_MEMBERS - memberCount}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Spots Left</p>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 px-8 shadow-sm">
                View My Contribution
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8 w-full sm:w-auto shadow-sm">
                  Join Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
