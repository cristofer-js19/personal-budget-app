/**
 * Central API error handling conforming to Rule 2:
 * "All communication with external APIs must use HTTPS and include explicit handling
 * of authentication errors (401/403)."
 */

import { logger } from '../logger';

export interface ApiAuthErrorState {
  isAuthError: boolean;
  status?: number;
  message: string;
}

export function handleApiError(
  error: unknown,
  options?: {
    onUnauthorized?: () => void;
    onForbidden?: () => void;
  }
): ApiAuthErrorState {
  let status: number | undefined;
  let rawMessage = '';

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    status = typeof err.status === 'number' ? err.status : undefined;
    rawMessage = typeof err.message === 'string' ? err.message : '';

    // Some Supabase error payloads have code or statusCode
    if (!status && typeof err.code === 'string' && !isNaN(Number(err.code))) {
      status = Number(err.code);
    }
  }

  // Check for 401 Unauthorized
  if (status === 401 || rawMessage.toLowerCase().includes('jwt expired') || rawMessage.toLowerCase().includes('invalid token')) {
    logger.error('Authentication session expired or unauthorized (401).');
    if (options?.onUnauthorized) {
      options.onUnauthorized();
    }
    return {
      isAuthError: true,
      status: 401,
      message: 'Sua sessão expirou ou não é válida. Por favor, realize login novamente.',
    };
  }

  // Check for 403 Forbidden
  if (status === 403 || rawMessage.toLowerCase().includes('forbidden') || rawMessage.toLowerCase().includes('permission denied')) {
    logger.error('Access forbidden: insufficient permissions (403).');
    if (options?.onForbidden) {
      options.onForbidden();
    }
    return {
      isAuthError: true,
      status: 403,
      message: 'Acesso negado: você não tem permissão para realizar esta operação.',
    };
  }

  logger.error('API operation failed.');
  return {
    isAuthError: false,
    status,
    message: 'Não foi possível completar a operação. Tente novamente mais tarde.',
  };
}
