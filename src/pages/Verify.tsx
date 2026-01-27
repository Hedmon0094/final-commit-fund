import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setStatus('error');
        setErrorMessage('Invalid verification link. Please request a new one.');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-code', {
          body: { email, token },
        });

        if (error) {
          setStatus('error');
          setErrorMessage(error.message || 'Verification failed');
          return;
        }

        if (!data?.success) {
          setStatus('error');
          setErrorMessage(data?.error || 'Invalid or expired verification link');
          return;
        }

        setStatus('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMessage('Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [token, email, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-5">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <Terminal className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">FinalCommit</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-md text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                Verifying your email...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                Email verified!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your email has been verified successfully. Redirecting you to login...
              </p>
              <Button asChild>
                <Link to="/login?verified=true">
                  Go to Login
                </Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                Verification failed
              </h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/signup">
                    Sign up again
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/login">
                    Go to Login
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
