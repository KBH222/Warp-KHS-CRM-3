import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('Creating test users with properly hashed passwords...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Password hashed successfully');
    
    // Create or update owner user
    const owner = await prisma.user.upsert({
      where: { email: 'owner@khs.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'owner@khs.com',
        password: hashedPassword,
        name: 'John Owner',
        role: 'OWNER',
        isActive: true,
      },
    });
    console.log('✅ Owner user created/updated:', owner.email);
    
    // Create or update worker user
    const worker = await prisma.user.upsert({
      where: { email: 'worker@khs.com' },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'worker@khs.com',
        password: hashedPassword,
        name: 'Jane Worker',
        role: 'WORKER',
        isActive: true,
      },
    });
    console.log('✅ Worker user created/updated:', worker.email);
    
    console.log('\nTest users ready! You can now login with:');
    console.log('  Owner: owner@khs.com / password123');
    console.log('  Worker: worker@khs.com / password123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();