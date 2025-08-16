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
      // Get all jobs
      const jobs = await prisma.job.findMany({
        include: {
          customer: {
            select: { id: true, reference: true, name: true, address: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(jobs);
      
    } else if (req.method === 'POST') {
      // Create job
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
      return res.status(201).json(job);
      
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Job API error:', error);
    return res.status(500).json({ error: 'Operation failed' });
  }
}