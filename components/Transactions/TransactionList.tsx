'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType } from '@/lib/types';
import TransactionItem from './TransactionItem';
import { Search, Filter, ArrowUpDown, PlusCircle } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  onNew,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch =
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || tx.category_id === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => {
        if (sortOrder === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortOrder === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortOrder === 'amount-desc') return b.amount - a.amount;
        if (sortOrder === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchTerm, typeFilter, categoryFilter, sortOrder]);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header with Title & Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Histórico de Transações
            </h3>
            <span className="badge badge-neutral">
              {filteredTransactions.length} de {transactions.length}
            </span>
          </div>

          {/* Type Filter Pills */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            border: '1px solid var(--border-subtle)',
          }}>
            {(['all', 'income', 'expense'] as const).map((type) => {
              const labels = { all: 'Todas', income: 'Receitas', expense: 'Despesas' };
              const isActive = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Category Selector & Sort */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por descrição ou notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '38px', height: '42px', fontSize: '0.88rem' }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ position: 'relative' }}>
            <Filter size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '38px', height: '42px', fontSize: '0.88rem', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'income' ? 'Receita' : 'Despesa'})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div style={{ position: 'relative' }}>
            <ArrowUpDown size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="input-field"
              style={{ paddingLeft: '38px', height: '42px', fontSize: '0.88rem', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="date-desc">Mais recentes primeiro</option>
              <option value="date-asc">Mais antigas primeiro</option>
              <option value="amount-desc">Maior valor primeiro</option>
              <option value="amount-asc">Menor valor primeiro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Items List */}
      {filteredTransactions.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Filter size={24} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>
              Nenhuma transação encontrada
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tente ajustar seus termos de busca ou adicionar um novo lançamento.
            </p>
          </div>
          <button onClick={onNew} className="btn btn-secondary" style={{ marginTop: '8px' }}>
            <PlusCircle size={16} />
            <span>Adicionar Transação</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTransactions.map((tx) => {
            const category = categories.find((c) => c.id === tx.category_id);
            return (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                category={category}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
