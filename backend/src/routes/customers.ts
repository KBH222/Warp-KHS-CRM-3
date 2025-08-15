import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isArchived: false },
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
            status: true,
            totalCost: true,
            startDate: true,
            endDate: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        jobs: {
          include: {
            materials: true,
            assignments: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reference, name, phone, email, address, notes } = req.body;

    // Generate reference if not provided
    let customerReference = reference;
    if (!customerReference) {
      const count = await prisma.customer.count();
      const letter = String.fromCharCode(65 + Math.floor(count / 100)); // A, B, C...
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
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Customer reference already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create customer' });
    }
  }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name,
        phone,
        email,
        address,
        notes
      }
    });

    res.json(customer);
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Customer not found' });
    } else {
      res.status(500).json({ error: 'Failed to update customer' });
    }
  }
});

// Archive customer (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.customer.update({
      where: { id: req.params.id },
      data: { isArchived: true }
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Customer not found' });
    } else {
      res.status(500).json({ error: 'Failed to archive customer' });
    }
  }
});

// Sync customers (for offline support)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { customers } = req.body;
    const results = [];

    for (const customer of customers) {
      try {
        if (customer.id) {
          // Update existing customer
          const updated = await prisma.customer.update({
            where: { id: customer.id },
            data: {
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              notes: customer.notes
            }
          });
          results.push({ id: customer.id, status: 'updated', data: updated });
        } else {
          // Create new customer
          const created = await prisma.customer.create({
            data: {
              reference: customer.reference,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              notes: customer.notes
            }
          });
          results.push({ 
            id: customer.localId || customer.reference, 
            status: 'created', 
            data: created 
          });
        }
      } catch (error) {
        results.push({ 
          id: customer.id || customer.localId || customer.reference, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;