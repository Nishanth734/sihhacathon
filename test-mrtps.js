/**
 * Automated Test Suite for MRTPS Act SLA Enforcer
 * SIH26130 - UdyogSetu Governance Layer
 */
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('./server');
const ApplicationState = require('./models/ApplicationState');
const {
  executeSlaEnforcementScan,
  escalateToAppellateAuthority
} = require('./services/mrtpsCronScheduler');

const TEST_PORT = 5003;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================================');
  console.log('⚖️  Testing MRTPS Act SLA Enforcer & Deemed Approval Engine');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  const server = app.listen(TEST_PORT);

  try {
    // Wait briefly for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }

    // Clean test database for test runs
    await ApplicationState.deleteMany({
      applicationNumber: { $regex: /^TEST-MRTPS-/ }
    });

    const now = Date.now();
    const FIFTY_HOURS_AGO = new Date(now - 50 * 60 * 60 * 1000); // 50 hours ago (> 48h)
    const THIRTY_FIVE_DAYS_AGO = new Date(now - 35 * 24 * 60 * 60 * 1000); // 35 days ago (> 30 days)
    const TWO_HOURS_AGO = new Date(now - 2 * 60 * 60 * 1000); // 2 hours ago (< 48h)
    const FORTY_DAYS_AGO = new Date(now - 40 * 24 * 60 * 60 * 1000);

    // 1. Seed Test Applications
    console.log('--- 1. Seeding Test Applications in MongoDB ---');
    const appGreenBreached = await ApplicationState.create({
      applicationNumber: 'TEST-MRTPS-GREEN-BREACHED',
      department: 'Pollution_Control',
      companyName: 'Sahyadri Bio-Solvents Pvt Ltd',
      industryCategory: 'Green',
      submissionDate: FIFTY_HOURS_AGO,
      status: 'Under_Scrutiny'
    });
    assert(Boolean(appGreenBreached._id), 'Created Green Category application (Submitted 50h ago > 48h SLA)');

    const appOrangeBreached = await ApplicationState.create({
      applicationNumber: 'TEST-MRTPS-ORANGE-BREACHED',
      department: 'Pollution_Control',
      companyName: 'Deccan Heavy Synthetics Ltd',
      industryCategory: 'Orange',
      submissionDate: THIRTY_FIVE_DAYS_AGO,
      status: 'Under_Scrutiny'
    });
    assert(Boolean(appOrangeBreached._id), 'Created Orange Category application (Submitted 35d ago > 30d SLA)');

    const appRecentCompliant = await ApplicationState.create({
      applicationNumber: 'TEST-MRTPS-RECENT-COMPLIANT',
      department: 'Pollution_Control',
      companyName: 'Pune Auto Components Pvt Ltd',
      industryCategory: 'Green',
      submissionDate: TWO_HOURS_AGO,
      status: 'Under_Scrutiny'
    });
    assert(Boolean(appRecentCompliant._id), 'Created Recent Green application (Submitted 2h ago < 48h SLA)');

    const appOtherDept = await ApplicationState.create({
      applicationNumber: 'TEST-MRTPS-OTHER-DEPT',
      department: 'MIDC_Engineering',
      companyName: 'MIDC Plot Lessee Unit',
      industryCategory: 'Orange',
      submissionDate: FORTY_DAYS_AGO,
      status: 'Under_Scrutiny'
    });
    assert(Boolean(appOtherDept._id), 'Created non-Pollution_Control application for isolation check');

    // 2. Execute the MRTPS Cron Scan Engine
    console.log('\n--- 2. Executing Statutory SLA Scan Engine ---');
    const scanResult = await executeSlaEnforcementScan();
    assert(scanResult.breachesTransitionedCount >= 2, `SLA scan processed ${scanResult.breachesTransitionedCount} statutory breach(es)`);

    // 3. Verify Database State Post-Scan
    console.log('\n--- 3. Verifying Database Status Transitions & Escalation ---');

    // Check Green Application
    const updatedGreen = await ApplicationState.findOne({ applicationNumber: 'TEST-MRTPS-GREEN-BREACHED' });
    assert(updatedGreen.status === 'Deemed Approved', 'Green Category application status updated to "Deemed Approved"');
    assert(updatedGreen.escalatedToAppellate === true, 'Green application escalatedToAppellate flag set to true');
    assert(Boolean(updatedGreen.deemedApprovedAt), 'deemedApprovedAt timestamp recorded');
    assert(Boolean(updatedGreen.escalationDetails), 'Appellate escalation details populated');
    assert(updatedGreen.escalationDetails.breachedSlaHours === 48, 'Recorded breached SLA as 48 hours for Green category');
    assert(updatedGreen.escalationDetails.appellateAuthority.includes('MPCB'), 'Escalated to First Appellate Authority (MPCB Member Secretary)');

    // Check Orange Application
    const updatedOrange = await ApplicationState.findOne({ applicationNumber: 'TEST-MRTPS-ORANGE-BREACHED' });
    assert(updatedOrange.status === 'Deemed Approved', 'Orange Category application status updated to "Deemed Approved"');
    assert(updatedOrange.escalatedToAppellate === true, 'Orange application escalatedToAppellate flag set to true');
    assert(updatedOrange.escalationDetails.breachedSlaHours === 720, 'Recorded breached SLA as 720 hours (30 days) for Orange category');

    // Check Recent Application (Within SLA)
    const updatedRecent = await ApplicationState.findOne({ applicationNumber: 'TEST-MRTPS-RECENT-COMPLIANT' });
    assert(updatedRecent.status === 'Under_Scrutiny', 'Recent application remains "Under_Scrutiny" (not deemed approved)');
    assert(updatedRecent.escalatedToAppellate === false, 'Recent application not escalated');

    // Check Other Department (Isolation)
    const updatedOther = await ApplicationState.findOne({ applicationNumber: 'TEST-MRTPS-OTHER-DEPT' });
    assert(updatedOther.status === 'Under_Scrutiny', 'Non-Pollution_Control application isolated from MPCB scan');

    // 4. Test HTTP Endpoints
    console.log('\n--- 4. Testing HTTP Application Management Routes ---');
    const listRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/applications?department=Pollution_Control',
      method: 'GET'
    });
    assert(listRes.status === 200, 'GET /api/applications returns 200 OK');
    assert(listRes.data.stats.deemedApproved >= 2, 'Stats indicate Deemed Approved applications');

    // Test on-demand trigger endpoint
    const triggerRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/applications/trigger-sla-scan',
      method: 'POST'
    });
    assert(triggerRes.status === 200, 'POST /api/applications/trigger-sla-scan returns 200 OK');
    assert(triggerRes.data.success === true, 'Scan trigger response reports success: true');

  } catch (err) {
    console.error('[MRTPS Test Error]:', err);
  } finally {
    console.log('\n========================================================');
    console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('========================================================\n');
    server.close();
    await mongoose.connection.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runTests();
