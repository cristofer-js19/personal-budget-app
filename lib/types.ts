export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  user_id?: string | null;
}

export interface Transaction {
  id: string;
  user_id?: string;
  category_id: string;
  category?: Category;
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  description: string;
  notes?: string;
  created_at?: string;
  deleted_at?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  currency: string;
  monthly_budget_goal: number;
  created_at?: string;
}

export interface BudgetSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  monthlyExpenses: number;
}
