const express = require('express');
const router = express.Router();
const {
  generateComplianceProofSheet,
  getGoverningRule
} = require('../controllers/complianceProofController');

/**
 * Deterministic GraphRAG Compliance Validator Routes
 */

// Generate Compliance Proof Sheet from extracted data
router.post('/validate-proof-sheet', generateComplianceProofSheet);
router.post('/validate-compliance', generateComplianceProofSheet);

// Lookup governing rule by entity name
router.get('/rule/:entityName', getGoverningRule);

module.exports = router;
