import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyDisplay } from "@/components/ui/money-display";
import { useMyTotal } from "@/hooks/useContributions";
import { TARGET_AMOUNT, formatCurrency } from "@/lib/constants";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Contribute() {
  const navigate = useNavigate();
  const totalPaid = useMyTotal();
  const remaining = Math.max(0, TARGET_AMOUNT - totalPaid);
  
  const [amount, setAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const numericAmount = parseInt(amount) || 0;
  const isValidPhone = /^(07|01|\+254|254)\d{8,9}$/.test(phoneNumber.replace(/\s+/g, ''));
  const isValidAmount = numericAmount > 0 && numericAmount <= remaining;

  const handleQuickAmount = (value: number) => {
    if (value <= remaining) {
      setAmount(value.toString());
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!isValidAmount) {
      setError('Please enter a valid amount');
      return;
    }
    if (!isValidPhone) {
      setError('Please enter a valid M-Pesa phone number (e.g., 0712345678)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          amount: numericAmount,
          phone_number: phoneNumber,
        },
      });

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Payment failed');
      }

      setSuccess(true);
      toast.success('STK Push sent! Complete payment on your phone.');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate payment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [100, 200, 350, remaining].filter((v, i, arr) => 
    v <= remaining && v > 0 && arr.indexOf(v) === i
  );

  if (success) {
    return (
      <Layout>
        <div className="container py-12 md:py-16 max-w-lg mx-auto">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
              Thank you!
            </h1>
            <p className="text-muted-foreground">
              Your contribution of {formatCurrency(numericAmount)} has been recorded.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (remaining === 0) {
    return (
      <Layout>
        <div className="container py-12 md:py-16 max-w-lg mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="card-elevated p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight mb-2">
              All Done!
            </h1>
            <p className="text-muted-foreground">
              You've already completed your contribution target.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-lg mx-auto pb-28 md:pb-12">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <header className="page-header">
          <h1 className="page-title">Make a Contribution</h1>
          <p className="page-description">
            Enter any amount up to your remaining balance
          </p>
        </header>

        {/* Remaining Balance Card */}
        <section className="card-elevated p-5 mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Remaining Balance</span>
            <MoneyDisplay amount={remaining} size="md" />
          </div>
        </section>

        {/* Amount Input */}
        <section className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <label className="block text-sm font-medium text-foreground mb-2">
            Contribution Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              KES
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0"
              className="pl-14 h-14 text-xl font-mono font-semibold"
              min={1}
              max={remaining}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            You can contribute any amount up to {formatCurrency(remaining)}
          </p>
        </section>

        {/* Phone Number Input */}
        <section className="mb-6 animate-fade-in" style={{ animationDelay: '0.12s' }}>
          <label className="block text-sm font-medium text-foreground mb-2">
            M-Pesa Phone Number
          </label>
          <div className="relative">
            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError(null);
              }}
              placeholder="0712345678"
              className="pl-12 h-14 text-lg font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enter the phone number registered with M-Pesa
          </p>
        </section>

        {/* Quick Amount Buttons */}
        {quickAmounts.length > 0 && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Quick select
            </p>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    numericAmount === quickAmount
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {quickAmount === remaining ? 'Pay All' : formatCurrency(quickAmount)}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/8 mb-6 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || !isValidPhone || isProcessing}
            className="w-full h-14 text-base gap-2 shadow-sm"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending STK Push...
              </>
            ) : (
              <>
                Pay with M-Pesa
                <Smartphone className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            You'll receive an M-Pesa prompt on your phone to complete payment
          </p>
        </section>
      </div>
    </Layout>
  );
}
