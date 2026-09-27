const express = require('express');
const router = express.Router();
const {
  getRegulatoryDependencyGraph,
  getCategoriesMetadata
} = require('../controllers/regulatoryEngineController');

/**
 * Topological Regulatory Dependency Engine Routes
 */

// Generate DAG via GET (e.g., /dependency-graph?category=Green)
router.get('/dependency-graph', getRegulatoryDependencyGraph);

// Generate DAG via POST (e.g., body: { industryCategory: 'Orange' })
router.post('/dependency-graph', getRegulatoryDependencyGraph);

// Category specific endpoint (e.g., /dependency-graph/Red)
router.get('/dependency-graph/:category', getRegulatoryDependencyGraph);

// Categories overview metadata
router.get('/categories', getCategoriesMetadata);

module.exports = router;
