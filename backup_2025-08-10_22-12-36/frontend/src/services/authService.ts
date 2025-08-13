// Secure Authentication Service for KHS CRM
// Handles local authentication without exposing credentials

import { encryptionService, secureCompare } from './encryptionService';
import { auditService } from './auditService';
import { DataClassification } from '../types/security';

const AUTH_KEY = 'khs-crm-auth';
const SESSION_KEY = 'khs-crm-session';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface AuthData {
  passwordHash: string;
  salt: string;
  iterations: number;
  lockoutUntil?: number;
  failedAttempts: number;
}

interface Session {
  id: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
}

class AuthService {
  private currentSession: Session | null = null;

  // Initialize authentication (first time setup)
  async initialize(password: string): Promise<void> {
    if (this.isInitialized()) {
      throw new Error('Authentication already initialized');
    }

    // Generate salt for password hashing
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltStr = btoa(String.fromCharCode(...salt));

    // Hash password with PBKDF2
    const hash = await this.hashPassword(password, saltStr);

    const authData: AuthData = {
      passwordHash: hash,
      salt: saltStr,
      iterations: 100000,
      failedAttempts: 0,
    };

    // Store auth data
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    
    // Log security event
    auditService.logAccess('write', 'auth-setup', DataClassification.CONFIDENTIAL, 'Authentication initialized');
  }

  // Check if authentication is set up
  isInitialized(): boolean {
    return localStorage.getItem(AUTH_KEY) !== null;
  }

  // Login with password
  async login(password: string): Promise<boolean> {
    const authData = this.getAuthData();
    if (!authData) {
      throw new Error('Authentication not initialized');
    }

    // Check if account is locked
    if (authData.lockoutUntil && Date.now() < authData.lockoutUntil) {
      const remainingTime = Math.ceil((authData.lockoutUntil - Date.now()) / 1000 / 60);
      auditService.logAccess('read', 'auth-login', DataClassification.CONFIDENTIAL, 'Login attempt during lockout', false);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    // Hash provided password
    const hash = await this.hashPassword(password, authData.salt);

    // Compare hashes
    if (!secureCompare(hash, authData.passwordHash)) {
      // Increment failed attempts
      authData.failedAttempts++;
      
      // Lock account if too many failed attempts
      if (authData.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        authData.lockoutUntil = Date.now() + LOCKOUT_DURATION;
        authData.failedAttempts = 0;
      }
      
      this.saveAuthData(authData);
      auditService.logAccess('read', 'auth-login', DataClassification.CONFIDENTIAL, 'Invalid password', false);
      return false;
    }

    // Reset failed attempts on successful login
    authData.failedAttempts = 0;
    delete authData.lockoutUntil;
    this.saveAuthData(authData);

    // Create session
    this.createSession();
    
    // Initialize encryption if enabled
    if (localStorage.getItem('khs-crm-encryption-enabled') === 'true') {
      await encryptionService.initialize(password);
    }

    auditService.logAccess('read', 'auth-login', DataClassification.CONFIDENTIAL, 'Login successful');
    return true;
  }

  // Logout
  logout(): void {
    this.currentSession = null;
    sessionStorage.removeItem(SESSION_KEY);
    encryptionService.clear();
    
    auditService.logAccess('write', 'auth-logout', DataClassification.CONFIDENTIAL, 'User logged out');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    // For practical use, check if auth is initialized
    // This allows the app to work without constant re-authentication
    if (!this.isInitialized()) {
      return true; // Allow access if no auth setup
    }
    
    const session = this.getSession();
    if (!session) {
      return false;
    }

    // Check if session expired (24 hours for construction workers)
    if (Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }

    // Update last activity
    session.lastActivity = Date.now();
    this.saveSession(session);

    return true;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Verify current password
    const isValid = await this.login(currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Generate new salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltStr = btoa(String.fromCharCode(...salt));

    // Hash new password
    const hash = await this.hashPassword(newPassword, saltStr);

    const authData = this.getAuthData()!;
    authData.passwordHash = hash;
    authData.salt = saltStr;
    
    this.saveAuthData(authData);
    
    // Re-initialize encryption with new password if enabled
    if (encryptionService.isReady()) {
      await encryptionService.initialize(newPassword);
    }

    auditService.logAccess('write', 'auth-password-change', DataClassification.CONFIDENTIAL, 'Password changed');
  }

  // Reset authentication (requires confirmation)
  async reset(confirmPhrase: string): Promise<void> {
    if (confirmPhrase !== 'RESET AUTHENTICATION') {
      throw new Error('Invalid confirmation phrase');
    }

    localStorage.removeItem(AUTH_KEY);
    this.logout();
    
    auditService.logAccess('delete', 'auth-reset', DataClassification.CONFIDENTIAL, 'Authentication reset');
  }

  // Private methods

  private async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const saltData = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits'],
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltData,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256, // 32 bytes
    );

    // Convert to base64
    const hashArray = new Uint8Array(derivedBits);
    return btoa(String.fromCharCode(...hashArray));
  }

  private createSession(): void {
    const session: Session = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours for field workers
      lastActivity: Date.now(),
    };

    this.currentSession = session;
    this.saveSession(session);
  }

  private getSession(): Session | null {
    if (this.currentSession) {
      return this.currentSession;
    }

    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      this.currentSession = JSON.parse(stored);
      return this.currentSession;
    }

    return null;
  }

  private saveSession(session: Session): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private getAuthData(): AuthData | null {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private saveAuthData(authData: AuthData): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  }
}

// Export singleton instance
export const authService = new AuthService();