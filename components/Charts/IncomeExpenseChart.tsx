'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/formatters';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export default function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Group transactions by month (last 6 months)
  const monthMap: { [key: string]: { label: string; income: number; expense: number } } = {};

  // Initialize previous 6 months in chronological order
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d);
    monthMap[key] = { label: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''), income: 0, expense: 0 };
  }

  transactions.forEach((tx) => {
    const key = tx.date.substring(0, 7);
    if (monthMap[key]) {
      if (tx.type === 'income') {
        monthMap[key].income += Number(tx.amount);
      } else {
        monthMap[key].expense += Number(tx.amount);
      }
    }
  });

  const data = Object.values(monthMap);
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1000);

  const chartHeight = 220;
  const chartWidth = 540;
  const barWidth = 24;
  const groupSpacing = chartWidth / data.length;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
            Fluxo Mensal: Receitas vs Despesas
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Comparativo dos últimos 6 meses em Reais (BRL)
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--income)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Receitas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--expense)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Despesas</span>
          </div>
        </div>
      </div>

      {/* SVG Responsive Chart */}
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight + 40}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="incomeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.4)" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="rgba(244, 63, 94, 0.4)" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = chartHeight - ratio * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, index) => {
            const groupX = index * groupSpacing + groupSpacing / 2;
            const incomeH = (item.income / maxVal) * chartHeight;
            const expenseH = (item.expense / maxVal) * chartHeight;

            const incomeY = chartHeight - incomeH;
            const expenseY = chartHeight - expenseH;

            const isHovered = hoveredIdx === index;

            return (
              <g
                key={index}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={groupX - groupSpacing / 2 + 6}
                    y="0"
                    width={groupSpacing - 12}
                    height={chartHeight}
                    fill="rgba(255, 255, 255, 0.03)"
                    rx="8"
                  />
                )}

                {/* Income bar */}
                <rect
                  x={groupX - barWidth - 3}
                  y={incomeY}
                  width={barWidth}
                  height={Math.max(incomeH, 2)}
                  rx="6"
                  fill="url(#incomeGrad)"
                  style={{
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' : 'none',
                    transition: 'all 200ms ease',
                  }}
                />

                {/* Expense bar */}
                <rect
                  x={groupX + 3}
                  y={expenseY}
                  width={barWidth}
                  height={Math.max(expenseH, 2)}
                  rx="6"
                  fill="url(#expenseGrad)"
                  style={{
                    filter: isHovered ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.5))' : 'none',
                    transition: 'all 200ms ease',
                  }}
                />

                {/* Month label */}
                <text
                  x={groupX}
                  y={chartHeight + 26}
                  textAnchor="middle"
                  fill={isHovered ? '#f8fafc' : '#94a3b8'}
                  fontSize="12"
                  fontWeight={isHovered ? '600' : '400'}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0d1322',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '10px 16px',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              gap: '16px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{data[hoveredIdx].label} - Receitas</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--income)' }}>
                {formatCurrencyBRL(data[hoveredIdx].income)}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Despesas</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--expense)' }}>
                {formatCurrencyBRL(data[hoveredIdx].expense)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
