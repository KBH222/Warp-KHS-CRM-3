import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test users
  const ownerPassword = await bcrypt.hash('password123', 10);
  const workerPassword = await bcrypt.hash('password123', 10);

  // Create owner user
  const owner = await prisma.user.upsert({
    where: { email: 'owner@khs.com' },
    update: {},
    create: {
      email: 'owner@khs.com',
      password: ownerPassword,
      name: 'John Owner',
      role: Role.OWNER,
      isActive: true,
    },
  });

  console.log('Created owner:', owner);

  // Create worker user
  const worker = await prisma.user.upsert({
    where: { email: 'worker@khs.com' },
    update: {},
    create: {
      email: 'worker@khs.com',
      password: workerPassword,
      name: 'Jane Worker',
      role: Role.WORKER,
      isActive: true,
    },
  });

  console.log('Created worker:', worker);

  // Create some test customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 123-4567',
        address: '123 Main St, Springfield, IL 62701',
        notes: 'Prefers morning appointments',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Mike Davis',
        email: 'mike.davis@email.com',
        phone: '(555) 234-5678',
        address: '456 Oak Ave, Springfield, IL 62702',
        notes: 'Has two dogs',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Robert Brown',
        email: 'robert.brown@email.com',
        phone: '(555) 345-6789',
        address: '789 Pine Rd, Springfield, IL 62703',
        notes: 'Commercial property owner',
      },
    }),
  ]);

  console.log('Created customers:', customers.length);

  // Create some test jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Kitchen Remodel',
      description: 'Complete kitchen renovation including cabinets, countertops, and appliances',
      customerId: customers[0].id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-15'),
      estimatedCost: 15000,
      actualCost: 0,
      notes: 'Customer wants modern farmhouse style',
      assignedWorkers: {
        connect: { id: worker.id },
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Bathroom Renovation',
      description: 'Master bathroom update with new tile, fixtures, and vanity',
      customerId: customers[1].id,
      status: 'QUOTED',
      priority: 'MEDIUM',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2025-01-05'),
      estimatedCost: 8500,
      actualCost: 0,
      notes: 'Waiting for customer approval on tile selection',
    },
  });

  console.log('Created jobs:', [job1.title, job2.title]);

  // Add some materials to the first job
  await prisma.material.createMany({
    data: [
      {
        jobId: job1.id,
        name: 'Cabinet handles',
        description: 'Brushed nickel cabinet pulls',
        quantity: 12,
        unit: 'each',
        unitCost: 8.50,
        totalCost: 102,
        status: 'ORDERED',
        supplier: 'Home Depot',
      },
      {
        jobId: job1.id,
        name: 'Wood screws 2.5"',
        description: 'Stainless steel wood screws',
        quantity: 1,
        unit: 'box',
        unitCost: 12.99,
        totalCost: 12.99,
        status: 'IN_STOCK',
        supplier: 'Lowes',
      },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });