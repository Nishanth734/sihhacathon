const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getAllApplications,
  getApplicationByIdentifier,
  triggerSlaScan
} = require('../controllers/applicationStateController');

/**
 * MRTPS Application State Routes
 */

// Submit application
router.post('/submit', submitApplication);

// Query all applications
router.get('/', getAllApplications);

// Trigger on-demand SLA scan
router.post('/trigger-sla-scan', triggerSlaScan);

// Fetch application by ID or applicationNumber
router.get('/:identifier', getApplicationByIdentifier);

module.exports = router;
