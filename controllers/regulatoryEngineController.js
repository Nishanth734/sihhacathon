const topologicalEngine = require('../services/topologicalEngineService');

/**
 * Controller for Topological Regulatory Dependency Engine
 * SIH26130 - UdyogSetu
 */

/**
 * @desc    Generate Topological Dependency Graph (DAG) for an industry category
 * @route   GET /api/regulatory/dependency-graph
 * @route   POST /api/regulatory/dependency-graph
 * @access  Public / Enterprise Portal
 */
exports.getRegulatoryDependencyGraph = async (req, res, next) => {
  try {
    // Read category from query, body, or params safely with optional chaining
    const category =
      req.query?.category ||
      req.params?.category ||
      req.body?.industryCategory ||
      req.body?.category ||
      'Green';

    const normalizedCategory = String(category).trim();
    const valid = ['Green', 'Orange', 'Red'].some(
      (c) => c.toLowerCase() === normalizedCategory.toLowerCase()
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: `Invalid industry category: '${category}'. Must be one of: Red, Orange, Green.`,
        validCategories: ['Green', 'Orange', 'Red']
      });
    }

    const dag = topologicalEngine.getRegulatoryDAG(normalizedCategory);

    return res.status(200).json({
      success: true,
      message: `Topological Regulatory Dependency Graph generated successfully for ${dag.category} category.`,
      data: dag
    });
  } catch (error) {
    console.error('[Regulatory Engine Error]:', error);
    next(error);
  }
};

/**
 * @desc    Get metadata & regulatory summary for all categories
 * @route   GET /api/regulatory/categories
 * @access  Public
 */
exports.getCategoriesMetadata = async (req, res, next) => {
  try {
    const categories = ['Green', 'Orange', 'Red'].map((cat) => {
      const dag = topologicalEngine.getRegulatoryDAG(cat);
      return {
        category: dag.category,
        description: dag.description,
        mahaParwanaEligible: dag.mahaParwanaEligible,
        statutorySlaHours: dag.statutorySlaHours,
        totalApprovals: dag.metrics.totalApprovals,
        criticalPathDays: dag.metrics.criticalPathDays,
        parallelStreams: dag.metrics.parallelStreams
      };
    });

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
