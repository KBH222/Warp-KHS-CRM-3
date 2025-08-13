import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/customers
router.get('/', async (req, res) => {
  res.json({ message: 'Customer routes not yet implemented' });
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  res.json({ message: 'Get customer by ID not yet implemented' });
});

// POST /api/customers
router.post('/', async (req, res) => {
  res.json({ message: 'Create customer not yet implemented' });
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  res.json({ message: 'Update customer not yet implemented' });
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  res.json({ message: 'Delete customer not yet implemented' });
});

export { router as customerRouter };