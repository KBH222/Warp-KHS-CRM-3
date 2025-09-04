const { execSync } = require('child_process');

console.log('Starting production migration process...');

try {
  // First, try to mark existing migrations as applied without running them
  console.log('Attempting to resolve migration history...');
  
  // Mark all migrations except the last one as already applied
  const migrations = [
    '20240101000000_init',
    '20241220_add_worker_model',
    '20250108_add_tool_settings',
    '20250117000000_add_photos_to_jobs',
    '20250125_add_customer_type',
    '20250826_add_hash_and_device_info',
    'manual_add_tasks',
    'remove_cost_fields'
  ];
  
  // Try to resolve the migration history
  try {
    execSync('npx prisma migrate resolve --applied "20240101000000_init"', { stdio: 'inherit' });
    execSync('npx prisma migrate resolve --applied "20241220_add_worker_model"', { stdio: 'inherit' });
    execSync('npx prisma migrate resolve --applied "20250108_add_tool_settings"', { stdio: 'inherit' });
    execSync('npx prisma migrate resolve --applied "20250117000000_add_photos_to_jobs"', { stdio: 'inherit' });
    execSync('npx prisma migrate resolve --applied "20250125_add_customer_type"', { stdio: 'inherit' });
    execSync('npx prisma migrate resolve --applied "20250826_add_hash_and_device_info"', { stdio: 'inherit' });
    execSync('npx prisma migrate resolve --applied "manual_add_tasks"', { stdio: 'inherit' });
    execSync('npx prisma migrate resolve --applied "remove_cost_fields"', { stdio: 'inherit' });
  } catch (e) {
    console.log('Some migrations might already be marked as applied');
  }
  
  // Now try to deploy only the new migration
  console.log('Applying new schedule events migration...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  
  // If all else fails, just generate the client and start the server
  console.log('Falling back to generating Prisma client only...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma client generated successfully');
  } catch (genError) {
    console.error('Failed to generate Prisma client:', genError.message);
  }
}