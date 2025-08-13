// Encryption Service for KHS CRM
// Handles encryption/decryption of sensitive data

import { DataClassification } from '../types/security';

// Use Web Crypto API for encryption
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const SALT_LENGTH = 16; // 128 bits

export class EncryptionService {
  private encryptionKey: CryptoKey | null = null;
  private isInitialized = false;

  // Initialize encryption with a user-provided password
  async initialize(password: string): Promise<void> {
    if (!password) {
      throw new Error('Password is required for encryption');
    }

    try {
      // Derive encryption key from password
      const salt = this.getSalt();
      this.encryptionKey = await this.deriveKey(password, salt);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Failed to initialize encryption service');
    }
  }

  // Check if encryption is ready
  isReady(): boolean {
    return this.isInitialized && this.encryptionKey !== null;
  }

  // Encrypt data based on classification
  async encrypt(data: unknown, classification: DataClassification): Promise<string> {
    // Only encrypt CONFIDENTIAL data
    if (classification !== DataClassification.CONFIDENTIAL) {
      return JSON.stringify(data);
    }

    if (!this.isReady()) {
      throw new Error('Encryption not initialized');
    }

    try {
      const plaintext = JSON.stringify(data);
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(plaintext);

      // Generate random IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // Encrypt the data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv: iv,
        },
        this.encryptionKey!,
        encodedData,
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  async decrypt(encryptedData: string, classification: DataClassification): Promise<unknown> {
    // Only decrypt data that was encrypted
    if (classification !== DataClassification.CONFIDENTIAL) {
      return JSON.parse(encryptedData);
    }

    if (!this.isReady()) {
      throw new Error('Encryption not initialized');
    }

    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, IV_LENGTH);
      const encrypted = combined.slice(IV_LENGTH);

      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv: iv,
        },
        this.encryptionKey!,
        encrypted,
      );

      // Convert back to string and parse JSON
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedData);
      return JSON.parse(plaintext);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Derive encryption key from password
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    // Derive AES-GCM key from password
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  // Get or generate salt for key derivation
  private getSalt(): Uint8Array {
    const storedSalt = localStorage.getItem('khs-crm-encryption-salt');
    
    if (storedSalt) {
      // Convert from base64
      return Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
    }

    // Generate new salt
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    
    // Store for future use
    localStorage.setItem('khs-crm-encryption-salt', btoa(String.fromCharCode(...salt)));
    
    return salt;
  }

  // Clear encryption key (for logout)
  clear(): void {
    this.encryptionKey = null;
    this.isInitialized = false;
  }

  // Test encryption/decryption
  async test(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const testData = { test: 'encryption test', timestamp: Date.now() };
      const encrypted = await this.encrypt(testData, DataClassification.CONFIDENTIAL);
      const decrypted = await this.decrypt(encrypted, DataClassification.CONFIDENTIAL);
      
      return JSON.stringify(testData) === JSON.stringify(decrypted);
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();

// Helper function to check if data needs encryption
export function needsEncryption(classification: DataClassification): boolean {
  return classification === DataClassification.CONFIDENTIAL;
}

// Secure string comparison (constant time)
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}