import bcrypt from 'bcryptjs';
import { loadWebConfig } from '@pare-engine/core/config';
import { createSession, validateSession, destroySession } from './session';

export { createSession, validateSession, destroySession };

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AuthResult> {
  let adminEmail: string;
  let adminPasswordHash: string;
  try {
    const config = loadWebConfig();
    adminEmail = config.adminEmail;
    adminPasswordHash = config.adminPasswordHash;
  } catch {
    return { success: false, error: 'Admin credentials not configured' };
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    return { success: false, error: 'Invalid email or password' };
  }

  const valid = await verifyPassword(password, adminPasswordHash);
  if (!valid) {
    return { success: false, error: 'Invalid email or password' };
  }

  await createSession();
  return { success: true };
}

export async function isAuthenticated(): Promise<boolean> {
  return validateSession();
}

export async function logoutAdmin(): Promise<void> {
  return destroySession();
}
