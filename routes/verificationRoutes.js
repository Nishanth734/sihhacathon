const express = require('express');
const router = express.Router();
const {
  verifyAndOnboardEntity,
  getAllBusinessProfiles,
  getBusinessProfileById,
  getProfileByIdentifier
} = require('../controllers/apiSetuController');

/**
 * Verification & Onboarding Gateway Routes
 */

// Route to initiate Zero-Entry verification and save to MongoDB
router.post('/verify-entity', verifyAndOnboardEntity);

// Alias routes for verification
router.post('/verify', verifyAndOnboardEntity);
router.post('/verify-business', verifyAndOnboardEntity);

// Query all verified profiles
router.get('/profiles', getAllBusinessProfiles);

// Fetch profile by ID
router.get('/profiles/:id', getBusinessProfileById);

// Fetch profile by PAN or GST
router.get('/status/:identifier', getProfileByIdentifier);

module.exports = router;
