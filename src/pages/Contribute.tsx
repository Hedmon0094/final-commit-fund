import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyDisplay } from "@/components/ui/money-display";
import { members, formatCurrency } from "@/lib/data";
import { ArrowLeft, Loader2, ExternalLink, AlertCircle } from "lucide-react";

// Simulating current logged-in member
const CURRENT_MEMBER_ID = '3';

export default function Contribute() {
  const navigate = useNavigate();
  const member = members.find(m => m.id === CURRENT_MEMBER_ID)!;
  const remaining = member.targetAmount - member.amountPaid;
  
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setIsLoading(true);
    setError(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In real app, this would redirect to payment gateway
    // For now, show success and go back
    setIsLoading(false);
    navigate('/dashboard');
  };

  const quickAmounts = [100, 200, 350, remaining].filter((v, i, arr) => 
    v <= remaining && arr.indexOf(v) === i
  );

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
            disabled={!isValidAmount || isLoading}
            className="w-full h-14 text-base gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Payment Link...
              </>
            ) : (
              <>
                Generate Payment Link
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            You will be redirected to a secure payment page.
          </p>
        </section>
      </div>
    </Layout>
  );
}
