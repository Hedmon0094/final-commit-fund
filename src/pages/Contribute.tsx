import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyDisplay } from "@/components/ui/money-display";
import { useMyTotal, useAddContribution } from "@/hooks/useContributions";
import { TARGET_AMOUNT, formatCurrency } from "@/lib/constants";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Contribute() {
  const navigate = useNavigate();
  const totalPaid = useMyTotal();
  const remaining = Math.max(0, TARGET_AMOUNT - totalPaid);
  const addContribution = useAddContribution();
  
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const numericAmount = parseInt(amount) || 0;
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

    try {
      await addContribution.mutateAsync(numericAmount);
      setSuccess(true);
      toast.success('Contribution recorded successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to record contribution');
    }
  };

  const quickAmounts = [100, 200, 350, remaining].filter((v, i, arr) => 
    v <= remaining && v > 0 && arr.indexOf(v) === i
  );

  if (success) {
    return (
      <Layout>
        <div className="container py-8 md:py-12 max-w-lg mx-auto">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success-muted flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Thank you!</h1>
            <p className="text-muted-foreground">Your contribution of {formatCurrency(numericAmount)} has been recorded.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (remaining === 0) {
    return (
      <Layout>
        <div className="container py-8 md:py-12 max-w-lg mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="card-elevated p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">All Done!</h1>
            <p className="text-muted-foreground">You've already completed your contribution target.</p>
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
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <section className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Make a Contribution
          </h1>
          <p className="text-muted-foreground">
            Enter any amount up to your remaining balance.
          </p>
        </section>

        {/* Remaining Balance Card */}
        <section className="card-elevated p-5 mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Remaining Balance</span>
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

        {/* Quick Amount Buttons */}
        {quickAmounts.length > 0 && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <p className="text-xs text-muted-foreground mb-3">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    numericAmount === quickAmount
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
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
          <div className="flex items-center gap-2 text-destructive text-sm mb-4 animate-fade-in">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleSubmit}
            disabled={!isValidAmount || addContribution.isPending}
            className="w-full h-14 text-base gap-2"
            size="lg"
          >
            {addContribution.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm Contribution
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Your contribution will be recorded immediately.
          </p>
        </section>
      </div>
    </Layout>
  );
}
