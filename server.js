const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

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
app.get('/api/customers', async (req, res) => {
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
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
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

app.put('/api/customers/:id', async (req, res) => {
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

app.delete('/api/customers/:id', async (req, res) => {
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
app.get('/api/jobs', async (req, res) => {
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

app.post('/api/jobs', async (req, res) => {
  try {
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
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
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