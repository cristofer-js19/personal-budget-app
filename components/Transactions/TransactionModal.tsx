'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '@/lib/types';
import { validateTransactionInput } from '@/lib/financial';
import { X, ArrowUpRight, ArrowDownLeft, Check, AlertCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id'>, id?: string) => void;
  editingTransaction?: Transaction | null;
  categories: Category[];
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  categories,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      // Format amount with appropriate sign
      const rawNum = Number(editingTransaction.amount);
      if (editingTransaction.type === 'expense') {
        setAmount(String(rawNum > 0 ? -rawNum : rawNum));
      } else {
        setAmount(String(rawNum < 0 ? -rawNum : rawNum));
      }
      setCategoryId(editingTransaction.category_id);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setNotes(editingTransaction.notes || '');
    } else {
      setType('expense');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNotes('');
      const firstCat = categories.find((c) => c.type === 'expense');
      setCategoryId(firstCat ? firstCat.id : '');
    }
    setError('');
  }, [editingTransaction, isOpen, categories]);

  // Handle type change with automatic sign adjustment (Option A: Signed convention)
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setError('');

    // Adjust sign of existing amount when toggling
    if (amount.trim() !== '') {
      const clean = amount.trim().replace(',', '.');
      const num = Number(clean);
      if (!isNaN(num) && num !== 0) {
        if (newType === 'expense' && num > 0) {
          setAmount(`-${clean}`);
        } else if (newType === 'income' && num < 0) {
          setAmount(clean.replace('-', ''));
        }
      }
    }

    const available = categories.filter((c) => c.type === newType);
    if (available.length > 0) {
      setCategoryId(available[0].id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate financial input according to signed convention rules
    const validation = validateTransactionInput(amount, type);
    if (!validation.valid || !validation.amount) {
      setError(validation.error || 'Valor inválido.');
      return;
    }

    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }

    onSave(
      {
        type,
        amount: validation.amount.toNumber(),
        category_id: categoryId,
        date: date || new Date().toISOString().split('T')[0],
        description: description.trim(),
        notes: notes.trim() || undefined,
      },
      editingTransaction ? editingTransaction.id : undefined
    );
    onClose();
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Receita / Despesa) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: type === 'expense' ? 'var(--expense)' : 'transparent',
                color: type === 'expense' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <ArrowDownLeft size={18} />
              <span>Despesa (negativo)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: type === 'income' ? 'var(--income)' : 'transparent',
                color: type === 'income' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <ArrowUpRight size={18} />
              <span>Receita (positivo)</span>
            </button>
          </div>

          {/* Valor (R$) */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Valor (R$)</label>
              <span style={{ fontSize: '0.75rem', color: type === 'expense' ? '#fb7185' : '#34d399', fontWeight: 600 }}>
                {type === 'expense' ? 'Informe com sinal negativo (ex: -150,00)' : 'Informe com sinal positivo (ex: 1500,00)'}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '1rem',
              }}>
                R$
              </span>
              <input
                type="text"
                placeholder={type === 'expense' ? '-150,00' : '1500,00'}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                required
                className="input-field mono"
                style={{ paddingLeft: '44px', fontSize: '1.2rem', fontWeight: 700 }}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="input-group">
            <label className="input-label">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Mercado mensal, Salário, Conta de luz"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="input-field"
            />
          </div>

          {/* Categoria & Data Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-field"
                required
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          {/* Observações / Notas */}
          <div className="input-group">
            <label className="input-label">Observações (Opcional)</label>
            <input
              type="text"
              placeholder="Adicione detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: type === 'income' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined,
              }}
            >
              <Check size={18} />
              <span>{editingTransaction ? 'Salvar Alterações' : 'Salvar Transação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
