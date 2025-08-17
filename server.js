const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Debug environment variables
console.log('Environment check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Simple auth middleware - accepts any token for now
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No auth token provided');
    // For now, allow requests without auth to make testing easier
    // In production, you would return 401 here
    // return res.status(401).json({ error: 'No authorization token provided' });
  } else {
    console.log('Auth token received:', authHeader.substring(0, 20) + '...');
  }
  
  // For now, accept any token
  next();
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'KHS CRM API on Railway'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@khscrm.com' && password === 'admin123') {
    res.json({
      token: 'railway-token-' + Date.now(),
      refreshToken: 'railway-refresh-' + Date.now(),
      user: {
        id: 'admin-id',
        email: 'admin@khscrm.com',
        name: 'Admin User',
        role: 'OWNER'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Customer routes
app.get('/api/customers', authMiddleware, async (req, res) => {
  console.log('GET /api/customers - Request received');
  try {
    const customers = await prisma.customer.findMany({
      where: { isArchived: false },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
            totalCost: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Check if it's a Prisma/DB error
    if (error.code === 'P2021') {
      console.error('Table does not exist - migrations may need to run');
      res.status(500).json({ error: 'Database table not found. Migrations may need to run.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch customers: ' + error.message });
    }
  }
});

app.post('/api/customers', authMiddleware, async (req, res) => {
  try {
    const { reference, name, phone, email, address, notes } = req.body;
    
    let customerReference = reference;
    if (!customerReference) {
      const count = await prisma.customer.count();
      const letter = String.fromCharCode(65 + Math.floor(count / 100));
      const number = (count % 100) + 1;
      customerReference = `${letter}${number}`;
    }

    const customer = await prisma.customer.create({
      data: {
        reference: customerReference,
        name,
        phone,
        email,
        address,
        notes
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, phone, email, address, notes }
    });
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.customer.update({
      where: { id: req.params.id },
      data: { isArchived: true }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Job routes
app.get('/api/jobs', authMiddleware, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        customer: {
          select: { id: true, reference: true, name: true, address: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', authMiddleware, async (req, res) => {
  try {
    console.log('Creating job with data:', req.body);
    const job = await prisma.job.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        customerId: req.body.customerId,
        status: req.body.status || 'QUOTED',
        priority: req.body.priority || 'medium',
        totalCost: req.body.totalCost || 0,
        depositPaid: req.body.depositPaid || 0,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        notes: req.body.notes
      },
      include: {
        customer: true
      }
    });
    console.log('Job created successfully:', job.id);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
});

// Update job
app.put('/api/jobs/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Updating job:', req.params.id, 'with data:', req.body);
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        description: req.body.description,
        customerId: req.body.customerId,
        status: req.body.status,
        priority: req.body.priority,
        totalCost: req.body.totalCost,
        depositPaid: req.body.depositPaid,
        actualCost: req.body.actualCost,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        completedDate: req.body.completedDate ? new Date(req.body.completedDate) : null,
        notes: req.body.notes
      },
      include: {
        customer: true
      }
    });
    console.log('Job updated successfully:', job.id);
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    console.error('Request params:', req.params);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Failed to update job', details: error.message });
  }
});

// Delete job
app.delete('/api/jobs/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Deleting job:', req.params.id);
    await prisma.job.delete({
      where: { id: req.params.id }
    });
    console.log('Job deleted successfully:', req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job', details: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`KHS CRM running on Railway port ${PORT}`);
});