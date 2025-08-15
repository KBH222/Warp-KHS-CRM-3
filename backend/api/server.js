const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://khs-crm-frontend.vercel.app',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend connected successfully',
    database: 'Connected to Neon PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// For Vercel
module.exports = app;