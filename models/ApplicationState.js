const mongoose = require('mongoose');

/**
 * ApplicationState Mongoose Schema
 * Tracks regulatory industrial application lifecycles under the
 * Maharashtra Right to Public Services (MRTPS) Act, 2015 & Maha Parwana Initiative.
 */
const EscalationDetailsSchema = new mongoose.Schema(
  {
    escalatedAt: { type: Date },
    appellateAuthority: {
      type: String,
      default: 'Maharashtra Right to Public Services Commission / First Appellate Authority (MPCB Member Secretary)'
    },
    statutoryAct: {
      type: String,
      default: 'Maharashtra Right to Public Services Act, 2015 (Section 8)'
    },
    breachedSlaHours: { type: Number },
    elapsedHours: { type: Number },
    escalationNotice: { type: String }
  },
  { _id: false }
);

const ApplicationStateSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // Core requested fields
    department: {
      type: String,
      required: [true, 'Department is required (e.g. Pollution_Control, MIDC, DISH, Fire)'],
      trim: true,
      index: true
    },
    submissionDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: [
        'Submitted',
        'Under_Scrutiny',
        'In_Progress',
        'Approved',
        'Rejected',
        'Deemed Approved'
      ],
      default: 'Under_Scrutiny',
      index: true
    },
    documentUrl: {
      type: String,
      default: '/uploads/documents/MPCB_Application_Dossier.pdf'
    },

    // Extended regulatory fields for statutory SLA calculation
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    industryCategory: {
      type: String,
      enum: ['White', 'Green', 'Orange', 'Red'],
      default: 'Orange',
      index: true
    },
    approvalType: {
      type: String,
      default: 'Consent to Establish (CTE)'
    },
    escalatedToAppellate: {
      type: Boolean,
      default: false,
      index: true
    },
    deemedApprovedAt: {
      type: Date
    },
    escalationDetails: {
      type: EscalationDetailsSchema,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual to compute live elapsed hours
ApplicationStateSchema.virtual('elapsedHours').get(function () {
  if (!this.submissionDate) return 0;
  return Math.round(((Date.now() - this.submissionDate.getTime()) / (1000 * 60 * 60)) * 10) / 10;
});

// Virtual to determine applicable statutory SLA hours
ApplicationStateSchema.virtual('statutorySlaHours').get(function () {
  if (this.industryCategory === 'Green') return 48; // Maha Parwana 48-Hour mandate
  if (this.industryCategory === 'White') return 24;
  return 720; // 30 days (720 hours) legal limit under Maha Parwana / MRTPS Act
});

const ApplicationState = mongoose.model('ApplicationState', ApplicationStateSchema);

module.exports = ApplicationState;
