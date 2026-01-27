import { Link } from 'react-router-dom';
import { Terminal, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
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
          
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to your email address. 
            Please click the link to verify your account and complete your registration.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-foreground mb-2">Didn't receive the email?</h3>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>

          <Button asChild className="w-full h-11">
            <Link to="/login">
              Continue to Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Need help?{' '}
            <Link to="/" className="text-primary font-medium hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
