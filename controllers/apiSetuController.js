const BusinessProfile = require('../models/BusinessProfile');
const apiSetuService = require('../services/apiSetuService');

/**
 * Controller for Zero-Entry Verification Gateway
 * Connects to API Setu Sandbox to fetch mock GST & DigiLocker incorporation details
 * and persists verified profiles in MongoDB.
 */

/**
 * @desc    Simulate Zero-Entry Verification Gateway & onboard business profile
 * @route   POST /api/verification/verify-entity
 * @access  Public / Business Portal
 */
exports.verifyAndOnboardEntity = async (req, res, next) => {
  try {
    const { pan, gst, industryCategory, investmentSize, companyName } = req.body;

    // 1. Validation checks
    const errors = [];
    if (!pan) errors.push('PAN is required');
    if (!gst) errors.push('GSTIN is required');
    if (!industryCategory) errors.push('Industry Category is required (White, Green, Orange, Red)');
    if (investmentSize === undefined || investmentSize === null || isNaN(investmentSize) || Number(investmentSize) < 0) {
      errors.push('Investment size must be a non-negative number in INR Crores');
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (pan && !panRegex.test(pan.toUpperCase().trim())) {
      errors.push('Invalid PAN format. Standard format: 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)');
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gst && !gstRegex.test(gst.toUpperCase().trim())) {
      errors.push('Invalid GSTIN format. Standard format: 15 alphanumeric characters (e.g. 27ABCDE1234F1Z5)');
    }

    const validCategories = ['White', 'Green', 'Orange', 'Red'];
    if (industryCategory && !validCategories.includes(industryCategory)) {
      errors.push(`Industry Category must be one of: ${validCategories.join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const formattedPan = pan.toUpperCase().trim();
    const formattedGst = gst.toUpperCase().trim();
    const numericInvestment = Number(investmentSize);

    console.log(`[Zero-Entry Gateway] Initiating API Setu verification for PAN: ${formattedPan}, GST: ${formattedGst}...`);

    // 2. Fetch data concurrently from API Setu Sandbox
    const [digilockerResult, gstResult] = await Promise.all([
      apiSetuService.fetchDigiLockerIncorporation(formattedPan, companyName),
      apiSetuService.fetchGSTDetails(formattedGst, companyName)
    ]);

    const dlCert = digilockerResult.data.certificate || {};
    const gstInfo = gstResult.data.gstData || {};

    // 3. Zero-Entry resolution: Company name resolves automatically from verified records if not provided
    const resolvedCompanyName =
      companyName?.trim() ||
      gstInfo.legalName ||
      dlCert.companyName ||
      `Enterprise ${formattedPan}`;

    // 4. Construct payload for MongoDB schema
    const isMahaParwanaEligible = ['Green', 'Orange'].includes(industryCategory);
    const statutorySla = isMahaParwanaEligible ? 48 : (industryCategory === 'White' ? 24 : 360);
    const enterpriseType = BusinessProfile.classifyEnterprise(numericInvestment);

    const profileData = {
      companyName: resolvedCompanyName,
      pan: formattedPan,
      gst: formattedGst,
      industryCategory,
      investmentSize: numericInvestment,
      location: req.body.location?.trim() || dlCert.registeredAddress || 'MIDC Industrial Area, Phase-II, Chakan, Pune, Maharashtra',
      enterpriseType,
      verificationStatus: 'VERIFIED',
      digilockerData: {
        cin: dlCert.cin || `U29100MH2021PTC${Math.floor(100000 + Math.random() * 900000)}`,
        incorporationDate: dlCert.incorporationDate || new Date('2021-04-16'),
        companyType: dlCert.companyType || 'Private Limited Company',
        registeredAddress: dlCert.registeredAddress || 'MIDC Industrial Area, Chakan, Pune, Maharashtra - 410501',
        rocOffice: dlCert.rocOffice || 'RoC-Mumbai',
        authorizedCapitalINR: dlCert.authorizedCapitalINR || 20000000,
        paidUpCapitalINR: dlCert.paidUpCapitalINR || 10000000,
        directors: dlCert.directors || [
          { din: '08492011', name: 'Vikramaditya Deshmukh', designation: 'Managing Director' },
          { din: '09182390', name: 'Ananya Rajendra Patil', designation: 'Director' }
        ],
        documentUri: dlCert.documentUri || `in.gov.mca.coi-${formattedPan}`,
        verifiedAt: new Date()
      },
      gstData: {
        legalName: gstInfo.legalName || resolvedCompanyName,
        tradeName: gstInfo.tradeName || resolvedCompanyName,
        taxpayerType: gstInfo.taxpayerType || 'Regular',
        gstinStatus: gstInfo.gstinStatus || 'Active',
        stateJurisdiction: gstInfo.stateJurisdiction || 'Maharashtra State Tax, Pune Circle',
        centerJurisdiction: gstInfo.centerJurisdiction || 'Range-IV, Pune Commissionerate',
        principalPlaceOfBusiness: {
          address: gstInfo.principalPlaceOfBusiness?.address || 'Plot No. C-14, MIDC Phase-II, Chakan, Pune - 410501',
          natureOfBusiness: gstInfo.principalPlaceOfBusiness?.natureOfBusiness || 'Manufacturing'
        },
        verifiedAt: new Date()
      },
      complianceSummary: {
        mahaParwanaEligible: isMahaParwanaEligible,
        slaHours: statutorySla,
        riskScore: industryCategory === 'Red' ? 75 : (industryCategory === 'Orange' ? 40 : (industryCategory === 'Green' ? 20 : 5)),
        verifiedBy: 'API_SETU_SANDBOX',
        mrtpsActTracked: true
      }
    };

    // 5. Upsert business profile in MongoDB
    const profile = await BusinessProfile.findOneAndUpdate(
      { $or: [{ pan: formattedPan }, { gst: formattedGst }] },
      profileData,
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`[Zero-Entry Gateway] Business profile saved successfully with ID: ${profile._id}`);

    return res.status(201).json({
      success: true,
      message: 'Business profile successfully verified via API Setu Sandbox and saved to UdyogSetu.',
      gateway: {
        environment: 'API Setu Sandbox (https://sandbox.api-setu.in)',
        zeroEntryStatus: 'AUTONOMOUS_VERIFIED',
        mahaParwanaFastTrack: isMahaParwanaEligible,
        statutorySlaHours: statutorySla,
        liveSandboxResponse: digilockerResult.fromLiveSandbox && gstResult.fromLiveSandbox
      },
      data: profile
    });
  } catch (error) {
    console.error(`[Zero-Entry Gateway Error]:`, error);
    next(error);
  }
};

/**
 * @desc    Get all registered and verified business profiles
 * @route   GET /api/verification/profiles
 * @access  Public / Officer Portal
 */
exports.getAllBusinessProfiles = async (req, res, next) => {
  try {
    const { category, status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) query.industryCategory = category;
    if (status) query.verificationStatus = status;
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { pan: { $regex: search, $options: 'i' } },
        { gst: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [profiles, total] = await Promise.all([
      BusinessProfile.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      BusinessProfile.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: profiles.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get business profile by MongoDB ID
 * @route   GET /api/verification/profiles/:id
 * @access  Public / Officer Portal
 */
exports.getBusinessProfileById = async (req, res, next) => {
  try {
    const profile = await BusinessProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Business profile not found with id: ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lookup business profile by PAN or GSTIN
 * @route   GET /api/verification/status/:identifier
 * @access  Public / Portal
 */
exports.getProfileByIdentifier = async (req, res, next) => {
  try {
    const identifier = req.params.identifier.toUpperCase().trim();
    const profile = await BusinessProfile.findOne({
      $or: [{ pan: identifier }, { gst: identifier }]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `No verified profile found for identifier: ${identifier}`
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};
