const ApplicationState = require('../models/ApplicationState');
const { executeSlaEnforcementScan } = require('../services/mrtpsCronScheduler');

/**
 * Controller for Application State Management & MRTPS SLA Tracking
 * SIH26130 - UdyogSetu
 */

/**
 * @desc    Submit a new application state record
 * @route   POST /api/applications/submit
 * @access  Public / Applicant Portal
 */
exports.submitApplication = async (req, res, next) => {
  try {
    const {
      department,
      companyName,
      industryCategory,
      approvalType,
      submissionDate,
      status
    } = req.body;

    if (!department) {
      return res.status(400).json({ success: false, message: 'Department is required (e.g. Pollution_Control).' });
    }
    if (!companyName) {
      return res.status(400).json({ success: false, message: 'Company name is required.' });
    }

    const appNumber = `APP-MRTPS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const application = await ApplicationState.create({
      applicationNumber: appNumber,
      department: department.trim(),
      companyName: companyName.trim(),
      industryCategory: industryCategory || 'Orange',
      approvalType: approvalType || 'Consent to Establish (CTE)',
      submissionDate: submissionDate ? new Date(submissionDate) : new Date(),
      status: status || 'Under_Scrutiny'
    });

    return res.status(201).json({
      success: true,
      message: 'Application registered under Maharashtra Right to Public Services Act (MRTPS 2015).',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications with status and SLA tracking metrics
 * @route   GET /api/applications
 * @access  Public / Officer Portal
 */
exports.getAllApplications = async (req, res, next) => {
  try {
    const { department, status, category } = req.query;
    const filter = {};

    if (department) filter.department = new RegExp(department, 'i');
    if (status) filter.status = status;
    if (category) filter.industryCategory = category;

    const applications = await ApplicationState.find(filter).sort({ submissionDate: -1 });

    const stats = {
      total: applications.length,
      deemedApproved: applications.filter((a) => a.status === 'Deemed Approved').length,
      underScrutiny: applications.filter((a) => a.status === 'Under_Scrutiny').length,
      approved: applications.filter((a) => a.status === 'Approved').length
    };

    return res.status(200).json({
      success: true,
      count: applications.length,
      stats,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get application details by ID or applicationNumber
 * @route   GET /api/applications/:identifier
 * @access  Public
 */
exports.getApplicationByIdentifier = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let application = null;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      application = await ApplicationState.findById(identifier);
    } else {
      application = await ApplicationState.findOne({ applicationNumber: identifier });
    }

    if (!application) {
      return res.status(404).json({ success: false, message: `Application not found: ${identifier}` });
    }

    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually trigger MRTPS statutory SLA enforcement scan
 * @route   POST /api/applications/trigger-sla-scan
 * @access  Admin / Officer / Cron
 */
exports.triggerSlaScan = async (req, res, next) => {
  try {
    const scanResult = await executeSlaEnforcementScan();
    return res.status(200).json({
      success: true,
      message: `MRTPS SLA Enforcement Scan completed. ${scanResult.breachesTransitionedCount} application(s) transitioned to 'Deemed Approved'.`,
      scanResult
    });
  } catch (error) {
    next(error);
  }
};
