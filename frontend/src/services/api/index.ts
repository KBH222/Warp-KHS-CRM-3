export * from './customers.api';
export * from './jobs.api';
export * from './auth.api';

// Sync all data
export async function syncAllData() {
  const { customersApi } = await import('./customers.api');
  const { jobsApi } = await import('./jobs.api');
  
  try {
    await Promise.all([
      customersApi.sync(),
      jobsApi.sync()
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}