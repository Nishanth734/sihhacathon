require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Import routes
const verificationRoutes = require('./routes/verificationRoutes');
const regulatoryRoutes = require('./routes/regulatoryRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

// Import MRTPS cron scheduler
const { initializeMrtpsCronScheduler } = require('./services/mrtpsCronScheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health & Info Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'UdyogSetu Backend Service',
    description: 'Smart Regulatory Planning & Cognitive Compliance Gateway for Maharashtra Industrial Approvals',
    version: '1.0.0',
    status: 'Operational',
    endpoints: {
      health: 'GET /health',
      zeroEntryVerification: 'POST /api/verify-business',
      allProfiles: 'GET /api/verification/profiles',
      profileById: 'GET /api/verification/profiles/:id',
      profileByIdentifier: 'GET /api/verification/status/:identifier',
      regulatoryDAG: 'GET /api/regulatory/dependency-graph?category={Red|Orange|Green}',
      regulatoryCategories: 'GET /api/regulatory/categories',
      complianceProofSheet: 'POST /api/validate-compliance',
      complianceRuleLookup: 'GET /api/compliance/rule/:entityName',
      submitApplication: 'POST /api/applications/submit',
      allApplications: 'GET /api/applications',
      triggerMrtpsScan: 'POST /api/applications/trigger-sla-scan'
    }
  });
});

app.get('/health', (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStateMap[mongoose.connection.readyState] || 'Unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    timestamp: new Date().toISOString()
  });
});

// Top-level aliases for direct compliance and verification endpoints
const { verifyAndOnboardEntity } = require('./controllers/apiSetuController');
const { generateComplianceProofSheet } = require('./controllers/complianceProofController');

app.post('/api/verify-business', verifyAndOnboardEntity);
app.post('/api/validate-compliance', generateComplianceProofSheet);

// Mount Feature Routes
app.use('/api/verification', verificationRoutes);
app.use('/api/regulatory', regulatoryRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/applications', applicationRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[UdyogSetu Global Error Handler]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server if executed directly (e.g. node server.js)
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log('================================================================');
    console.log(`🚀 UdyogSetu Backend Server running on port ${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    console.log(`🛡️  Zero-Entry Gateway: http://localhost:${PORT}/api/verification/verify-entity`);
    console.log(`⏱️  MRTPS Enforcer: http://localhost:${PORT}/api/applications`);
    console.log('================================================================');

    // Arm daily MRTPS SLA Enforcement Cron Job
    initializeMrtpsCronScheduler('0 0 * * *');
  });
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n[UdyogSetu] Gracefully shutting down...');
  if (server) server.close();
  await mongoose.connection.close();
  console.log('[UdyogSetu] MongoDB connection closed. Exiting process.');
  process.exit(0);
});

module.exports = { app, server };
