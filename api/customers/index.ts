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
  
  try {
    if (req.method === 'GET') {
      // Get all customers
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
      return res.status(200).json(customers);
      
    } else if (req.method === 'POST') {
      // Create customer
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

      return res.status(201).json(customer);
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Customer API error:', error);
    return res.status(500).json({ error: 'Operation failed' });
  }
}