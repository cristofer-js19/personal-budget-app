import { SupabaseClient } from '@supabase/supabase-js';
import { handleApiError } from '../api/errorHandler';
import { logger } from '../logger';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Maps database-level constraint violations (Rule 3) to clear user-facing messages.
 */
export function mapDatabaseConstraintError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const errorObj = err as Record<string, unknown>;
    const code = String(errorObj.code || '');
    const message = String(errorObj.message || '');

    // Postgres 23514: check_violation
    if (code === '23514' || message.includes('check_income_positive') || message.includes('check_expense_negative')) {
      if (message.includes('check_income_positive')) {
        return 'Violação de integridade no banco: receitas devem ser estritamente positivas.';
      }
      if (message.includes('check_expense_negative')) {
        return 'Violação de integridade no banco: despesas devem ser estritamente negativas.';
      }
      if (message.includes('check_transaction_amount_not_zero')) {
        return 'Violação de integridade no banco: o valor da transação não pode ser zero.';
      }
      return 'Os dados enviados violam as restrições de integridade do banco de dados.';
    }

    // Postgres 23503: foreign_key_violation
    if (code === '23503') {
      return 'Categoria ou usuário informado não existe no sistema.';
    }
  }

  return 'Ocorreu um erro ao processar a operação no banco de dados.';
}

/**
 * Executes a non-destructive Soft Delete on a transaction (Rule 1).
 */
export async function softDeleteTransaction(
  supabase: SupabaseClient | null,
  transactionId: string
): Promise<ServiceResult<void>> {
  if (!supabase) {
    return { success: false, error: 'Cliente Supabase não configurado.' };
  }

  try {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', transactionId);

    if (error) {
      handleApiError(error);
      return { success: false, error: mapDatabaseConstraintError(error) };
    }

    return { success: true };
  } catch (err) {
    logger.error('Error during soft delete transaction', err);
    return { success: false, error: 'Falha ao desativar transação.' };
  }
}
