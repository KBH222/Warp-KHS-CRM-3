const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testSchema() {
  console.log('Testing database schema...');
  
  try {
    // Test if photos and plans fields exist
    const job = await prisma.job.findFirst({
      select: {
        id: true,
        title: true,
        photos: true,
        plans: true
      }
    });
    
    console.log('✅ Database schema includes photos and plans fields');
    console.log('Sample job:', job);
    
    // Try to create a test job with photos
    const testJob = await prisma.job.create({
      data: {
        title: 'Test Job with Photos',
        description: 'Testing photo storage',
        customerId: 'test-customer-id', // This will fail but we just want to test the schema
        status: 'QUOTED',
        priority: 'medium',
        totalCost: 0,
        depositPaid: 0,
        photos: JSON.stringify([{ id: 1, name: 'test.jpg', url: 'data:image/jpeg;base64,test' }]),
        plans: JSON.stringify([])
      }
    }).catch(err => {
      console.log('Expected error (no customer):', err.message);
      return null;
    });
    
    console.log('Schema test complete');
    
  } catch (error) {
    console.error('❌ Database schema error:', error.message);
    console.log('\nThe database schema might be missing the photos/plans fields.');
    console.log('Run this command to migrate the database:');
    console.log('npx prisma migrate deploy');
  } finally {
    await prisma.$disconnect();
  }
}

testSchema();