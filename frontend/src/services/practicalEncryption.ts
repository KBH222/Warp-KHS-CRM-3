// Practical Encryption Service - Only for Financial Data
// Uses simple encryption for genuinely sensitive information

import { needsEncryption } from '../types/dataSyncPolicy';

class PracticalEncryptionService {
  private password: string | null = null;

  // Set password for encryption (simplified)
  setPassword(password: string): void {
    this.password = password;
  }

  // Check if ready to encrypt
  isReady(): boolean {
    return this.password !== null;
  }

  // Simple XOR encryption for financial data (production should use proper crypto)
  encrypt(data: string): string {
    if (!this.password) return data;
    
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ this.password.charCodeAt(i % this.password.length)
      );
    }
    return btoa(result); // Base64 encode
  }

  // Simple XOR decryption
  decrypt(data: string): string {
    if (!this.password) return data;
    
    try {
      const decoded = atob(data); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.password.charCodeAt(i % this.password.length)
        );
      }
      return result;
    } catch {
      return data; // Return as-is if decryption fails
    }
  }

  // Encrypt only financial fields in an object
  encryptObject<T extends Record<string, any>>(
    obj: T, 
    category: string
  ): T {
    if (!this.isReady()) return obj;

    const encrypted = { ...obj };
    
    for (const [key, value] of Object.entries(obj)) {
      if (needsEncryption(category, key) && typeof value === 'string') {
        encrypted[key] = this.encrypt(value);
      } else if (needsEncryption(category, key) && typeof value === 'number') {
        encrypted[key] = this.encrypt(value.toString());
      }
    }
    
    return encrypted;
  }

  // Decrypt only financial fields in an object
  decryptObject<T extends Record<string, any>>(
    obj: T, 
    category: string
  ): T {
    if (!this.isReady()) return obj;

    const decrypted = { ...obj };
    
    for (const [key, value] of Object.entries(obj)) {
      if (needsEncryption(category, key) && typeof value === 'string') {
        const decryptedValue = this.decrypt(value);
        // Try to convert back to number if it was originally a number
        const numValue = parseFloat(decryptedValue);
        decrypted[key] = isNaN(numValue) ? decryptedValue : numValue;
      }
    }
    
    return decrypted;
  }

  // Clear password
  clear(): void {
    this.password = null;
  }
}

// Export singleton
export const practicalEncryption = new PracticalEncryptionService();

// Helper to check if we should show encrypted data
export function shouldShowEncrypted(): boolean {
  return practicalEncryption.isReady();
}