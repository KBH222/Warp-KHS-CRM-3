// Security Types and Interfaces for KHS CRM

export enum DataClassification {
  PUBLIC = 'public',           // Business operational data (names, addresses, schedules)
  INTERNAL = 'internal',       // Work-related data (jobs, materials, assignments)
  CONFIDENTIAL = 'confidential', // Financial data (pricing, payments, margins)
  RESTRICTED = 'restricted',    // Truly private (SSN, medical, banking)
}

export interface SecurityMetadata {
  classification: DataClassification;
  lastModified: string;
  lastAccessed?: string;
  accessCount?: number;
  encryptionStatus?: 'none' | 'at-rest' | 'in-transit' | 'full';
}

export interface AuditLogEntry {
  timestamp: string;
  action: 'read' | 'write' | 'delete' | 'sync' | 'export';
  dataType: string;
  userId?: string;
  details?: string;
  success: boolean;
}

export interface SecuritySettings {
  enableAuditLogging: boolean;
  enableEncryption: boolean;
  syncEnabled: boolean;
  allowedSyncTypes: DataClassification[];
  localNetworkSyncOnly: boolean;
  requireAuthentication: boolean;
}

// Default security settings - practical for business use
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  enableAuditLogging: true,
  enableEncryption: true,
  syncEnabled: true,
  allowedSyncTypes: [DataClassification.PUBLIC, DataClassification.INTERNAL],
  localNetworkSyncOnly: false,
  requireAuthentication: true,
};

// Helper to determine if data can be synced
export function canSyncData(
  classification: DataClassification,
  settings: SecuritySettings,
): boolean {
  if (!settings.syncEnabled) {
    return false;
  }
  if (classification === DataClassification.RESTRICTED) {
    return false;
  }
  return settings.allowedSyncTypes.includes(classification);
}

// Helper to redact sensitive data for logging
export function redactSensitiveData(data: unknown, classification: DataClassification): unknown {
  if (classification === DataClassification.PUBLIC) {
    return data;
  }
  
  if (classification === DataClassification.RESTRICTED) {
    return '[REDACTED - RESTRICTED DATA]';
  }
  
  // For other classifications, redact specific fields
  if (typeof data === 'object' && data !== null) {
    const redacted = { ...data } as Record<string, unknown>;
    const sensitiveFields = ['phone', 'email', 'address', 'ssn', 'creditCard'];
    
    for (const field of sensitiveFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }
    
    return redacted;
  }
  
  return data;
}