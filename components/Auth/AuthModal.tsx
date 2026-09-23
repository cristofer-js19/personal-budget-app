'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { X, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'recover';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isSupabaseConfigured || !supabase) {
      // In demo mode without keys
      if (mode === 'login' || mode === 'register') {
        setSuccessMsg('Simulação de login no modo de demonstração bem-sucedida!');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 800);
      } else {
        setSuccessMsg('Link de recuperação simulado enviado com sucesso para seu e-mail!');
      }
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Login realizado com sucesso!');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 700);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setErrorMsg('As senhas não coincidem.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmação se necessário.');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 1200);
      } else if (mode === 'recover') {
        const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao processar a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2px' }}>
              {mode === 'login' && 'Entrar na Conta'}
              {mode === 'register' && 'Criar Nova Conta'}
              {mode === 'recover' && 'Recuperar Senha'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Autenticação segura via Supabase Auth
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Form Container */}
        <div style={{ padding: '24px' }}>
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'login' ? 'var(--primary)' : 'transparent',
                color: mode === 'login' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'register' ? 'var(--primary)' : 'transparent',
                color: mode === 'register' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cadastrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('recover'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'recover' ? 'var(--primary)' : 'transparent',
                color: mode === 'recover' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Recuperar
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {!isSupabaseConfigured && (
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px dashed var(--border-subtle)',
            }}>
              💡 <strong>Dica:</strong> Para sincronizar contas reais, configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no seu arquivo <code>.env.local</code>.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label">Nome Completo</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Seu nome ou apelido"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  required
                />
              </div>
            </div>

            {mode !== 'recover' && (
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="input-label">Senha</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('recover')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '38px' }}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label">Confirmar Senha</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '38px' }}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', height: '46px' }}
            >
              {loading ? (
                <span>Processando...</span>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Entrar'}
                    {mode === 'register' && 'Criar Conta'}
                    {mode === 'recover' && 'Enviar Link de Recuperação'}
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
