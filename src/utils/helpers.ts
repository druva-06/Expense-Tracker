export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    return `₹${amount.toFixed(2)}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today';
  }

  if (dateString === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const toDateString = (date: Date): string => date.toISOString().split('T')[0];

export const getMonthStart = (): string => {
  const date = new Date();
  date.setDate(1);
  return toDateString(date);
};

export const getMonthEnd = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return toDateString(date);
};

export const getDateRangeForPeriod = (
  year: number,
  month?: number | null
): { fromDate: string; toDate: string } => {
  if (!month) {
    return {
      fromDate: `${year}-01-01`,
      toDate: `${year}-12-31`,
    };
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    fromDate: toDateString(start),
    toDate: toDateString(end),
  };
};

export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
