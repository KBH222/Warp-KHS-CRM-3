// Audit Logging Service for KHS CRM
// Tracks all data access and modifications for security compliance

import { AuditLogEntry, DataClassification, redactSensitiveData } from '../types/security';

const AUDIT_LOG_KEY = 'khs-crm-audit-log';
const MAX_LOG_ENTRIES = 1000; // Keep last 1000 entries

class AuditService {
  private enabled: boolean = true;

  // Log a data access event
  logAccess(
    action: AuditLogEntry['action'],
    dataType: string,
    classification: DataClassification,
    details?: unknown,
    success = true,
  ): void {
    if (!this.enabled) return;

    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      dataType,
      details: redactSensitiveData(details, classification),
      success,
    };

    this.addEntry(entry);
  }

  // Add entry to the audit log
  private addEntry(entry: AuditLogEntry): void {
    try {
      const logs = this.getAuditLog();
      logs.push(entry);

      // Keep only the most recent entries
      if (logs.length > MAX_LOG_ENTRIES) {
        logs.splice(0, logs.length - MAX_LOG_ENTRIES);
      }

      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  // Get the full audit log
  getAuditLog(): AuditLogEntry[] {
    try {
      const stored = localStorage.getItem(AUDIT_LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to read audit log:', error);
      return [];
    }
  }

  // Get audit log for specific data type
  getLogsByDataType(dataType: string): AuditLogEntry[] {
    return this.getAuditLog().filter(entry => entry.dataType === dataType);
  }

  // Get audit log for specific time range
  getLogsByTimeRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return this.getAuditLog().filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return entryTime >= start && entryTime <= end;
    });
  }

  // Clear audit log (requires special permission in future)
  clearAuditLog(): void {
    // Log the clear action itself
    this.logAccess('delete', 'audit-log', DataClassification.CONFIDENTIAL, 'Audit log cleared');
    localStorage.removeItem(AUDIT_LOG_KEY);
  }

  // Enable/disable audit logging
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.logAccess('write', 'audit-settings', DataClassification.INTERNAL, 'Audit logging enabled');
    }
  }

  // Export audit log for analysis
  exportLog(): string {
    const logs = this.getAuditLog();
    return JSON.stringify(logs, null, 2);
  }

  // Get summary statistics
  getStats(): {
    totalEntries: number;
    byAction: Record<string, number>;
    byDataType: Record<string, number>;
    recentFailures: AuditLogEntry[];
  } {
    const logs = this.getAuditLog();
    const byAction: Record<string, number> = {};
    const byDataType: Record<string, number> = {};
    const recentFailures: AuditLogEntry[] = [];
    
    logs.forEach(entry => {
      // Count by action
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      
      // Count by data type
      byDataType[entry.dataType] = (byDataType[entry.dataType] || 0) + 1;
      
      // Collect recent failures
      if (!entry.success && recentFailures.length < 10) {
        recentFailures.push(entry);
      }
    });

    return {
      totalEntries: logs.length,
      byAction,
      byDataType,
      recentFailures,
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();

// Helper function to create audit-aware storage operations
export function auditedOperation<T>(
  operation: () => T,
  action: AuditLogEntry['action'],
  dataType: string,
  classification: DataClassification,
  details?: unknown,
): T {
  try {
    const result = operation();
    auditService.logAccess(action, dataType, classification, details, true);
    return result;
  } catch (error) {
    auditService.logAccess(action, dataType, classification, { error: (error as Error).message }, false);
    throw error;
  }
}