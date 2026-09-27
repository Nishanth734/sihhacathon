const cron = require('node-cron');
const ApplicationState = require('../models/ApplicationState');

/**
 * MRTPS Act SLA Enforcer & Escalation Matrix
 * SIH26130 - UdyogSetu Governance Layer
 *
 * Mandated by Maharashtra Right to Public Services (MRTPS) Act, 2015
 * and the Maharashtra Maha Parwana Initiative:
 *  - Green category: 48 hours legal limit
 *  - Other categories: 30 days (720 hours) legal limit
 *
 * If breached for department 'Pollution_Control', status updates to 'Deemed Approved'
 * and triggers automated escalation to the First Appellate Authority.
 */

/**
 * Mock function to notify the First Appellate Authority upon statutory breach
 * @param {Object} app - Application document
 * @param {number} elapsedHours - Hours elapsed since submission
 * @param {number} statutoryLimitHours - Legal threshold hours
 */
function escalateToAppellateAuthority(app, elapsedHours, statutoryLimitHours) {
  const elapsedDays = (elapsedHours / 24).toFixed(1);
  const limitDays = (statutoryLimitHours / 24).toFixed(1);

  const escalationNotice = 
    `STATUTORY ESCALATION UNDER MRTPS ACT 2015: ` +
    `Application ${app.applicationNumber} for entity '${app.companyName}' (${app.industryCategory} Category) ` +
    `in department '${app.department}' has breached the statutory SLA of ${statutoryLimitHours}h (${limitDays} days). ` +
    `Elapsed time: ${elapsedHours.toFixed(1)}h (${elapsedDays} days). ` +
    `Status has been updated to 'Deemed Approved'. Case dossier transmitted to First Appellate Authority ` +
    `(Member Secretary, Maharashtra Pollution Control Board) for statutory officer accountability.`;

  console.log('\n================================================================');
  console.log('🚨 [MRTPS ACT STATUTORY SLA BREACH & DEEMED APPROVAL ESCALATION]');
  console.log(`📌 Application: ${app.applicationNumber} (${app.companyName})`);
  console.log(`🏛️  Department:  ${app.department}`);
  console.log(`⏱️  SLA Breach:  Elapsed ${elapsedHours.toFixed(1)}h vs Statutory Limit ${statutoryLimitHours}h`);
  console.log(`⚖️  New Status:  'Deemed Approved' (Under Section 8 of MRTPS Act 2015)`);
  console.log(`📬 Escalated To: Maharashtra Right to Public Services Commission / Appellate Authority`);
  console.log('================================================================\n');

  return {
    escalatedAt: new Date(),
    appellateAuthority: 'Maharashtra Right to Public Services Commission / First Appellate Authority (MPCB Member Secretary)',
    statutoryAct: 'Maharashtra Right to Public Services Act, 2015 (Section 8) & Maha Parwana 2020',
    breachedSlaHours: statutoryLimitHours,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    escalationNotice
  };
}

/**
 * Core scanning engine: evaluates pending Pollution_Control applications
 * against 48-hour (Green) or 30-day (others) statutory limits.
 */
async function executeSlaEnforcementScan() {
  console.log(`[MRTPS Cron Enforcer] Initiating statutory SLA compliance scan at ${new Date().toISOString()}...`);

  // Target department: 'Pollution_Control' (case-insensitive regex)
  // Status: pending review (not already approved, rejected, or deemed approved)
  const pendingQuery = {
    department: { $regex: /^pollution_control$/i },
    status: { $nin: ['Approved', 'Rejected', 'Deemed Approved'] }
  };

  const pendingApps = await ApplicationState.find(pendingQuery);
  console.log(`[MRTPS Cron Enforcer] Found ${pendingApps.length} pending Pollution_Control application(s) under review.`);

  const now = Date.now();
  let breachedCount = 0;
  const processedRecords = [];

  for (const app of pendingApps) {
    const elapsedMs = now - app.submissionDate.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    // Statutory Limits under Maha Parwana & MRTPS Act:
    // Green Category = 48 hours; Others = 30 days (720 hours)
    const isGreen = app.industryCategory && app.industryCategory.toLowerCase() === 'green';
    const statutoryLimitHours = isGreen ? 48 : 30 * 24; // 48h or 720h (30 days)

    if (elapsedHours > statutoryLimitHours) {
      breachedCount++;

      // Trigger escalation to Appellate Authority
      const escalationPayload = escalateToAppellateAuthority(app, elapsedHours, statutoryLimitHours);

      // Update state to 'Deemed Approved'
      app.status = 'Deemed Approved';
      app.deemedApprovedAt = new Date();
      app.escalatedToAppellate = true;
      app.escalationDetails = escalationPayload;

      await app.save();

      processedRecords.push({
        applicationNumber: app.applicationNumber,
        companyName: app.companyName,
        industryCategory: app.industryCategory,
        elapsedHours: Math.round(elapsedHours * 10) / 10,
        statutoryLimitHours,
        previousStatus: 'Under_Scrutiny',
        newStatus: 'Deemed Approved',
        escalatedToAppellate: true
      });
    }
  }

  console.log(`[MRTPS Cron Enforcer] Scan complete: ${breachedCount} statutory breach(es) transitioned to 'Deemed Approved'.`);

  return {
    scannedAt: new Date().toISOString(),
    totalPendingScanned: pendingApps.length,
    breachesTransitionedCount: breachedCount,
    processedRecords
  };
}

/**
 * Initialize daily cron job
 * Scheduled to run every day at midnight ('0 0 * * *')
 */
let scheduledTask = null;

function initializeMrtpsCronScheduler(cronExpression = '0 0 * * *') {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    try {
      await executeSlaEnforcementScan();
    } catch (err) {
      console.error('[MRTPS Cron Enforcer Error]:', err);
    }
  });

  console.log(`⏰ [MRTPS Cron Scheduler] Daily statutory SLA enforcer armed (Expression: '${cronExpression}').`);
  return scheduledTask;
}

module.exports = {
  initializeMrtpsCronScheduler,
  executeSlaEnforcementScan,
  escalateToAppellateAuthority
};
