import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Terminal, Mail, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    if (!email) {
      toast.error('Email not found. Please sign up again.');
      return;
    }

    setLoading(true);
    
    try {
      // Use our custom verification endpoint
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { email, code: otp },
      });

      if (error) {
        toast.error(error.message || 'Verification failed');
        setLoading(false);
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Invalid or expired verification code');
        setLoading(false);
        return;
      }

      toast.success('Email verified successfully!');
      
      // Sign in the user after verification
      // They'll need to log in with their credentials
      navigate('/login?verified=true');
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email not found. Please sign up again.');
      return;
    }

    setResending(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: { email },
      });

      if (error) {
        toast.error(error.message || 'Failed to resend code');
      } else {
        toast.success('Verification code sent! Check your email.');
      }
    } catch (err: any) {
      console.error('Resend error:', err);
      toast.error('Failed to resend code. Please try again.');
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
            Verify your email
          </h1>
          
          <p className="text-muted-foreground mb-2">
            We've sent a 6-digit verification code to
          </p>
          {email && (
            <p className="font-medium text-foreground mb-6">
              {email}
            </p>
          )}

          <div className="flex justify-center mb-6">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerify} 
            className="w-full h-11 mb-4" 
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify Email
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-foreground mb-2">Didn't receive the code?</h3>
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
                  Resend code
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
        </div>
      </div>
    </div>
  );
}
