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
import { calculateFinancialTotals } from '@/lib/financial';
import { getEncryptedLocalStorage, setEncryptedLocalStorage } from '@/lib/storage/encryptedStorage';
import { handleApiError } from '@/lib/api/errorHandler';
import { logger } from '@/lib/logger';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles, Database } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [, setLoading] = useState(true);

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

  // 2. Fetch Data (from Supabase if configured & logged in, or local encrypted storage / demo)
  const loadTransactions = useCallback(async () => {
    setLoading(true);

    if (isSupabaseConfigured && supabase && user) {
      try {
        // Fetch categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*');

        if (catError) {
          handleApiError(catError, {
            onUnauthorized: () => {
              setUser(null);
              setIsAuthModalOpen(true);
            },
          });
        } else if (catData && catData.length > 0) {
          setCategories(catData as Category[]);
        }

        // Fetch user transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (txError) {
          handleApiError(txError, {
            onUnauthorized: () => {
              setUser(null);
              setIsAuthModalOpen(true);
            },
          });
        } else if (txData) {
          setTransactions(txData as Transaction[]);
          setLoading(false);
          return;
        }
      } catch (err) {
        handleApiError(err, {
          onUnauthorized: () => {
            setUser(null);
            setIsAuthModalOpen(true);
          },
        });
      }
    }

    // Fallback: load from encrypted localStorage if exists, else initial sample transactions
    const savedTx = await getEncryptedLocalStorage<Transaction[]>(
      'financas_transactions',
      INITIAL_SAMPLE_TRANSACTIONS
    );
    setTransactions(savedTx);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Save to encrypted storage when in local/demo mode (Rule 2)
  const persistLocalTransactions = async (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    await setEncryptedLocalStorage('financas_transactions', newTransactions);
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

          if (error) {
            handleApiError(error, {
              onUnauthorized: () => {
                setUser(null);
                setIsAuthModalOpen(true);
              },
            });
            return;
          }
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

          if (error) {
            handleApiError(error, {
              onUnauthorized: () => {
                setUser(null);
                setIsAuthModalOpen(true);
              },
            });
            return;
          }
        }

        await loadTransactions();
        return;
      } catch (err) {
        handleApiError(err, {
          onUnauthorized: () => {
            setUser(null);
            setIsAuthModalOpen(true);
          },
        });
      }
    }

    // Local state fallback with encrypted storage
    if (id) {
      const updated = transactions.map((t) => (t.id === id ? { ...t, ...data } : t));
      await persistLocalTransactions(updated);
    } else {
      const newTx: Transaction = {
        id: `local-${Date.now()}`,
        ...data,
      };
      await persistLocalTransactions([newTx, ...transactions]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isSupabaseConfigured && supabase && user) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
          handleApiError(error, {
            onUnauthorized: () => {
              setUser(null);
              setIsAuthModalOpen(true);
            },
          });
          return;
        }
        setTransactions(transactions.filter((t) => t.id !== id));
        return;
      } catch (err) {
        handleApiError(err, {
          onUnauthorized: () => {
            setUser(null);
            setIsAuthModalOpen(true);
          },
        });
      }
    }

    const updated = transactions.filter((t) => t.id !== id);
    await persistLocalTransactions(updated);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        logger.error('Failed to sign out properly');
      }
    }
    setUser(null);
  };

  // 4. Financial Calculations using Big.js precision module (Rule 1)
  const stats = useMemo(() => {
    return calculateFinancialTotals(transactions);
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
                  Armazenamento local criptografado com precisão financeira via Big.js. Para sincronizar com Supabase, defina as chaves em <code>.env.local</code>.
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
            Controle de receitas, despesas e taxa de poupança com precisão financeira.
          </p>
        </div>

        {/* 4 Metrics / Stat Cards */}
        <div className="dashboard-grid">
          <StatCard
            title="Saldo Líquido"
            amount={stats.totalBalance}
            icon={Wallet}
            variant={stats.totalBalance.gte(0) ? 'primary' : 'expense'}
            subtitle={stats.totalBalance.gte(0) ? 'Superávit acumulado' : 'Atenção: Saldo devedor'}
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
