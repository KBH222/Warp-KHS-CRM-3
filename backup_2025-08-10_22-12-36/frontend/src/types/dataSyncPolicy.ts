// Practical Data Sync Policy for Construction Business
// Balances real-world needs with appropriate security

export interface FieldSyncPolicy {
  sync: 'yes' | 'no';
  encrypted?: boolean;
  reason?: string;
}

export interface SyncPolicy {
  [key: string]: FieldSyncPolicy | { [field: string]: FieldSyncPolicy };
}

// Realistic sync policy for construction business
export const SYNC_POLICY: SyncPolicy = {
  customers: {
    // Business-relevant information (safe to sync)
    name: { sync: 'yes', reason: 'Public record, needed for business' },
    address: { sync: 'yes', reason: 'Public record, job site location' },
    phone: { sync: 'yes', reason: 'Business contact information' },
    email: { sync: 'yes', reason: 'Business communication' },
    reference: { sync: 'yes', reason: 'Lead source tracking' },
    notes: { sync: 'yes', reason: 'General job notes' },
    
    // Truly sensitive fields (keep local)
    paymentMethod: { sync: 'no', encrypted: true, reason: 'Financial data' },
    creditCard: { sync: 'no', encrypted: true, reason: 'Payment information' },
    bankAccount: { sync: 'no', encrypted: true, reason: 'Banking details' },
    ssn: { sync: 'no', encrypted: true, reason: 'Personal identifier' },
    privateNotes: { sync: 'no', reason: 'Confidential information' },
    pricing: { sync: 'no', encrypted: true, reason: 'Business margins' },
  },
  
  jobs: {
    // Project information (safe to sync)
    title: { sync: 'yes', reason: 'Job identification' },
    description: { sync: 'yes', reason: 'Work scope' },
    location: { sync: 'yes', reason: 'Job site address' },
    startDate: { sync: 'yes', reason: 'Schedule coordination' },
    endDate: { sync: 'yes', reason: 'Timeline management' },
    status: { sync: 'yes', reason: 'Progress tracking' },
    materials: { sync: 'yes', reason: 'Supply management' },
    assignedTo: { sync: 'yes', reason: 'Worker assignments' },
    photos: { sync: 'yes', reason: 'Progress documentation' },
    documents: { sync: 'yes', reason: 'Plans and permits' },
    comments: { sync: 'yes', reason: 'Team communication' },
    
    // Financial fields (keep local)
    totalCost: { sync: 'no', encrypted: true, reason: 'Pricing information' },
    laborCost: { sync: 'no', encrypted: true, reason: 'Internal costs' },
    materialCost: { sync: 'no', encrypted: true, reason: 'Supplier pricing' },
    margin: { sync: 'no', encrypted: true, reason: 'Profit margins' },
    invoiceDetails: { sync: 'no', encrypted: true, reason: 'Billing information' },
  },
  
  workers: {
    // Work-related information (safe to sync)
    name: { sync: 'yes', reason: 'Team identification' },
    phone: { sync: 'yes', reason: 'Work communication' },
    email: { sync: 'yes', reason: 'Team updates' },
    skills: { sync: 'yes', reason: 'Task assignment' },
    schedule: { sync: 'yes', reason: 'Availability tracking' },
    
    // Personal information (keep local)
    ssn: { sync: 'no', encrypted: true, reason: 'Legal requirement' },
    wage: { sync: 'no', encrypted: true, reason: 'Payroll confidential' },
    emergencyContact: { sync: 'no', reason: 'Private information' },
    medicalInfo: { sync: 'no', encrypted: true, reason: 'HIPAA protected' },
  },
  
  materials: {
    // Inventory information (safe to sync)
    name: { sync: 'yes', reason: 'Material tracking' },
    quantity: { sync: 'yes', reason: 'Inventory management' },
    supplier: { sync: 'yes', reason: 'Ordering information' },
    location: { sync: 'yes', reason: 'Storage tracking' },
    
    // Pricing (keep local)
    cost: { sync: 'no', encrypted: true, reason: 'Supplier pricing' },
    markup: { sync: 'no', encrypted: true, reason: 'Profit margins' },
  },
};

// Helper to check if a field should sync
export function shouldSyncField(
  category: string, 
  field: string
): boolean {
  const categoryPolicy = SYNC_POLICY[category];
  if (!categoryPolicy || typeof categoryPolicy === 'object' && 'sync' in categoryPolicy) {
    return false;
  }
  
  const fieldPolicy = categoryPolicy[field];
  return fieldPolicy?.sync === 'yes';
}

// Helper to check if a field needs encryption
export function needsEncryption(
  category: string, 
  field: string
): boolean {
  const categoryPolicy = SYNC_POLICY[category];
  if (!categoryPolicy || typeof categoryPolicy === 'object' && 'sync' in categoryPolicy) {
    return false;
  }
  
  const fieldPolicy = categoryPolicy[field];
  return fieldPolicy?.encrypted === true;
}

// Filter object for syncing (removes local-only fields)
export function filterForSync<T extends Record<string, any>>(
  data: T,
  category: string
): Partial<T> {
  const filtered: Partial<T> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (shouldSyncField(category, key)) {
      filtered[key as keyof T] = value;
    }
  }
  
  return filtered;
}

// Extract local-only fields
export function extractLocalOnly<T extends Record<string, any>>(
  data: T,
  category: string
): Partial<T> {
  const localOnly: Partial<T> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (!shouldSyncField(category, key)) {
      localOnly[key as keyof T] = value;
    }
  }
  
  return localOnly;
}