import { describe, it, expect } from "vitest";
import Big from "big.js";
import {
  calculateBalance,
  calculateCategoryTotals,
  calculateMonthlyProjection,
  calculateFinancialTotals,
  calculateSavingsRate,
  validateTransactionInput,
} from "../financial";
import { formatCurrencyBRL } from "../formatters";
import { mapDatabaseConstraintError } from "../services/transactionService";
import { Transaction, Category } from "../types";

describe("Financial Math Precision (Rule 1)", () => {
  it("avoids floating point rounding issues (0.1 + 0.2 = 0.3)", () => {
    const tx1: Transaction = {
      id: "1",
      category_id: "cat-income",
      amount: 0.1,
      type: "income",
      date: "2026-09-01",
      description: "Test 0.1",
    };
    const tx2: Transaction = {
      id: "2",
      category_id: "cat-income",
      amount: 0.2,
      type: "income",
      date: "2026-09-02",
      description: "Test 0.2",
    };

    const balance = calculateBalance([tx1, tx2]);
    expect(balance.toString()).toBe("0.3");
    expect(balance.eq(new Big("0.3"))).toBe(true);
  });

  it("correctly calculates balance with multiple incomes and expenses", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        category_id: "cat-1",
        amount: 5000.5,
        type: "income",
        date: "2026-09-01",
        description: "Salary",
      },
      {
        id: "2",
        category_id: "cat-2",
        amount: -1250.25,
        type: "expense",
        date: "2026-09-02",
        description: "Rent",
      },
      {
        id: "3",
        category_id: "cat-3",
        amount: -350.15,
        type: "expense",
        date: "2026-09-03",
        description: "Groceries",
      },
      {
        id: "4",
        category_id: "cat-4",
        amount: 450.0,
        type: "income",
        date: "2026-09-04",
        description: "Bonus",
      },
    ];

    const balance = calculateBalance(transactions);
    // (5000.50 + 450.00) - (1250.25 + 350.15) = 5450.50 - 1600.40 = 3850.10
    expect(balance.toFixed(2)).toBe("3850.10");
  });

  it("handles empty transaction lists without error", () => {
    const balance = calculateBalance([]);
    expect(balance.toString()).toBe("0");
  });
});

describe("calculateFinancialTotals & Savings Rate (Rule 1)", () => {
  it("computes budget totals and savings rate accurately", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        category_id: "c1",
        amount: 10000,
        type: "income",
        date: "2026-09-01",
        description: "Income",
      },
      {
        id: "2",
        category_id: "c2",
        amount: -4000,
        type: "expense",
        date: "2026-09-02",
        description: "Expense",
      },
    ];

    const totals = calculateFinancialTotals(transactions);
    expect(totals.totalIncome.toString()).toBe("10000");
    expect(totals.totalExpense.toString()).toBe("4000");
    expect(totals.totalBalance.toString()).toBe("6000");
    // 6000 / 10000 = 60%
    expect(totals.savingsRate).toBe(60);
  });

  it("handles negative or zero net balance in savings rate", () => {
    expect(calculateSavingsRate(new Big(0), new Big(500))).toBe(0);
    expect(calculateSavingsRate(new Big(1000), new Big(1500))).toBe(0);
  });
});

describe("calculateCategoryTotals (Rule 1)", () => {
  const categories: Category[] = [
    {
      id: "c-food",
      name: "Alimentação",
      type: "expense",
      color: "#f59e0b",
      icon: "Utensils",
    },
    {
      id: "c-housing",
      name: "Moradia",
      type: "expense",
      color: "#ef4444",
      icon: "Home",
    },
    {
      id: "c-trans",
      name: "Transporte",
      type: "expense",
      color: "#3b82f6",
      icon: "Car",
    },
  ];

  it("aggregates expenses per category and calculates percentage correctly", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        category_id: "c-food",
        amount: -300,
        type: "expense",
        date: "2026-09-01",
        description: "Market",
      },
      {
        id: "2",
        category_id: "c-food",
        amount: -200,
        type: "expense",
        date: "2026-09-02",
        description: "Restaurant",
      },
      {
        id: "3",
        category_id: "c-housing",
        amount: -500,
        type: "expense",
        date: "2026-09-03",
        description: "Rent",
      },
    ];

    // Total expense = 1000. c-housing = 500 (50%), c-food = 500 (50%)
    const totals = calculateCategoryTotals(transactions, categories, "expense");
    expect(totals).toHaveLength(2);
    expect(totals[0].amount.toFixed(2)).toBe("500.00");
    expect(totals[0].percentage).toBe(50);
    expect(totals[1].amount.toFixed(2)).toBe("500.00");
    expect(totals[1].percentage).toBe(50);
  });
});

describe("calculateMonthlyProjection (Rule 1)", () => {
  it("projects future income and expense based on monthly averages", () => {
    const transactions: Transaction[] = [
      // Month 1
      {
        id: "1",
        category_id: "c1",
        amount: 5000,
        type: "income",
        date: "2026-07-10",
        description: "M1 Salary",
      },
      {
        id: "2",
        category_id: "c2",
        amount: -2000,
        type: "expense",
        date: "2026-07-15",
        description: "M1 Expense",
      },
      // Month 2
      {
        id: "3",
        category_id: "c1",
        amount: 5000,
        type: "income",
        date: "2026-08-10",
        description: "M2 Salary",
      },
      {
        id: "4",
        category_id: "c2",
        amount: -2000,
        type: "expense",
        date: "2026-08-15",
        description: "M2 Expense",
      },
    ];

    // 2 months average: income = 5000, expense = 2000
    // Projection for 3 months ahead:
    const projection3M = calculateMonthlyProjection(transactions, 3);
    expect(projection3M.projectedIncome.toString()).toBe("15000");
    expect(projection3M.projectedExpense.toString()).toBe("6000");
    expect(projection3M.projectedBalance.toString()).toBe("9000");
    expect(projection3M.projectedSavingsRate).toBe(60);
  });

  it("handles empty data projection safely", () => {
    const projection = calculateMonthlyProjection([], 1);
    expect(projection.projectedBalance.toString()).toBe("0");
    expect(projection.projectedSavingsRate).toBe(0);
  });
});

describe("validateTransactionInput - Option A Signed Convention (Rule 1)", () => {
  it("rejects negative inputs in revenue fields", () => {
    const res = validateTransactionInput("-150.00", "income");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Receitas devem ter valor positivo");
  });

  it("accepts positive inputs in revenue fields", () => {
    const res = validateTransactionInput("1500.50", "income");
    expect(res.valid).toBe(true);
    expect(res.amount?.toFixed(2)).toBe("1500.50");
  });

  it("rejects positive inputs in expense fields", () => {
    const res = validateTransactionInput("150.00", "expense");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Despesas devem ter valor negativo");
  });

  it("accepts negative inputs in expense fields", () => {
    const res = validateTransactionInput("-150.00", "expense");
    expect(res.valid).toBe(true);
    expect(res.amount?.toFixed(2)).toBe("-150.00");
  });

  it("rejects zero values for both revenue and expense", () => {
    expect(validateTransactionInput("0", "income").valid).toBe(false);
    expect(validateTransactionInput("0", "expense").valid).toBe(false);
  });

  it("rejects invalid non-numeric inputs", () => {
    expect(validateTransactionInput("abc", "income").valid).toBe(false);
    expect(validateTransactionInput("", "expense").valid).toBe(false);
  });
});

describe("formatCurrencyBRL (Rule 1 pt-BR currency formatting)", () => {
  it("formats positive and negative amounts in pt-BR locale with R$", () => {
    const formattedPos = formatCurrencyBRL(1250);
    // Matches R$ 1.250,00 (accounting for non-breaking space)
    expect(formattedPos).toMatch(/R\$\s*1\.250,00/);

    const formattedBig = formatCurrencyBRL(new Big("3450.75"));
    expect(formattedBig).toMatch(/R\$\s*3\.450,75/);
  });
});

describe("Soft Delete Safeguard & Active Transactions (Global Rule 1)", () => {
  it("excludes soft-deleted transactions from balance calculations", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        category_id: "c1",
        amount: 5000,
        type: "income",
        date: "2026-09-01",
        description: "Active Income",
      },
      {
        id: "2",
        category_id: "c2",
        amount: -2000,
        type: "expense",
        date: "2026-09-02",
        description: "Active Expense",
      },
      {
        id: "3",
        category_id: "c2",
        amount: -1500,
        type: "expense",
        date: "2026-09-03",
        description: "Deleted Expense",
        deleted_at: "2026-09-04T10:00:00Z",
      },
    ];

    const balance = calculateBalance(transactions);
    // 5000 - 2000 = 3000 (ignoring deleted 1500 expense)
    expect(balance.toString()).toBe("3000");
  });

  it("excludes soft-deleted transactions from category totals", () => {
    const categories: Category[] = [
      {
        id: "c1",
        name: "Alimentação",
        type: "expense",
        color: "#f59e0b",
        icon: "Utensils",
      },
    ];
    const transactions: Transaction[] = [
      {
        id: "1",
        category_id: "c1",
        amount: -300,
        type: "expense",
        date: "2026-09-01",
        description: "Active Market",
      },
      {
        id: "2",
        category_id: "c1",
        amount: -700,
        type: "expense",
        date: "2026-09-02",
        description: "Deleted Market",
        deleted_at: "2026-09-03T12:00:00Z",
      },
    ];

    const totals = calculateCategoryTotals(transactions, categories, "expense");
    expect(totals).toHaveLength(1);
    expect(totals[0].amount.toString()).toBe("300");
  });
});

describe("Source-Level Security & Database Constraint Error Mapping (Global Rule 3)", () => {
  it("maps PostgreSQL check constraint 23514 to user-friendly integrity messages", () => {
    const incomeCheckErr = {
      code: "23514",
      message: 'violates check constraint "check_income_positive"',
    };
    const expenseCheckErr = {
      code: "23514",
      message: 'violates check constraint "check_expense_negative"',
    };
    const zeroCheckErr = {
      code: "23514",
      message: 'violates check constraint "check_transaction_amount_not_zero"',
    };

    expect(mapDatabaseConstraintError(incomeCheckErr)).toContain(
      "receitas devem ser estritamente positivas",
    );
    expect(mapDatabaseConstraintError(expenseCheckErr)).toContain(
      "despesas devem ser estritamente negativas",
    );
    expect(mapDatabaseConstraintError(zeroCheckErr)).toContain(
      "não pode ser zero",
    );
  });
});
