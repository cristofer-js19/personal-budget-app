'use client';

import React from 'react';
import { Plus, Wallet, ShieldCheck, HelpCircle, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface NavbarProps {
  user: User | null;
  isSupabaseActive: boolean;
  onOpenNewTransaction: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

export default function Navbar({
  user,
  isSupabaseActive,
  onOpenNewTransaction,
  onOpenAuthModal,
  onSignOut,
}: NavbarProps) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(6, 8, 14, 0.75)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
          }}>
            <Wallet size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                Finanças<span style={{ color: '#818cf8' }}>Pro</span>
              </span>
              <span style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}>
                BRL (R$)
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Gestão Financeira Pessoal
            </p>
          </div>
        </div>

        {/* Center / Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSupabaseActive ? (
            <div className="badge" style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <ShieldCheck size={14} />
              <span>Supabase Conectado</span>
            </div>
          ) : (
            <div
              className="badge"
              title="Configure .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para sincronizar na nuvem."
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                cursor: 'pointer',
              }}
            >
              <HelpCircle size={14} />
              <span>Modo Local / Demo</span>
            </div>
          )}
        </div>

        {/* Actions & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onOpenNewTransaction}
            className="btn btn-primary"
            id="btn-new-transaction"
          >
            <Plus size={18} />
            <span>Nova Transação</span>
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
              }}>
                <UserIcon size={16} color="#818cf8" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="btn-icon"
                title="Encerrar Sessão"
                style={{ padding: '8px' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="btn btn-secondary"
              id="btn-auth"
            >
              <UserIcon size={16} />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
