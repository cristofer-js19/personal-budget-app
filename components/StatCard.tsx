"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/formatters";

import Big from "big.js";

interface StatCardProps {
  title: string;
  amount: number | Big;
  icon: LucideIcon;
  variant?: "primary" | "income" | "expense" | "neutral";
  subtitle?: string;
  isCurrency?: boolean;
  valueSuffix?: string;
}

export default function StatCard({
  title,
  amount,
  icon: Icon,
  variant = "neutral",
  subtitle,
  isCurrency = true,
  valueSuffix = "",
}: StatCardProps) {
  const getThemeStyles = () => {
    switch (variant) {
      case "income":
        return {
          iconBg: "rgba(16, 185, 129, 0.15)",
          iconColor: "#34d399",
          borderHighlight: "rgba(16, 185, 129, 0.3)",
          glow: "0 8px 30px rgba(16, 185, 129, 0.15)",
          amountColor: "#34d399",
        };
      case "expense":
        return {
          iconBg: "rgba(244, 63, 94, 0.15)",
          iconColor: "#fb7185",
          borderHighlight: "rgba(244, 63, 94, 0.3)",
          glow: "0 8px 30px rgba(244, 63, 94, 0.15)",
          amountColor: "#fb7185",
        };
      case "primary":
        return {
          iconBg: "rgba(99, 102, 241, 0.18)",
          iconColor: "#818cf8",
          borderHighlight: "rgba(99, 102, 241, 0.4)",
          glow: "0 8px 32px rgba(99, 102, 241, 0.2)",
          amountColor: "#f8fafc",
        };
      default:
        return {
          iconBg: "rgba(255, 255, 255, 0.08)",
          iconColor: "#cbd5e1",
          borderHighlight: "rgba(255, 255, 255, 0.12)",
          glow: "none",
          amountColor: "#f8fafc",
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div
      className="glass-panel card-glow-interactive"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        boxShadow: theme.glow,
        border: `1px solid ${theme.borderHighlight}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "0.88rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: theme.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.iconColor,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div>
        <div
          className="mono"
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: theme.amountColor,
            marginBottom: "6px",
          }}
        >
          {isCurrency ? formatCurrencyBRL(amount) : `${amount}${valueSuffix}`}
        </div>
        {subtitle && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
