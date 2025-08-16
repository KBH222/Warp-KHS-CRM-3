// Inline type definitions
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'worker';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

type Role = 'admin' | 'manager' | 'worker';

// Inline constants
const STORAGE_KEYS = {
  AUTH_TOKEN: 'khs-crm-token',
  REFRESH_TOKEN: 'khs-crm-refresh-token',
  USER_DATA: 'khs-crm-user',
  OFFLINE_DATA: 'khs-crm-offline-data',
  SYNC_QUEUE: 'khs-crm-sync-queue',
  CACHE_MANIFEST: 'khs-crm-cache-manifest',
  ENCRYPTION_KEY: 'khs-crm-encryption-key',
  BIOMETRIC_ENABLED: 'khs-crm-biometric-enabled'
};

const API_ENDPOINTS = {
  CUSTOMERS: '/customers',
  JOBS: '/jobs',
  MATERIALS: '/materials',
  USERS: '/users',
  AUTH: '/auth',
  SYNC: '/sync'
};
import { offlineDb } from './db.service';
import { apiClient } from './api.service';

interface EncryptedCredentials {
  email: string;
  encryptedPassword: string;
  salt: string;
  iterations: number;
}

interface BiometricAuthData {
  challenge: string;
  signature: string;
  publicKey: string;
}

interface OfflineSession {
  user: User;
  credentials: EncryptedCredentials;
  biometricData?: BiometricAuthData;
  expiresAt: number;
  lastLoginAt: number;
}

class OfflineAuthService {
  private currentSession: OfflineSession | null = null;
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly ENCRYPTION_ITERATIONS = 100000;

  /**
   * Initialize the offline auth service
   */
  async initialize(): Promise<void> {
    await this.loadStoredSession();
  }

  /**
   * Generate a cryptographic salt
   */
  private generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: string, iterations: number): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt password using AES-GCM
   */
  private async encryptPassword(password: string, salt: string): Promise<string> {
    const key = await this.deriveKey(password, salt, this.ENCRYPTION_ITERATIONS);
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt password using AES-GCM
   */
  private async decryptPassword(
    encryptedPassword: string,
    salt: string,
    iterations: number
  ): Promise<string> {
    const key = await this.deriveKey('', salt, iterations);
    const combined = new Uint8Array(
      atob(encryptedPassword).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt password');
    }
  }

  /**
   * Verify password against stored encrypted credentials
   */
  private async verifyPassword(
    inputPassword: string,
    credentials: EncryptedCredentials
  ): Promise<boolean> {
    try {
      const key = await this.deriveKey(inputPassword, credentials.salt, credentials.iterations);
      const combined = new Uint8Array(
        atob(credentials.encryptedPassword).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const decryptedPassword = decoder.decode(decrypted);
      return decryptedPassword === inputPassword;
    } catch {
      return false;
    }
  }

  /**
   * Check if biometric authentication is supported
   */
  async isBiometricSupported(): Promise<boolean> {
    return !!(
      'credentials' in navigator &&
      'create' in navigator.credentials &&
      'get' in navigator.credentials &&
      window.PublicKeyCredential &&
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    );
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometric(userId: string): Promise<BiometricAuthData | null> {
    if (!(await this.isBiometricSupported())) {
      return null;
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'KHS CRM',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: `user-${userId}`,
            displayName: 'KHS CRM User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (!credential) {
        return null;
      }

      return {
        challenge: btoa(String.fromCharCode(...challenge)),
        signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature))),
        publicKey: credential.id,
      };
    } catch (error) {
      console.error('Biometric setup failed:', error);
      return null;
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticateBiometric(biometricData: BiometricAuthData): Promise<boolean> {
    if (!(await this.isBiometricSupported())) {
      return false;
    }

    try {
      const challenge = new Uint8Array(
        atob(biometricData.challenge).split('').map(char => char.charCodeAt(0))
      );

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: new TextEncoder().encode(biometricData.publicKey),
            type: 'public-key',
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      return !!credential;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  /**
   * Store credentials securely for offline use
   */
  private async storeOfflineCredentials(
    user: User,
    credentials: LoginRequest,
    biometricData?: BiometricAuthData
  ): Promise<void> {
    const salt = this.generateSalt();
    const encryptedPassword = await this.encryptPassword(credentials.password, salt);

    const encryptedCredentials: EncryptedCredentials = {
      email: credentials.email,
      encryptedPassword,
      salt,
      iterations: this.ENCRYPTION_ITERATIONS,
    };

    const session: OfflineSession = {
      user,
      credentials: encryptedCredentials,
      biometricData,
      expiresAt: Date.now() + this.SESSION_DURATION,
      lastLoginAt: Date.now(),
    };

    // Store in IndexedDB
    await offlineDb.initialize();
    const db = await (offlineDb as any).ensureDb();
    await db.put('auth', {
      id: 'current-session',
      encryptedCredentials: JSON.stringify(encryptedCredentials),
      biometricEnabled: !!biometricData,
      lastLoginAt: session.lastLoginAt,
      rememberMe: credentials.rememberMe || false,
      _version: 1,
    });

    // Also store user data
    await offlineDb.saveUser(user);
    this.currentSession = session;
  }

  /**
   * Load stored session from IndexedDB
   */
  private async loadStoredSession(): Promise<void> {
    try {
      await offlineDb.initialize();
      const db = await (offlineDb as any).ensureDb();
      const authData = await db.get('auth', 'current-session');

      if (!authData) {
        return;
      }

      // Check if session is expired (for remembered sessions)
      if (!authData.rememberMe && Date.now() - authData.lastLoginAt > 24 * 60 * 60 * 1000) {
        await this.clearStoredSession();
        return;
      }

      const credentials: EncryptedCredentials = JSON.parse(authData.encryptedCredentials);
      const user = await offlineDb.getUser(credentials.email) || await this.createGuestUser(credentials.email);

      this.currentSession = {
        user,
        credentials,
        biometricData: authData.biometricEnabled ? { 
          challenge: '', 
          signature: '', 
          publicKey: `biometric-${user.id}` 
        } : undefined,
        expiresAt: Date.now() + this.SESSION_DURATION,
        lastLoginAt: authData.lastLoginAt,
      };
    } catch (error) {
      console.error('Failed to load stored session:', error);
      await this.clearStoredSession();
    }
  }

  /**
   * Create a guest user for offline scenarios
   */
  private async createGuestUser(email: string): Promise<User> {
    return {
      id: `offline-${Date.now()}`,
      email,
      name: 'Offline User',
      role: Role.WORKER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Clear stored session data
   */
  private async clearStoredSession(): Promise<void> {
    try {
      await offlineDb.initialize();
      const db = await (offlineDb as any).ensureDb();
      await db.delete('auth', 'current-session');
      this.currentSession = null;
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  }

  /**
   * Login with online/offline fallback
   */
  async login(credentials: LoginRequest, enableBiometric = false): Promise<User> {
    try {
      // Try online login first
      if (navigator.onLine) {
        const tokens = await apiClient.post<AuthTokens>(API_ENDPOINTS.LOGIN, credentials);
        const user = await apiClient.get<User>(API_ENDPOINTS.ME);

        // Store tokens in localStorage for API calls
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);

        // Setup biometric if requested
        let biometricData: BiometricAuthData | undefined;
        if (enableBiometric) {
          biometricData = await this.setupBiometric(user.id) || undefined;
        }

        // Store credentials for offline use
        await this.storeOfflineCredentials(user, credentials, biometricData);

        return user;
      }
    } catch (error) {
      console.warn('Online login failed, attempting offline login:', error);
    }

    // Fallback to offline login
    return this.offlineLogin(credentials);
  }

  /**
   * Offline login using stored credentials
   */
  async offlineLogin(credentials: LoginRequest): Promise<User> {
    await this.loadStoredSession();

    if (!this.currentSession) {
      throw new Error('No stored credentials available for offline login');
    }

    // Verify credentials
    if (this.currentSession.credentials.email !== credentials.email) {
      throw new Error('Email does not match stored credentials');
    }

    const isValidPassword = await this.verifyPassword(
      credentials.password,
      this.currentSession.credentials
    );

    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Update last login time
    this.currentSession.lastLoginAt = Date.now();
    await this.storeOfflineCredentials(
      this.currentSession.user,
      credentials,
      this.currentSession.biometricData
    );

    return this.currentSession.user;
  }

  /**
   * Biometric login
   */
  async biometricLogin(): Promise<User> {
    await this.loadStoredSession();

    if (!this.currentSession?.biometricData) {
      throw new Error('Biometric authentication not set up');
    }

    const isAuthenticated = await this.authenticateBiometric(this.currentSession.biometricData);
    if (!isAuthenticated) {
      throw new Error('Biometric authentication failed');
    }

    // Update last login time
    this.currentSession.lastLoginAt = Date.now();
    return this.currentSession.user;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Try to logout from server if online
      if (navigator.onLine) {
        await apiClient.post(API_ENDPOINTS.LOGOUT);
      }
    } catch (error) {
      console.warn('Server logout failed:', error);
    }

    // Clear local session
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await this.clearStoredSession();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentSession?.user || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentSession?.user;
  }

  /**
   * Check if biometric is available for current user
   */
  isBiometricEnabled(): boolean {
    return !!this.currentSession?.biometricData;
  }

  /**
   * Enable biometric for current user
   */
  async enableBiometric(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    const biometricData = await this.setupBiometric(this.currentSession.user.id);
    if (!biometricData) {
      return false;
    }

    // Update stored session with biometric data
    this.currentSession.biometricData = biometricData;
    await this.storeOfflineCredentials(
      this.currentSession.user,
      { 
        email: this.currentSession.credentials.email, 
        password: '' // We don't store the actual password
      },
      biometricData
    );

    return true;
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.biometricData = undefined;
    await this.storeOfflineCredentials(
      this.currentSession.user,
      { 
        email: this.currentSession.credentials.email, 
        password: '' 
      }
    );
  }

  /**
   * Refresh user data if online
   */
  async refreshUser(): Promise<User | null> {
    if (!navigator.onLine || !this.currentSession) {
      return this.currentSession?.user || null;
    }

    try {
      const user = await apiClient.get<User>(API_ENDPOINTS.ME);
      this.currentSession.user = user;
      await offlineDb.saveUser(user);
      return user;
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
      return this.currentSession?.user || null;
    }
  }
}

export const offlineAuthService = new OfflineAuthService();

// Auto-initialize
offlineAuthService.initialize().catch(error => {
  console.error('Failed to initialize offline auth service:', error);
});