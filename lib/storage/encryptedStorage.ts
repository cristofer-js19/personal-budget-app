/**
 * Encrypted client storage implementing Rule 2:
 * "Financial data must not be stored in localStorage or sessionStorage without encryption."
 *
 * Uses Web Crypto API (AES-GCM 256-bit with PBKDF2 key derivation).
 */

const APP_STORAGE_SALT = 'financas-secure-v1-salt';
const STORAGE_PASSPHRASE = 'financas-client-budget-encryption-secret';

async function getEncryptionKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(STORAGE_PASSPHRASE),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(APP_STORAGE_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptData<T>(data: T): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is not available.');
  }

  const key = await getEncryptionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const payload = {
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(cipherBuffer),
  };

  return JSON.stringify(payload);
}

export async function decryptData<T>(encryptedString: string): Promise<T> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is not available.');
  }

  // Backward compatibility: If previously stored as unencrypted JSON, parse directly
  try {
    const parsed = JSON.parse(encryptedString);
    if (!parsed || typeof parsed !== 'object' || !('iv' in parsed) || !('data' in parsed)) {
      return parsed as T;
    }

    const key = await getEncryptionKey();
    const iv = new Uint8Array(base64ToArrayBuffer(parsed.iv));
    const cipherBuffer = base64ToArrayBuffer(parsed.data);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedText) as T;
  } catch (err) {
    // If decryption fails, try reading as legacy JSON
    try {
      return JSON.parse(encryptedString) as T;
    } catch {
      throw err;
    }
  }
}

export async function setEncryptedLocalStorage<T>(key: string, data: T): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const ciphertext = await encryptData(data);
    localStorage.setItem(key, ciphertext);
  } catch {
    // Silently prevent unencrypted leak if encryption fails
  }
}

export async function getEncryptedLocalStorage<T>(key: string, fallback: T): Promise<T> {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const result = await decryptData<T>(raw);
    // Auto-migrate legacy unencrypted data to encrypted
    if (raw.startsWith('[') || raw.startsWith('{')) {
      if (!raw.includes('"iv"') || !raw.includes('"data"')) {
        await setEncryptedLocalStorage(key, result);
      }
    }
    return result;
  } catch {
    return fallback;
  }
}
