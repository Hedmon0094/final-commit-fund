// Fund configuration constants
export const TARGET_AMOUNT = 700;
export const DEADLINE = new Date('2026-05-01');
export const TOTAL_MEMBERS = 10;
export const TOTAL_TARGET = TARGET_AMOUNT * TOTAL_MEMBERS;

export const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

export const getDaysUntilDeadline = () => {
  const now = new Date();
  const diff = DEADLINE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const isDeadlinePassed = () => new Date() > DEADLINE;
