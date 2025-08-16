import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Customer ID is required' });
  }
  
  try {
    if (req.method === 'GET') {
      // Get single customer
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          jobs: true
        }
      });
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      return res.status(200).json(customer);
      
    } else if (req.method === 'PUT') {
      // Update customer
      const { name, phone, email, address, notes } = req.body;
      
      const customer = await prisma.customer.update({
        where: { id },
        data: { name, phone, email, address, notes }
      });
      
      return res.status(200).json(customer);
      
    } else if (req.method === 'DELETE') {
      // Soft delete (archive) customer
      await prisma.customer.update({
        where: { id },
        data: { isArchived: true }
      });
      
      return res.status(204).end();
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customer API error:', error);
    return res.status(500).json({ error: 'Operation failed' });
  }
}