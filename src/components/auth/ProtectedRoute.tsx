import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProfileCompletionModal } from '@/components/profile/ProfileCompletionModal';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireTreasurer?: boolean;
}

export function ProtectedRoute({ children, requireTreasurer = false }: ProtectedRouteProps) {
  const { user, profile, loading, isOnboardingComplete, refreshProfile } = useAuth();
  const location = useLocation();

  const isEmailVerified = !!(user?.email_confirmed_at || user?.confirmed_at);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Block access to protected pages until email is verified
  if (!isEmailVerified) {
    const emailParam = user.email ? `?email=${encodeURIComponent(user.email)}` : '';
    return <Navigate to={`/verify-email${emailParam}`} replace />;
  }

  if (requireTreasurer && !profile?.is_treasurer) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show profile completion modal only for first-time users (onboarding not completed)
  if (profile && !isOnboardingComplete) {
    return (
      <>
        {children}
        <ProfileCompletionModal 
          open={true} 
          onComplete={() => refreshProfile()} 
        />
      </>
    );
  }

  return <>{children}</>;
}
