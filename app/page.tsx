'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import IncomeExpenseChart from '@/components/Charts/IncomeExpenseChart';
import CategoryDoughnut from '@/components/Charts/CategoryDoughnut';
import TransactionList from '@/components/Transactions/TransactionList';
import TransactionModal from '@/components/Transactions/TransactionModal';
import AuthModal from '@/components/Auth/AuthModal';

import { Transaction, Category } from '@/lib/types';
import { DEFAULT_CATEGORIES, INITIAL_SAMPLE_TRANSACTIONS } from '@/lib/demoData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles, Database } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 1. Check Supabase Auth State
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // 2. Fetch Data (from Supabase if configured & logged in, or local storage / demo)
  const loadTransactions = useCallback(async () => {
    setLoading(true);

    if (isSupabaseConfigured && supabase && user) {
      try {
        // Fetch categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*');

        if (!catError && catData && catData.length > 0) {
          setCategories(catData as Category[]);
        }

        // Fetch user transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (!txError && txData) {
          setTransactions(txData as Transaction[]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
      }
    }

    // Fallback: load from localStorage if exists, else initial sample transactions
    const savedTx = typeof window !== 'undefined' ? localStorage.getItem('financas_transactions') : null;
    if (savedTx) {
      try {
        setTransactions(JSON.parse(savedTx));
      } catch {
        setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
      }
    } else {
      setTransactions(INITIAL_SAMPLE_TRANSACTIONS);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Save to localStorage when in local/demo mode
  const persistLocalTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('financas_transactions', JSON.stringify(newTransactions));
    }
  };

  // 3. CRUD Handlers
  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>, id?: string) => {
    if (isSupabaseConfigured && supabase && user) {
      try {
        if (id) {
          // Update
          const { error } = await supabase
            .from('transactions')
            .update({
              amount: data.amount,
              type: data.type,
              category_id: data.category_id,
              date: data.date,
              description: data.description,
              notes: data.notes,
            })
            .eq('id', id);

          if (error) throw error;
        } else {
          // Create
          const { error } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              amount: data.amount,
              type: data.type,
              category_id: data.category_id,
              date: data.date,
              description: data.description,
              notes: data.notes,
            });

          if (error) throw error;
        }

        await loadTransactions();
        return;
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
      }
    }

    // Local state fallback
    if (id) {
      const updated = transactions.map((t) => (t.id === id ? { ...t, ...data } : t));
      persistLocalTransactions(updated);
    } else {
      const newTx: Transaction = {
        id: `local-${Date.now()}`,
        ...data,
      };
      persistLocalTransactions([newTx, ...transactions]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isSupabaseConfigured && supabase && user) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) {
          setTransactions(transactions.filter((t) => t.id !== id));
          return;
        }
      } catch (err) {
        console.error('Error deleting transaction from Supabase:', err);
      }
    }

    const updated = transactions.filter((t) => t.id !== id);
    persistLocalTransactions(updated);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  // 4. Financial Calculations
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t) => {
      const val = Number(t.amount);
      if (t.type === 'income') {
        totalIncome += val;
      } else {
        totalExpense += val;
      }
    });

    const totalBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      savingsRate,
    };
  }, [transactions]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar
        user={user}
        isSupabaseActive={isSupabaseConfigured}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsTransactionModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Body */}
      <main className="container" style={{ flex: 1, paddingBottom: '60px', paddingTop: '32px' }}>
        {/* Supabase Onboarding Banner if not yet connected */}
        {!isSupabaseConfigured && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  flexShrink: 0,
                }}
              >
                <Database size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                  Executando em Modo Local / Demonstração com dados em Reais (BRL)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Para sincronizar com seu projeto Supabase, execute o script <code>supabase/schema.sql</code> no seu SQL Editor e defina as chaves em <code>.env.local</code>.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  persistLocalTransactions(INITIAL_SAMPLE_TRANSACTIONS);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                title="Restaura os dados de exemplo pré-carregados"
              >
                <Sparkles size={14} />
                <span>Restaurar Dados Demo</span>
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Header Greeting */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
            Visão Geral Financeira
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Controle de receitas, despesas e taxa de poupança atualizados em tempo real.
          </p>
        </div>

        {/* 4 Metrics / Stat Cards */}
        <div className="dashboard-grid">
          <StatCard
            title="Saldo Líquido"
            amount={stats.totalBalance}
            icon={Wallet}
            variant={stats.totalBalance >= 0 ? 'primary' : 'expense'}
            subtitle={stats.totalBalance >= 0 ? 'Superávit acumulado' : 'Atenção: Saldo devedor'}
          />

          <StatCard
            title="Receitas Totais"
            amount={stats.totalIncome}
            icon={TrendingUp}
            variant="income"
            subtitle="Entradas registradas"
          />

          <StatCard
            title="Despesas Totais"
            amount={stats.totalExpense}
            icon={TrendingDown}
            variant="expense"
            subtitle="Saídas registradas"
          />

          <StatCard
            title="Taxa de Poupança"
            amount={stats.savingsRate}
            icon={PiggyBank}
            isCurrency={false}
            valueSuffix="%"
            variant="neutral"
            subtitle={`${stats.savingsRate}% da renda retida`}
          />
        </div>

        {/* Interactive Visual Charts Grid */}
        <div className="charts-grid">
          <IncomeExpenseChart transactions={transactions} />
          <CategoryDoughnut transactions={transactions} categories={categories} />
        </div>

        {/* Transaction Management Section */}
        <TransactionList
          transactions={transactions}
          categories={categories}
          onEdit={(tx) => {
            setEditingTransaction(tx);
            setIsTransactionModalOpen(true);
          }}
          onDelete={handleDeleteTransaction}
          onNew={() => {
            setEditingTransaction(null);
            setIsTransactionModalOpen(true);
          }}
        />
      </main>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        categories={categories}
      />

      {/* Supabase Email/Password Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loadTransactions}
      />
    </div>
  );
}
