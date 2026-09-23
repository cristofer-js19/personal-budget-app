import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Finanças Pro | Gestão Financeira Pessoal',
  description: 'Aplicativo moderno de gestão financeira pessoal com Next.js e Supabase. Monitore receitas, despesas, orçamentos e relatórios em Reais (BRL).',
  keywords: ['orçamento pessoal', 'finanças', 'Next.js', 'Supabase', 'BRL', 'controle financeiro'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#06080e" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
