"use client";

import React, { useState } from "react";
import { Transaction, Category } from "@/lib/types";
import { formatCurrencyBRL } from "@/lib/formatters";

import { calculateCategoryTotals } from "@/lib/financial";

interface CategoryDoughnutProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function CategoryDoughnut({
  transactions,
  categories,
}: CategoryDoughnutProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Compute category totals using Big.js precision module
  const sortedCategories = calculateCategoryTotals(
    transactions,
    categories,
    "expense",
  );
  const totalExpense = sortedCategories.reduce(
    (acc, curr) => acc + Number(curr.amount.toFixed(2)),
    0,
  );

  // SVG Doughnut geometry
  const radius = 75;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const categoriesWithOffset = sortedCategories.map((item, idx) => {
    const currentOffset = sortedCategories
      .slice(0, idx)
      .reduce((sum, curr) => sum + (curr.percentage / 100) * circumference, 0);
    return {
      ...item,
      strokeDasharray: `${(item.percentage / 100) * circumference} ${circumference}`,
      strokeDashoffset: -currentOffset,
    };
  });

  return (
    <div
      className="glass-panel"
      style={{ padding: "24px", display: "flex", flexDirection: "column" }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "4px" }}
        >
          Despesas por Categoria
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Distribuição dos seus gastos atuais
        </p>
      </div>

      {totalExpense === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "220px",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          Nenhuma despesa registrada no período.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* SVG Circular Doughnut */}
          <div
            style={{
              position: "relative",
              width: "190px",
              height: "190px",
              marginBottom: "20px",
            }}
          >
            <svg
              viewBox="0 0 200 200"
              style={{
                transform: "rotate(-90deg)",
                width: "100%",
                height: "100%",
              }}
            >
              {/* Background circle track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
              />

              {categoriesWithOffset.map((item) => {
                const isHovered = hoveredCategory === item.id;

                return (
                  <circle
                    key={item.id}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={item.strokeDasharray}
                    strokeDashoffset={item.strokeDashoffset}
                    style={{
                      transition: "all 200ms ease",
                      cursor: "pointer",
                      filter: isHovered
                        ? `drop-shadow(0 0 8px ${item.color})`
                        : "none",
                    }}
                    onMouseEnter={() => setHoveredCategory(item.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                );
              })}
            </svg>

            {/* Doughnut Center Content */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Despesas
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "var(--expense)",
                }}
              >
                {formatCurrencyBRL(totalExpense)}
              </span>
            </div>
          </div>

          {/* Category Badges & Legend */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            {sortedCategories.slice(0, 5).map((cat) => (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  background:
                    hoveredCategory === cat.id
                      ? "rgba(255, 255, 255, 0.06)"
                      : "transparent",
                  cursor: "pointer",
                  transition: "background var(--transition-fast)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: cat.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {cat.name}
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatCurrencyBRL(cat.amount)}
                  </span>
                  <span
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
