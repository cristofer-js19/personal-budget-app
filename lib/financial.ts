import Big from 'big.js';
import { Transaction, Category, TransactionType } from './types';

export interface CategoryTotal {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
  amount: Big;
  percentage: number;
}

export interface MonthlyProjection {
  monthsAhead: number;
  projectedIncome: Big;
  projectedExpense: Big;
  projectedBalance: Big;
  projectedSavingsRate: number;
  averageMonthlyIncome: Big;
  averageMonthlyExpense: Big;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  amount?: Big;
}

/**
 * Safely converts an input value to a Big instance.
 */
export function toBig(value: string | number | Big): Big {
  if (value instanceof Big) {
    return value;
  }
  if (typeof value === 'number') {
    return new Big(value);
  }
  const cleanStr = String(value).trim().replace(',', '.');
  if (!cleanStr || isNaN(Number(cleanStr))) {
    throw new Error(`Invalid monetary value: "${value}"`);
  }
  return new Big(cleanStr);
}

/**
 * Validates monetary inputs according to Rule 1 (Signed convention - Option A):
 * - Revenue inputs must be strictly positive (> 0); negative inputs are rejected.
 * - Expense inputs must be strictly negative (< 0); positive inputs are rejected.
 */
export function validateTransactionInput(
  rawAmount: string | number | Big,
  type: TransactionType
): ValidationResult {
  let bigVal: Big;
  try {
    bigVal = toBig(rawAmount);
  } catch {
    return {
      valid: false,
      error: 'Por favor, informe um valor numérico válido.',
    };
  }

  if (bigVal.eq(0)) {
    return {
      valid: false,
      error: 'O valor da transação não pode ser zero.',
    };
  }

  if (type === 'income') {
    if (bigVal.lt(0)) {
      return {
        valid: false,
        error: 'Receitas devem ter valor positivo. Valores negativos são rejeitados.',
      };
    }
    return {
      valid: true,
      amount: bigVal,
    };
  }

  if (type === 'expense') {
    if (bigVal.gt(0)) {
      return {
        valid: false,
        error: 'Despesas devem ter valor negativo (ex: -150,00). Valores positivos são rejeitados.',
      };
    }
    return {
      valid: true,
      amount: bigVal,
    };
  }

  return {
    valid: false,
    error: 'Tipo de transação inválido.',
  };
}

/**
 * Normalizes transaction amount magnitude to positive Big for category/flow comparisons.
 */
export function getAbsoluteAmount(amount: string | number | Big): Big {
  const b = toBig(amount);
  return b.abs();
}

/**
 * Calculates net balance: total income minus total expense using Big.js precision.
 */
export function calculateBalance(transactions: Transaction[]): Big {
  let total = new Big(0);

  for (const t of transactions) {
    const val = getAbsoluteAmount(t.amount);
    if (t.type === 'income') {
      total = total.plus(val);
    } else {
      total = total.minus(val);
    }
  }

  return total;
}

/**
 * Calculates aggregated budget totals (Income, Expense, Balance, Savings Rate).
 */
export function calculateFinancialTotals(transactions: Transaction[]): {
  totalIncome: Big;
  totalExpense: Big;
  totalBalance: Big;
  savingsRate: number;
} {
  let totalIncome = new Big(0);
  let totalExpense = new Big(0);

  for (const t of transactions) {
    const val = getAbsoluteAmount(t.amount);
    if (t.type === 'income') {
      totalIncome = totalIncome.plus(val);
    } else {
      totalExpense = totalExpense.plus(val);
    }
  }

  const totalBalance = totalIncome.minus(totalExpense);
  const savingsRate = calculateSavingsRate(totalIncome, totalExpense);

  return {
    totalIncome,
    totalExpense,
    totalBalance,
    savingsRate,
  };
}

/**
 * Calculates savings rate percentage: ((income - expense) / income) * 100, clamped at >= 0.
 */
export function calculateSavingsRate(income: Big, expense: Big): number {
  if (income.lte(0)) {
    return 0;
  }
  const net = income.minus(expense);
  if (net.lte(0)) {
    return 0;
  }
  const rate = net.div(income).times(100);
  return Math.min(100, Math.max(0, Math.round(Number(rate.toString()))));
}

/**
 * Calculates total expenses per category and their percentage share.
 */
export function calculateCategoryTotals(
  transactions: Transaction[],
  categories: Category[],
  typeFilter: TransactionType = 'expense'
): CategoryTotal[] {
  const filtered = transactions.filter((t) => t.type === typeFilter);
  const totalSum = filtered.reduce((acc, curr) => acc.plus(getAbsoluteAmount(curr.amount)), new Big(0));

  const categoryMap = new Map<string, { cat: Category; amount: Big }>();

  // Register categories
  for (const cat of categories.filter((c) => c.type === typeFilter)) {
    categoryMap.set(cat.id, { cat, amount: new Big(0) });
  }

  // Aggregate amounts
  for (const tx of filtered) {
    const entry = categoryMap.get(tx.category_id);
    const amt = getAbsoluteAmount(tx.amount);
    if (entry) {
      entry.amount = entry.amount.plus(amt);
    } else {
      const fallbackCat: Category = {
        id: tx.category_id,
        name: 'Outros',
        type: typeFilter,
        color: '#64748b',
        icon: 'CreditCard',
      };
      categoryMap.set(tx.category_id, { cat: fallbackCat, amount: amt });
    }
  }

  const result: CategoryTotal[] = [];
  for (const [id, { cat, amount }] of categoryMap.entries()) {
    if (amount.gt(0)) {
      const percentage = totalSum.gt(0)
        ? Number(amount.div(totalSum).times(100).toFixed(1))
        : 0;
      result.push({
        id,
        name: cat.name,
        color: cat.color,
        type: cat.type,
        amount,
        percentage,
      });
    }
  }

  return result.sort((a, b) => (b.amount.gt(a.amount) ? 1 : b.amount.lt(a.amount) ? -1 : 0));
}

/**
 * Calculates monthly projection based on distinct historical months and average net flow.
 */
export function calculateMonthlyProjection(
  transactions: Transaction[],
  monthsAhead: number = 1
): MonthlyProjection {
  if (transactions.length === 0) {
    return {
      monthsAhead,
      projectedIncome: new Big(0),
      projectedExpense: new Big(0),
      projectedBalance: new Big(0),
      projectedSavingsRate: 0,
      averageMonthlyIncome: new Big(0),
      averageMonthlyExpense: new Big(0),
    };
  }

  const monthlySums: { [monthKey: string]: { income: Big; expense: Big } } = {};

  for (const tx of transactions) {
    const monthKey = tx.date ? tx.date.substring(0, 7) : 'current';
    if (!monthlySums[monthKey]) {
      monthlySums[monthKey] = { income: new Big(0), expense: new Big(0) };
    }
    const amt = getAbsoluteAmount(tx.amount);
    if (tx.type === 'income') {
      monthlySums[monthKey].income = monthlySums[monthKey].income.plus(amt);
    } else {
      monthlySums[monthKey].expense = monthlySums[monthKey].expense.plus(amt);
    }
  }

  const distinctMonthsCount = Math.max(1, Object.keys(monthlySums).length);
  let totalAllIncome = new Big(0);
  let totalAllExpense = new Big(0);

  for (const monthKey of Object.keys(monthlySums)) {
    totalAllIncome = totalAllIncome.plus(monthlySums[monthKey].income);
    totalAllExpense = totalAllExpense.plus(monthlySums[monthKey].expense);
  }

  const avgIncome = totalAllIncome.div(distinctMonthsCount);
  const avgExpense = totalAllExpense.div(distinctMonthsCount);

  const monthsBig = new Big(Math.max(1, monthsAhead));
  const projectedIncome = avgIncome.times(monthsBig);
  const projectedExpense = avgExpense.times(monthsBig);
  const projectedBalance = projectedIncome.minus(projectedExpense);
  const projectedSavingsRate = calculateSavingsRate(projectedIncome, projectedExpense);

  return {
    monthsAhead,
    projectedIncome,
    projectedExpense,
    projectedBalance,
    projectedSavingsRate,
    averageMonthlyIncome: avgIncome,
    averageMonthlyExpense: avgExpense,
  };
}
