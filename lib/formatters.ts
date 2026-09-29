import Big from 'big.js';

export function formatCurrencyBRL(amount: number | string | Big): string {
  let numVal: number;
  if (amount instanceof Big) {
    numVal = Number(amount.toFixed(2));
  } else if (typeof amount === 'string') {
    numVal = Number(amount.replace(',', '.'));
  } else {
    numVal = amount;
  }

  if (isNaN(numVal)) {
    numVal = 0;
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numVal);
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export function getMonthYearLabel(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
}
