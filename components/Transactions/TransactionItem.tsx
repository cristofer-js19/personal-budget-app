'use client';

import React from 'react';
import { Transaction, Category } from '@/lib/types';
import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters';
import { ArrowUpRight, ArrowDownLeft, Edit2, Trash2 } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionItem({
  transaction,
  category,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Left: Icon & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isIncome ? 'var(--income-surface)' : 'var(--expense-surface)',
            color: isIncome ? 'var(--income)' : 'var(--expense)',
            border: isIncome ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
            flexShrink: 0,
          }}
        >
          {isIncome ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
              {transaction.description}
            </span>
            {category && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: `${category.color}22`,
                  color: category.color,
                  border: `1px solid ${category.color}44`,
                }}
              >
                {category.name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>{formatDateBR(transaction.date)}</span>
            {transaction.notes && (
              <>
                <span>•</span>
                <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {transaction.notes}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="mono" style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: isIncome ? 'var(--income)' : 'var(--expense)',
          textAlign: 'right',
        }}>
          {isIncome ? '+ ' : '- '}
          {formatCurrencyBRL(transaction.amount)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onEdit(transaction)}
            className="btn-icon"
            title="Editar Transação"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="btn-icon"
            title="Excluir Transação"
            style={{ color: '#f87171' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
