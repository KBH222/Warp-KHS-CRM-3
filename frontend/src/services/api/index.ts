export * from './customers.api';
export * from './jobs.api';
export * from './auth.api';
export * from './workers.api';
export * from './khsToolsSync.api';
export * from './scheduleEvents.api';

// Sync all data
export async function syncAllData() {
  const { customersApi } = await import('./customers.api');
  const { jobsApi } = await import('./jobs.api');
  const { workersApi } = await import('./workers.api');
  
  try {
    await Promise.all([
      customersApi.sync(),
      jobsApi.sync(),
      workersApi.sync()
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}