/**
 * Production-safe logger that strictly obeys Rule 2:
 * "Never log, print, or expose transaction amounts, balances, or user data
 * using console.log, print, or log files in a production environment."
 */

const isProduction = process.env.NODE_ENV === 'production';

// Keywords that indicate sensitive financial or user data
const SENSITIVE_KEYS = [
  'amount',
  'balance',
  'totalbalance',
  'totalincome',
  'totalexpense',
  'email',
  'password',
  'user',
  'notes',
  'description',
  'transactions',
  'token',
  'authorization',
  'cookie',
];

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: isProduction ? 'An unexpected error occurred.' : value.message,
    };
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (typeof value === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const lowerKey = k.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitizedObj[k] = '[REDACTED]';
      } else {
        sanitizedObj[k] = sanitize(v);
      }
    }
    return sanitizedObj;
  }

  return '[REDACTED]';
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isProduction) return;
    console.log(...args.map(sanitize));
  },
  info: (...args: unknown[]) => {
    if (isProduction) return;
    console.info(...args.map(sanitize));
  },
  warn: (...args: unknown[]) => {
    if (isProduction) return;
    console.warn(...args.map(sanitize));
  },
  error: (message: string, error?: unknown) => {
    if (isProduction) {
      // In production, log only high-level status message without sensitive parameters
      console.error(`[AppError]: ${message}`);
      return;
    }
    console.error(`[AppError]: ${message}`, sanitize(error));
  },
};
