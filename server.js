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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

// Check database schema
app.get('/api/check-schema', async (req, res) => {
  try {
    // Try to query a job with photos field
    const testQuery = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Job' 
      AND column_name IN ('photos', 'plans')
    `;
    
    res.json({
      status: 'ok',
      schema: testQuery,
      message: testQuery.length > 0 ? 'Photos/plans columns exist' : 'Photos/plans columns missing - migration needed'
    });
  } catch (error) {
    res.json({
      status: 'error',
      error: error.message,
      message: 'Failed to check schema - migration may be needed'
    });
  }
});

// Test photo size limits
app.post('/api/test-photo-size-limit', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId required' });
    }
    
    const results = [];
    const sizes = [1, 10, 50, 100, 500, 1000, 5000]; // KB sizes to test
    
    for (const sizeKB of sizes) {
      try {
        // Create a test photo with specific size
        const sizeBytes = sizeKB * 1024;
        const base64Size = Math.floor(sizeBytes * 0.75); // Account for base64 encoding
        const testData = 'A'.repeat(base64Size);
        const testPhoto = {
          id: Date.now(),
          name: `test-${sizeKB}KB.jpg`,
          url: `data:image/jpeg;base64,${testData}`
        };
        
        // Create job with test photo
        const job = await prisma.job.create({
          data: {
            title: `Photo Size Test ${sizeKB}KB`,
            customerId: customerId,
            status: 'QUOTED',
            priority: 'low',
            photos: JSON.stringify([testPhoto])
          }
        });
        
        // Verify it was saved
        const verification = await prisma.job.findUnique({
          where: { id: job.id }
        });
        
        const saved = verification?.photos?.length === job.photos.length;
        
        results.push({
          sizeKB,
          jobId: job.id,
          savedSuccessfully: saved,
          originalLength: job.photos.length,
          verifiedLength: verification?.photos?.length,
          truncated: !saved
        });
        
        // Clean up test job
        await prisma.job.delete({ where: { id: job.id } });
        
      } catch (error) {
        results.push({
          sizeKB,
          savedSuccessfully: false,
          error: error.message
        });
      }
    }
    
    res.json({
      status: 'ok',
      results,
      maxSuccessfulSize: results.filter(r => r.savedSuccessfully).pop()?.sizeKB || 0
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test photo save and retrieve
app.get('/api/test-photo-save/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // First, let's see what's currently in the database
    const currentJob = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    console.log('Current job photos:', currentJob?.photos);
    
    // Try to update a job with test photo data
    const testPhotos = [{
      id: Date.now(),
      name: 'test-photo.jpg',
      url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k='
    }];
    
    console.log('Updating with test photos:', testPhotos);
    
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        photos: JSON.stringify(testPhotos)
      }
    });
    
    console.log('Updated job photos field:', updatedJob.photos);
    
    // Read it back
    const readJob = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    console.log('Read back job photos:', readJob?.photos);
    
    res.json({
      status: 'ok',
      message: 'Test photo save successful',
      currentPhotos: currentJob?.photos,
      savedPhotos: readJob.photos,
      parsedPhotos: readJob.photos ? JSON.parse(readJob.photos) : null,
      photosLength: readJob.photos ? readJob.photos.length : 0
    });
  } catch (error) {
    console.error('Test photo save error:', error);
    res.json({
      status: 'error',
      error: error.message,
      stack: error.stack,
      message: 'Failed to save test photo'
    });
  }
});

// Check maximum field size in database
app.get('/api/debug/field-limits', async (req, res) => {
  try {
    // For PostgreSQL, check the maximum size of text fields
    const result = await prisma.$queryRaw`
      SELECT 
        table_name,
        column_name,
        data_type,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'Job' 
      AND column_name IN ('photos', 'plans', 'notes', 'description')
    `;
    
    // Test with a large string
    const testSize = 1024 * 1024; // 1MB
    const testString = 'x'.repeat(testSize);
    
    res.json({
      status: 'ok',
      database: 'PostgreSQL',
      textFieldInfo: result,
      testStringSize: testSize,
      postgresTextLimit: 'PostgreSQL TEXT type can store up to 1GB',
      recommendation: 'Photos should be stored without issue unless hitting 1GB limit'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      note: 'Could not determine field limits'
    });
  }
});

// Debug endpoint to check job data
app.get('/api/debug/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    // If job not found, try to find all jobs to help debug
    let allJobs = [];
    if (!job) {
      allJobs = await prisma.job.findMany({
        select: { id: true, title: true }
      });
    }
    
    res.json({
      requestedJobId: jobId,
      job: job,
      jobFound: !!job,
      photosField: job?.photos,
      photosLength: job?.photos ? job.photos.length : 0,
      parsedPhotos: job?.photos ? JSON.parse(job.photos) : null,
      allJobIds: !job ? allJobs : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug Express configuration
app.get('/api/debug/express-config', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      expressConfig: {
        jsonLimit: '50mb',
        urlEncodedLimit: '50mb',
        middlewareStack: app._router.stack
          .filter(layer => layer.name)
          .map(layer => ({
            name: layer.name,
            regexp: layer.regexp?.toString()
          }))
      },
      requestLimits: {
        maxJsonSize: '50mb',
        maxUrlEncodedSize: '50mb',
        recommendation: 'Current limits should handle photos up to 50MB'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to list all jobs
app.get('/api/debug/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      select: {
        id: true,
        title: true,
        customerId: true,
        photos: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      totalJobs: jobs.length,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        customerId: job.customerId,
        hasPhotos: !!job.photos && job.photos !== '[]',
        photosLength: job.photos ? job.photos.length : 0,
        createdAt: job.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
            description: true,
            priority: true,
            startDate: true,
            endDate: true,
            completedDate: true,
            notes: true,
            photos: true,
            plans: true,
            customerId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${customers.length} customers`);
    
    // Parse photos and plans for each job
    const customersWithParsedJobs = customers.map(customer => {
      const parsedCustomer = { ...customer };
      if (customer.jobs) {
        parsedCustomer.jobs = customer.jobs.map(job => {
          const parsedJob = { ...job };
          
          // Parse photos
          if (job.photos) {
            try {
              parsedJob.photos = JSON.parse(job.photos);
            } catch (e) {
              console.error('Failed to parse photos for job:', job.id, e);
              parsedJob.photos = [];
            }
          } else {
            parsedJob.photos = [];
          }
          
          // Parse plans
          if (job.plans) {
            try {
              parsedJob.plans = JSON.parse(job.plans);
            } catch (e) {
              console.error('Failed to parse plans for job:', job.id, e);
              parsedJob.plans = [];
            }
          } else {
            parsedJob.plans = [];
          }
          
          return parsedJob;
        });
      }
      return parsedCustomer;
    });
    
    res.json(customersWithParsedJobs);
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
    
    // Parse photos and plans from JSON strings to arrays
    const jobsWithParsedData = jobs.map(job => {
      const parsed = { ...job };
      if (job.photos) {
        try {
          parsed.photos = JSON.parse(job.photos);
        } catch (e) {
          parsed.photos = [];
        }
      }
      if (job.plans) {
        try {
          parsed.plans = JSON.parse(job.plans);
        } catch (e) {
          parsed.plans = [];
        }
      }
      return parsed;
    });
    
    res.json(jobsWithParsedData);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', authMiddleware, async (req, res) => {
  try {
    console.log('Creating job with data:', req.body);
    const jobData = {
      title: req.body.title,
      description: req.body.description,
      customerId: req.body.customerId,
      status: req.body.status || 'QUOTED',
      priority: req.body.priority || 'medium',
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      completedDate: req.body.completedDate ? new Date(req.body.completedDate) : null,
      notes: req.body.notes
    };
    
    // Handle photos and plans - stringify arrays for storage
    if (req.body.photos && Array.isArray(req.body.photos)) {
      jobData.photos = JSON.stringify(req.body.photos);
      console.log('=== PHOTO CREATION DEBUG ===');
      console.log('Creating job with photos count:', req.body.photos.length);
      console.log('Photos array size in bytes:', JSON.stringify(req.body.photos).length);
      console.log('Photos stringified length:', jobData.photos.length);
      console.log('First photo sample:', req.body.photos[0] ? {
        id: req.body.photos[0].id,
        name: req.body.photos[0].name,
        urlLength: req.body.photos[0].url ? req.body.photos[0].url.length : 0,
        urlFirst100: req.body.photos[0].url ? req.body.photos[0].url.substring(0, 100) : null
      } : 'No photos');
    }
    if (req.body.plans && Array.isArray(req.body.plans)) {
      jobData.plans = JSON.stringify(req.body.plans);
    }
    
    console.log('Job data before create (without photos for brevity):', {
      ...jobData,
      photos: jobData.photos ? `[${jobData.photos.length} chars]` : undefined
    });
    
    const job = await prisma.job.create({
      data: jobData,
      include: {
        customer: true
      }
    });
    
    console.log('Raw job from DB after create:', job);
    console.log('Photos field from DB:', job.photos);
    
    // Parse back to arrays for response
    if (job.photos) {
      try {
        job.photos = JSON.parse(job.photos);
        console.log('Parsed photos after create:', job.photos);
      } catch (e) {
        console.error('Failed to parse photos:', e);
        job.photos = [];
      }
    } else {
      job.photos = [];
    }
    
    if (job.plans) {
      try {
        job.plans = JSON.parse(job.plans);
      } catch (e) {
        console.error('Failed to parse plans:', e);
        job.plans = [];
      }
    } else {
      job.plans = [];
    }
    
    console.log('Job created successfully:', job.id);
    console.log('Created job photos field length:', job.photos ? job.photos.length : 0);
    
    // Immediately verify what was saved in database
    const verification = await prisma.job.findUnique({
      where: { id: job.id }
    });
    
    console.log('=== VERIFICATION AFTER CREATE ===');
    console.log('Verification - job found:', !!verification);
    console.log('Verification - photos field exists:', 'photos' in verification);
    console.log('Verification - photos field length:', verification?.photos?.length);
    console.log('Verification - photos field first 100 chars:', verification?.photos?.substring(0, 100));
    console.log('Verification - photos field last 100 chars:', verification?.photos ? verification.photos.substring(verification.photos.length - 100) : null);
    
    // Check if photos were truncated
    if (jobData.photos && verification?.photos && jobData.photos.length !== verification.photos.length) {
      console.error('WARNING: Photos field was truncated!');
      console.error('Expected length:', jobData.photos.length);
      console.error('Actual length:', verification.photos.length);
    }
    
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
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      customerId: req.body.customerId,
      status: req.body.status,
      priority: req.body.priority,
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      completedDate: req.body.completedDate ? new Date(req.body.completedDate) : null,
      notes: req.body.notes
    };
    
    // Handle photos and plans - stringify arrays for storage
    if (req.body.photos !== undefined) {
      updateData.photos = Array.isArray(req.body.photos) ? JSON.stringify(req.body.photos) : null;
      console.log('=== PHOTO UPDATE DEBUG ===');
      console.log('Updating job:', req.params.id);
      console.log('Photos to save count:', Array.isArray(req.body.photos) ? req.body.photos.length : 'not array');
      console.log('Photos array size in bytes:', Array.isArray(req.body.photos) ? JSON.stringify(req.body.photos).length : 0);
      console.log('Photos stringified length:', updateData.photos ? updateData.photos.length : 0);
      if (Array.isArray(req.body.photos) && req.body.photos[0]) {
        console.log('First photo sample:', {
          id: req.body.photos[0].id,
          name: req.body.photos[0].name,
          urlLength: req.body.photos[0].url ? req.body.photos[0].url.length : 0,
          urlFirst100: req.body.photos[0].url ? req.body.photos[0].url.substring(0, 100) : null
        });
      }
    }
    if (req.body.plans !== undefined) {
      updateData.plans = Array.isArray(req.body.plans) ? JSON.stringify(req.body.plans) : null;
    }
    
    console.log('Update data before save (without photos for brevity):', {
      ...updateData,
      photos: updateData.photos ? `[${updateData.photos.length} chars]` : undefined
    });
    
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        customer: true
      }
    });
    
    console.log('Raw job from DB:', job);
    console.log('Photos field from DB:', job.photos);
    
    // Parse back to arrays for response
    if (job.photos) {
      try {
        job.photos = JSON.parse(job.photos);
        console.log('Parsed photos:', job.photos);
      } catch (e) {
        console.error('Failed to parse photos:', e);
        job.photos = [];
      }
    } else {
      job.photos = [];
    }
    
    if (job.plans) {
      try {
        job.plans = JSON.parse(job.plans);
      } catch (e) {
        console.error('Failed to parse plans:', e);
        job.plans = [];
      }
    } else {
      job.plans = [];
    }
    
    console.log('Job updated successfully:', job.id);
    console.log('Updated job photos field length:', job.photos ? job.photos.length : 0);
    
    // Immediately verify what was saved in database
    const verification = await prisma.job.findUnique({
      where: { id: req.params.id }
    });
    
    console.log('=== VERIFICATION AFTER UPDATE ===');
    console.log('Verification - job found:', !!verification);
    console.log('Verification - photos field exists:', 'photos' in verification);
    console.log('Verification - photos field length:', verification?.photos?.length);
    console.log('Verification - photos field first 100 chars:', verification?.photos?.substring(0, 100));
    console.log('Verification - photos field last 100 chars:', verification?.photos ? verification.photos.substring(verification.photos.length - 100) : null);
    
    // Check if photos were truncated
    if (updateData.photos && verification?.photos && updateData.photos.length !== verification.photos.length) {
      console.error('WARNING: Photos field was truncated!');
      console.error('Expected length:', updateData.photos.length);
      console.error('Actual length:', verification.photos.length);
    }
    
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