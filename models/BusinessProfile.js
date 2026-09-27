const mongoose = require('mongoose');

/**
 * BusinessProfile Mongoose Schema
 * Represents the verified business entity profile for UdyogSetu (SIH26130)
 * Integrates with API Setu Sandbox (GST & DigiLocker MCA Incorporation)
 */
const DirectorSchema = new mongoose.Schema(
  {
    din: { type: String, trim: true },
    name: { type: String, trim: true },
    designation: { type: String, trim: true, default: 'Director' }
  },
  { _id: false }
);

const DigiLockerIncorporationSchema = new mongoose.Schema(
  {
    cin: { type: String, trim: true },
    incorporationDate: { type: Date },
    companyType: { type: String, default: 'Private Limited Company' },
    registeredAddress: { type: String, trim: true },
    rocOffice: { type: String, trim: true, default: 'RoC-Mumbai' },
    authorizedCapitalINR: { type: Number, default: 1000000 },
    paidUpCapitalINR: { type: Number, default: 500000 },
    directors: [DirectorSchema],
    documentUri: { type: String, trim: true },
    verifiedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const GSTDetailsSchema = new mongoose.Schema(
  {
    legalName: { type: String, trim: true },
    tradeName: { type: String, trim: true },
    taxpayerType: { type: String, default: 'Regular' },
    gstinStatus: { type: String, default: 'Active' },
    stateJurisdiction: { type: String, trim: true, default: 'Maharashtra State Tax' },
    centerJurisdiction: { type: String, trim: true, default: 'Range-I, Division-II, Pune/Mumbai' },
    principalPlaceOfBusiness: {
      address: { type: String, trim: true },
      natureOfBusiness: { type: String, trim: true, default: 'Manufacturing / Industrial Operations' }
    },
    verifiedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ComplianceSummarySchema = new mongoose.Schema(
  {
    mahaParwanaEligible: {
      type: Boolean,
      default: false,
      description: 'True for Green/Orange categories eligible for statutory 48-hour Maha Parwana fast track'
    },
    slaHours: {
      type: Number,
      default: 48,
      description: 'Statutory approval SLA in hours (48 hours under Maha Parwana, or 360 hours for Red)'
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
      description: 'Calculated regulatory risk index based on pollution category & capital investment'
    },
    verifiedBy: {
      type: String,
      default: 'API_SETU_SANDBOX'
    },
    mrtpsActTracked: {
      type: Boolean,
      default: true,
      description: 'Whether application is enrolled under Maharashtra Right to Public Services Act, 2015'
    }
  },
  { _id: false }
);

const BusinessProfileSchema = new mongoose.Schema(
  {
    // Required core fields specified in prompt
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true
    },
    pan: {
      type: String,
      required: [true, 'PAN (Permanent Account Number) is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please provide a valid 10-character Indian PAN (e.g. ABCDE1234F)'],
      index: true
    },
    gst: {
      type: String,
      required: [true, 'GSTIN is required'],
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'Please provide a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)'
      ],
      index: true
    },
    industryCategory: {
      type: String,
      required: [true, 'Industry category is required'],
      enum: {
        values: ['White', 'Green', 'Orange', 'Red'],
        message: '{VALUE} is not a valid CPCB/MPCB industry category. Must be White, Green, Orange, or Red.'
      },
      index: true
    },
    investmentSize: {
      type: Number,
      required: [true, 'Investment size (in INR Crores) is required'],
      min: [0, 'Investment size must be a positive number']
    },
    location: {
      type: String,
      default: 'MIDC Industrial Area, Phase-II, Chakan, Pune, Maharashtra',
      trim: true
    },

    // Extended MSME classification (Micro, Small, Medium, Large)
    enterpriseType: {
      type: String,
      enum: ['Micro', 'Small', 'Medium', 'Large'],
      default: 'Small'
    },

    // Gateway verification lifecycle
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FAILED', 'FLAGGED_FOR_AUDIT'],
      default: 'PENDING',
      index: true
    },

    // DigiLocker MCA incorporation payload from API Setu Sandbox
    digilockerData: {
      type: DigiLockerIncorporationSchema,
      default: () => ({})
    },

    // GST verification payload from API Setu Sandbox
    gstData: {
      type: GSTDetailsSchema,
      default: () => ({})
    },

    // Regulatory & Maha Parwana compliance metadata
    complianceSummary: {
      type: ComplianceSummarySchema,
      default: () => ({})
    },

    rawSandboxAuditLog: {
      type: mongoose.Schema.Types.Mixed,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Static helper for MSME Classification based on investment size (INR Crores)
BusinessProfileSchema.statics.classifyEnterprise = function (investmentSize) {
  const size = Number(investmentSize);
  if (size <= 1) return 'Micro';
  if (size <= 10) return 'Small';
  if (size <= 50) return 'Medium';
  return 'Large';
};

// Pre-save hook to calculate Maha Parwana eligibility and enterprise type
BusinessProfileSchema.pre('save', function (next) {
  // Maha Parwana initiative fast-tracks Green and Orange category industries within 48 hours
  const isGreenOrOrange = ['Green', 'Orange'].includes(this.industryCategory);
  if (this.complianceSummary) {
    this.complianceSummary.mahaParwanaEligible = isGreenOrOrange;
    this.complianceSummary.slaHours = isGreenOrOrange ? 48 : (this.industryCategory === 'White' ? 24 : 360);
  }

  // MSME classification based on investment size (INR Crores)
  this.enterpriseType = BusinessProfile.classifyEnterprise(this.investmentSize);

  next();
});

const BusinessProfile = mongoose.model('BusinessProfile', BusinessProfileSchema);

module.exports = BusinessProfile;
