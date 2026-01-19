// Mock data for FinalCommit Fund

export interface Member {
  id: string;
  name: string;
  email: string;
  amountPaid: number;
  targetAmount: number;
  payments: Payment[];
  isAdmin?: boolean;
}

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export const TARGET_AMOUNT = 700;
export const DEADLINE = new Date('2025-05-01');
export const TOTAL_MEMBERS = 10;
export const TOTAL_TARGET = TARGET_AMOUNT * TOTAL_MEMBERS;

export const members: Member[] = [
  {
    id: '1',
    name: 'Alex Mwangi',
    email: 'alex@example.com',
    amountPaid: 700,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p1', memberId: '1', amount: 300, date: '2025-01-10', status: 'completed' },
      { id: 'p2', memberId: '1', amount: 400, date: '2025-01-15', status: 'completed' },
    ],
  },
  {
    id: '2',
    name: 'Brian Ochieng',
    email: 'brian@example.com',
    amountPaid: 500,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p3', memberId: '2', amount: 200, date: '2025-01-12', status: 'completed' },
      { id: 'p4', memberId: '2', amount: 300, date: '2025-01-18', status: 'completed' },
    ],
  },
  {
    id: '3',
    name: 'Caroline Wanjiku',
    email: 'caroline@example.com',
    amountPaid: 350,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p5', memberId: '3', amount: 350, date: '2025-01-14', status: 'completed' },
    ],
  },
  {
    id: '4',
    name: 'David Kamau',
    email: 'david@example.com',
    amountPaid: 700,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p6', memberId: '4', amount: 700, date: '2025-01-08', status: 'completed' },
    ],
  },
  {
    id: '5',
    name: 'Eva Njeri',
    email: 'eva@example.com',
    amountPaid: 200,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p7', memberId: '5', amount: 200, date: '2025-01-16', status: 'completed' },
    ],
  },
  {
    id: '6',
    name: 'Felix Otieno',
    email: 'felix@example.com',
    amountPaid: 0,
    targetAmount: TARGET_AMOUNT,
    payments: [],
  },
  {
    id: '7',
    name: 'Grace Akinyi',
    email: 'grace@example.com',
    amountPaid: 450,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p8', memberId: '7', amount: 250, date: '2025-01-11', status: 'completed' },
      { id: 'p9', memberId: '7', amount: 200, date: '2025-01-17', status: 'completed' },
    ],
  },
  {
    id: '8',
    name: 'Hassan Ali',
    email: 'hassan@example.com',
    amountPaid: 100,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p10', memberId: '8', amount: 100, date: '2025-01-19', status: 'completed' },
    ],
    isAdmin: true,
  },
  {
    id: '9',
    name: 'Irene Chebet',
    email: 'irene@example.com',
    amountPaid: 600,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p11', memberId: '9', amount: 400, date: '2025-01-09', status: 'completed' },
      { id: 'p12', memberId: '9', amount: 200, date: '2025-01-13', status: 'completed' },
    ],
  },
  {
    id: '10',
    name: 'James Kiprop',
    email: 'james@example.com',
    amountPaid: 350,
    targetAmount: TARGET_AMOUNT,
    payments: [
      { id: 'p13', memberId: '10', amount: 150, date: '2025-01-15', status: 'completed' },
      { id: 'p14', memberId: '10', amount: 200, date: '2025-01-20', status: 'completed' },
    ],
  },
];

export const getTotalCollected = () => members.reduce((sum, m) => sum + m.amountPaid, 0);
export const getTotalRemaining = () => TOTAL_TARGET - getTotalCollected();
export const getCompletedCount = () => members.filter(m => m.amountPaid >= m.targetAmount).length;
export const getInProgressCount = () => members.filter(m => m.amountPaid > 0 && m.amountPaid < m.targetAmount).length;
export const getNotStartedCount = () => members.filter(m => m.amountPaid === 0).length;

export const getMemberStatus = (member: Member): 'completed' | 'in-progress' | 'pending' => {
  if (member.amountPaid >= member.targetAmount) return 'completed';
  if (member.amountPaid > 0) return 'in-progress';
  return 'pending';
};

export const getDaysUntilDeadline = () => {
  const now = new Date();
  const diff = DEADLINE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const isDeadlinePassed = () => new Date() > DEADLINE;

export const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

export const getAllPayments = () => {
  return members
    .flatMap(m => m.payments.map(p => ({ ...p, memberName: m.name })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
