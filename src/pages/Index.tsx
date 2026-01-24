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
import { Target, Users, ArrowRight, CheckCircle2, Loader2, TrendingUp, Sparkles, Trophy } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  
  // Set up real-time subscription for live updates
  useContributionsRealtime();
  
  const { data: stats, isLoading } = usePublicStats();
  
  const totalCollected = stats?.totalCollected ?? 0;
  const totalTarget = TOTAL_TARGET; // Fixed at 7,000 (10 members × 700)
  const memberCount = stats?.memberCount ?? 0;
  const completedCount = stats?.completedCount ?? 0;
  const inProgressCount = stats?.inProgressCount ?? 0;
  const progressPercentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  // Calculate average contribution per active member
  const activeMembers = completedCount + inProgressCount;
  const avgContribution = activeMembers > 0 ? Math.round(totalCollected / activeMembers) : 0;

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Final Stretch to May 1st!
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            FinalCommit Fund
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            One last contribution before the final celebration.
          </p>
        </section>

        {/* Overall Progress Card */}
        <section className="card-elevated p-6 md:p-8 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Overall Progress
              </h2>
              {progressPercentage >= 50 && (
                <Trophy className="w-4 h-4 text-warning animate-pulse" />
              )}
            </div>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
            )}
          </div>
          
          <ProgressBar value={totalCollected} max={totalTarget} size="lg" className="mb-6" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collected</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
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

        {/* Info Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Per Member Target */}
          <div className="card-elevated p-5 flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Per Member Target</p>
              <MoneyDisplay amount={TARGET_AMOUNT} size="md" />
              <p className="text-xs text-muted-foreground mt-1">× {TOTAL_MEMBERS} members = KES {TOTAL_TARGET.toLocaleString()}</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="card-elevated p-5 flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <CountdownTimer />
          </div>

          {/* Members Status */}
          <div className="card-elevated p-5 flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Members Joined</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <p className="text-lg font-semibold text-foreground">
                    {memberCount} of {TOTAL_MEMBERS}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {completedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                        <CheckCircle2 className="w-3 h-3" />
                        {completedCount} completed
                      </span>
                    )}
                    {inProgressCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                        <TrendingUp className="w-3 h-3" />
                        {inProgressCount} in progress
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
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{activeMembers}</p>
              <p className="text-xs text-muted-foreground">Active Contributors</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">KES {avgContribution.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Avg. Contribution</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">KES {(totalTarget - totalCollected).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{TOTAL_MEMBERS - memberCount}</p>
              <p className="text-xs text-muted-foreground">Spots Left</p>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 px-8">
                View My Contribution
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8 w-full sm:w-auto">
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
