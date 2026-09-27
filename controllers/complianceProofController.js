const graphRagValidator = require('../services/graphRagValidatorService');

/**
 * Controller for Deterministic GraphRAG Compliance Validator
 * SIH26130 - UdyogSetu
 */

/**
 * @desc    Validate extracted multi-modal data against Neo4j Knowledge Graph & issue Compliance Proof Sheet
 * @route   POST /api/compliance/validate-proof-sheet
 * @access  Public / Enterprise Portal
 */
exports.generateComplianceProofSheet = async (req, res, next) => {
  try {
    const {
      cadSetbackMeters,
      industryCategory,
      waterRequirementKld,
      hazardousWasteMt,
      companyName,
      pan,
      gst
    } = req.body;

    const proofSheet = await graphRagValidator.validateComplianceProofSheet({
      cadSetbackMeters: cadSetbackMeters !== undefined ? Number(cadSetbackMeters) : undefined,
      industryCategory,
      waterRequirementKld: waterRequirementKld !== undefined ? Number(waterRequirementKld) : undefined,
      hazardousWasteMt,
      companyName,
      pan,
      gst
    });

    const isCompliant = proofSheet.complianceProofSheet.executiveSummary.isCompliant;

    return res.status(200).json({
      success: true,
      verdict: proofSheet.complianceProofSheet.executiveSummary.overallVerdict,
      isCompliant,
      data: proofSheet
    });
  } catch (error) {
    console.error('[Compliance Validator Error]:', error);
    next(error);
  }
};

/**
 * @desc    Direct Cypher Query execution for specific regulatory entity rule
 * @route   GET /api/compliance/rule/:entityName
 * @access  Public
 */
exports.getGoverningRule = async (req, res, next) => {
  try {
    const { entityName } = req.params;
    const ruleInfo = await graphRagValidator.queryGoverningRule(entityName);

    if (!ruleInfo) {
      return res.status(404).json({
        success: false,
        message: `No governing statute found in Knowledge Graph for entity: '${entityName}'`
      });
    }

    return res.status(200).json({
      success: true,
      data: ruleInfo
    });
  } catch (error) {
    next(error);
  }
};
