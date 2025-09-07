// Clear temporary customer IDs script
// Run this in browser console or as a script

console.log('🧹 Starting temp customer cleanup...');

// Function to clear temp customers from localStorage
function clearTempCustomersFromStorage() {
  try {
    // Get customers from localStorage
    const customersJson = localStorage.getItem('khs-crm-customers');
    if (customersJson) {
      const customers = JSON.parse(customersJson);
      console.log('📋 Found customers in localStorage:', customers.length);
      
      // Filter out temp customers
      const realCustomers = customers.filter(customer => !customer.id.startsWith('temp_'));
      const tempCustomers = customers.filter(customer => customer.id.startsWith('temp_'));
      
      console.log('🗑️ Found temp customers to remove:', tempCustomers.length);
      console.log('✅ Keeping real customers:', realCustomers.length);
      
      // Log temp customers being removed
      tempCustomers.forEach(customer => {
        console.log(`  - Removing: ${customer.id} (${customer.name})`);
      });
      
      // Save back only real customers
      localStorage.setItem('khs-crm-customers', JSON.stringify(realCustomers));
      
      return { removed: tempCustomers.length, kept: realCustomers.length };
    }
    return { removed: 0, kept: 0 };
  } catch (error) {
    console.error('❌ Error clearing temp customers from localStorage:', error);
    return { removed: 0, kept: 0 };
  }
}

// Function to clear temp customers from IndexedDB
async function clearTempCustomersFromIndexedDB() {
  try {
    // Open IndexedDB
    const request = indexedDB.open('khs-crm-offline', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('customers')) {
          console.log('📝 No customers store in IndexedDB');
          resolve({ removed: 0, kept: 0 });
          return;
        }
        
        const transaction = db.transaction(['customers'], 'readwrite');
        const store = transaction.objectStore('customers');
        
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const customers = getAllRequest.result;
          console.log('📋 Found customers in IndexedDB:', customers.length);
          
          const tempCustomers = customers.filter(customer => customer.id.startsWith('temp_'));
          const realCustomers = customers.filter(customer => !customer.id.startsWith('temp_'));
          
          console.log('🗑️ Found temp customers to remove from IndexedDB:', tempCustomers.length);
          console.log('✅ Keeping real customers in IndexedDB:', realCustomers.length);
          
          // Delete temp customers
          let deletedCount = 0;
          tempCustomers.forEach(customer => {
            console.log(`  - Removing from IndexedDB: ${customer.id} (${customer.name})`);
            const deleteRequest = store.delete(customer.id);
            deleteRequest.onsuccess = () => {
              deletedCount++;
              if (deletedCount === tempCustomers.length) {
                resolve({ removed: tempCustomers.length, kept: realCustomers.length });
              }
            };
          });
          
          if (tempCustomers.length === 0) {
            resolve({ removed: 0, kept: realCustomers.length });
          }
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  } catch (error) {
    console.error('❌ Error clearing temp customers from IndexedDB:', error);
    return { removed: 0, kept: 0 };
  }
}

// Function to clear sync queue of temp customer operations
function clearTempSyncQueue() {
  try {
    const queueJson = localStorage.getItem('khs-crm-sync-queue');
    if (queueJson) {
      const queue = JSON.parse(queueJson);
      console.log('📋 Found sync queue items:', queue.length);
      
      const nonTempItems = queue.filter(item => {
        // Remove items that are for temp customers
        if (item.entityType === 'customer' && item.entityId && item.entityId.startsWith('temp_')) {
          return false;
        }
        if (item.payload && item.payload.customerId && item.payload.customerId.startsWith('temp_')) {
          return false;
        }
        return true;
      });
      
      const removedItems = queue.length - nonTempItems.length;
      console.log('🗑️ Removed temp sync queue items:', removedItems);
      console.log('✅ Keeping sync queue items:', nonTempItems.length);
      
      localStorage.setItem('khs-crm-sync-queue', JSON.stringify(nonTempItems));
      return { removed: removedItems, kept: nonTempItems.length };
    }
    return { removed: 0, kept: 0 };
  } catch (error) {
    console.error('❌ Error clearing temp sync queue:', error);
    return { removed: 0, kept: 0 };
  }
}

// Main cleanup function
async function cleanupTempCustomers() {
  console.log('🚀 Starting comprehensive temp customer cleanup...');
  
  // 1. Clear from localStorage
  const localStorageResult = clearTempCustomersFromStorage();
  console.log('📝 localStorage cleanup:', localStorageResult);
  
  // 2. Clear from IndexedDB
  try {
    const indexedDBResult = await clearTempCustomersFromIndexedDB();
    console.log('🗃️ IndexedDB cleanup:', indexedDBResult);
  } catch (error) {
    console.log('⚠️ IndexedDB cleanup failed (might not exist):', error.message);
  }
  
  // 3. Clear sync queue
  const syncQueueResult = clearTempSyncQueue();
  console.log('🔄 Sync queue cleanup:', syncQueueResult);
  
  console.log('✅ Temp customer cleanup completed!');
  console.log('💡 You should now be able to save jobs and other data.');
  console.log('🔄 Refresh the page to see the changes.');
}

// Export for use
if (typeof window !== 'undefined') {
  window.cleanupTempCustomers = cleanupTempCustomers;
  console.log('💡 Run cleanupTempCustomers() in the console to clean temp data');
}

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined' && window.location) {
  console.log('🔧 Temp customer cleanup script loaded. Run cleanupTempCustomers() to clean up.');
}
