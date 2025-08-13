// Cleanup script to remove all Google Drive references
export const cleanupGoogleDrive = () => {
  // Remove any Google Drive related items from localStorage
  const keysToRemove = [
    'google_access_token',
    'google_refresh_token',
    'google_drive_folder_id',
    'google_sync_enabled',
    'khs-crm-google-sync'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Google Drive references cleaned up');
};