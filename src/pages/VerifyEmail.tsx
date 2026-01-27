import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Terminal, Mail, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error('Email not found. Please sign up again.');
      return;
    }

    setResending(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: { 
          email,
          redirectUrl: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to resend verification email');
      } else {
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error('Resend error:', err);
      toast.error('Failed to resend email. Please try again.');
    }
    
    setResending(false);
  };

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
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
            Check your email
          </h1>
          
          <p className="text-muted-foreground mb-2">
            We've sent a verification link to
          </p>
          {email && (
            <p className="font-medium text-foreground mb-6">
              {email}
            </p>
          )}

          <p className="text-muted-foreground mb-6">
            Click the link in your email to verify your account and start contributing.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-foreground mb-2">Didn't receive the email?</h3>
            <ul className="text-sm text-muted-foreground space-y-1 text-left mb-3">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
            </ul>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend verification email
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Wrong email?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up again
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already verified?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
