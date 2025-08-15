import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
const router = Router();
const prisma = new PrismaClient();
// Get all jobs
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, customerId, priority } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (customerId)
            where.customerId = customerId;
        if (priority)
            where.priority = priority;
        const jobs = await prisma.job.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, reference: true, name: true, address: true }
                },
                assignments: {
                    include: {
                        user: {
                            select: { id: true, name: true }
                        }
                    }
                },
                materials: {
                    where: { isDeleted: false }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});
// Get single job
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const job = await prisma.job.findUnique({
            where: { id: req.params.id },
            include: {
                customer: true,
                createdBy: {
                    select: { id: true, name: true, email: true }
                },
                assignments: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                },
                materials: {
                    where: { isDeleted: false },
                    include: {
                        addedBy: {
                            select: { id: true, name: true }
                        },
                        purchasedBy: {
                            select: { id: true, name: true }
                        }
                    }
                },
                statusHistory: {
                    orderBy: { changedAt: 'desc' },
                    take: 10
                },
                photos: {
                    orderBy: { createdAt: 'desc' }
                },
                invoices: true
            }
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
});
// Create job
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, customerId, status = 'QUOTED', priority = 'medium', totalCost = 0, depositPaid = 0, startDate, endDate, notes } = req.body;
        const job = await prisma.job.create({
            data: {
                title,
                description,
                customerId,
                status,
                priority,
                totalCost,
                depositPaid,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                notes,
                createdById: req.user.id
            },
            include: {
                customer: true
            }
        });
        // Create status history entry
        await prisma.jobStatusHistory.create({
            data: {
                jobId: job.id,
                toStatus: status,
                changedBy: req.user.id
            }
        });
        res.status(201).json(job);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create job' });
    }
});
// Update job
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { title, description, status, priority, totalCost, depositPaid, actualCost, startDate, endDate, completedDate, notes } = req.body;
        // Get current job to track status changes
        const currentJob = await prisma.job.findUnique({
            where: { id: req.params.id }
        });
        if (!currentJob) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const job = await prisma.job.update({
            where: { id: req.params.id },
            data: {
                title,
                description,
                status,
                priority,
                totalCost,
                depositPaid,
                actualCost,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                completedDate: completedDate ? new Date(completedDate) : null,
                notes
            },
            include: {
                customer: true
            }
        });
        // Track status change
        if (status && status !== currentJob.status) {
            await prisma.jobStatusHistory.create({
                data: {
                    jobId: job.id,
                    fromStatus: currentJob.status,
                    toStatus: status,
                    changedBy: req.user.id
                }
            });
        }
        res.json(job);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update job' });
    }
});
// Delete job
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await prisma.job.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Job not found' });
        }
        else {
            res.status(500).json({ error: 'Failed to delete job' });
        }
    }
});
// Assign worker to job
router.post('/:id/assign', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        const assignment = await prisma.jobAssignment.create({
            data: {
                jobId: req.params.id,
                userId
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.status(201).json(assignment);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Worker already assigned to this job' });
        }
        else {
            res.status(500).json({ error: 'Failed to assign worker' });
        }
    }
});
// Remove worker from job
router.delete('/:id/assign/:userId', authenticateToken, async (req, res) => {
    try {
        await prisma.jobAssignment.delete({
            where: {
                jobId_userId: {
                    jobId: req.params.id,
                    userId: req.params.userId
                }
            }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to remove assignment' });
    }
});
// Sync jobs (for offline support)
router.post('/sync', authenticateToken, async (req, res) => {
    try {
        const { jobs } = req.body;
        const results = [];
        for (const job of jobs) {
            try {
                if (job.id && !job.id.startsWith('temp_')) {
                    // Update existing job
                    const updated = await prisma.job.update({
                        where: { id: job.id },
                        data: {
                            title: job.title,
                            description: job.description,
                            status: job.status,
                            priority: job.priority,
                            totalCost: job.totalCost,
                            depositPaid: job.depositPaid,
                            actualCost: job.actualCost,
                            startDate: job.startDate ? new Date(job.startDate) : null,
                            endDate: job.endDate ? new Date(job.endDate) : null,
                            completedDate: job.completedDate ? new Date(job.completedDate) : null,
                            notes: job.notes
                        }
                    });
                    results.push({ id: job.id, status: 'updated', data: updated });
                }
                else {
                    // Create new job
                    const created = await prisma.job.create({
                        data: {
                            title: job.title,
                            description: job.description,
                            customerId: job.customerId,
                            status: job.status || 'QUOTED',
                            priority: job.priority || 'medium',
                            totalCost: job.totalCost || 0,
                            depositPaid: job.depositPaid || 0,
                            actualCost: job.actualCost || 0,
                            startDate: job.startDate ? new Date(job.startDate) : null,
                            endDate: job.endDate ? new Date(job.endDate) : null,
                            completedDate: job.completedDate ? new Date(job.completedDate) : null,
                            notes: job.notes,
                            createdById: req.user.id
                        }
                    });
                    results.push({
                        id: job.id || job.localId,
                        status: 'created',
                        data: created
                    });
                }
            }
            catch (error) {
                results.push({
                    id: job.id || job.localId,
                    status: 'error',
                    error: error.message
                });
            }
        }
        res.json({ results });
    }
    catch (error) {
        res.status(500).json({ error: 'Sync failed' });
    }
});
export default router;
