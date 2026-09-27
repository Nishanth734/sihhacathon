/**
 * Comprehensive Test Suite for UdyogSetu Backend & Zero-Entry Verification Gateway
 */
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('./server');

const TEST_PORT = 5001;

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
  console.log('🧪 Starting UdyogSetu Backend & Gateway Test Suite');
  console.log('========================================================\n');

  // Start test server
  const server = app.listen(TEST_PORT);
  console.log(`[Test Runner] Started temporary test server on port ${TEST_PORT}`);

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

  try {
    // Wait briefly for DB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }

    // TEST 1: Healthcheck endpoint
    console.log('\n--- 1. Testing System Health Endpoint ---');
    const healthRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/health',
      method: 'GET'
    });
    assert(healthRes.status === 200, 'GET /health returns 200 OK');
    assert(healthRes.data.status === 'UP', 'Service status reports UP');
    assert(healthRes.data.database.status === 'Connected', 'MongoDB reports Connected');

    // TEST 2: Zero-Entry Verification Gateway - Green Category Industry (Maha Parwana 48-hr SLA)
    console.log('\n--- 2. Testing Zero-Entry Verification Gateway (Green Category) ---');
    const entityPayload1 = {
      pan: 'ABCDE1234F',
      gst: '27ABCDE1234F1Z5',
      industryCategory: 'Green',
      investmentSize: 12.5, // 12.5 Crores -> Small/Medium MSME
      companyName: 'Sahyadri Precision Forgings Pvt Ltd'
    };

    const verifyRes1 = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/verification/verify-entity',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      entityPayload1
    );

    assert(verifyRes1.status === 201, 'POST /api/verification/verify-entity returns 201 Created');
    assert(verifyRes1.data.success === true, 'Response success is true');
    assert(verifyRes1.data.data.companyName === 'Sahyadri Precision Forgings Pvt Ltd', 'Company name saved correctly');
    assert(verifyRes1.data.data.pan === 'ABCDE1234F', 'PAN is verified and formatted');
    assert(verifyRes1.data.data.gst === '27ABCDE1234F1Z5', 'GSTIN is verified and formatted');
    assert(verifyRes1.data.data.industryCategory === 'Green', 'Industry category is Green');
    assert(verifyRes1.data.data.investmentSize === 12.5, 'Investment size is 12.5 Cr');
    assert(verifyRes1.data.data.verificationStatus === 'VERIFIED', 'Verification status is VERIFIED');
    assert(verifyRes1.data.data.complianceSummary.mahaParwanaEligible === true, 'Maha Parwana eligibility is TRUE for Green category');
    assert(verifyRes1.data.data.complianceSummary.slaHours === 48, 'Statutory SLA is 48 hours under Maha Parwana');
    assert(Boolean(verifyRes1.data.data.digilockerData.cin), 'DigiLocker MCA CIN is present');
    assert(verifyRes1.data.data.digilockerData.directors.length > 0, 'DigiLocker authorized directors populated');
    assert(verifyRes1.data.data.gstData.gstinStatus === 'Active', 'GST Status is Active');

    const createdId1 = verifyRes1.data.data._id;

    // TEST 3: Zero-Entry Verification Gateway - Autonomous Company Name Resolution (Zero Entry!)
    console.log('\n--- 3. Testing Zero-Entry Autonomous Resolution (No Company Name supplied) ---');
    const entityPayload2 = {
      pan: 'MAHAR9876K',
      gst: '27MAHAR9876K1Z9',
      industryCategory: 'Orange',
      investmentSize: 45.0 // 45 Crores
    };

    const verifyRes2 = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/verification/verify-entity',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      entityPayload2
    );

    assert(verifyRes2.status === 201, 'POST /api/verification/verify-entity returns 201 for auto-resolved entity');
    assert(Boolean(verifyRes2.data.data.companyName), `Autonomous company name auto-resolved: "${verifyRes2.data.data.companyName}"`);
    assert(verifyRes2.data.data.complianceSummary.mahaParwanaEligible === true, 'Orange category is Maha Parwana eligible (48hr SLA)');
    assert(verifyRes2.data.data.enterpriseType === 'Medium', 'Investment 45 Cr correctly classified as Medium Enterprise');

    // TEST 4: Fetch all profiles
    console.log('\n--- 4. Testing Profile Retrieval Endpoints ---');
    const allProfilesRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/verification/profiles',
      method: 'GET'
    });
    assert(allProfilesRes.status === 200, 'GET /api/verification/profiles returns 200 OK');
    assert(allProfilesRes.data.data.length >= 2, `Retrieved ${allProfilesRes.data.data.length} profiles from MongoDB`);

    // TEST 5: Fetch profile by ID
    const singleProfileRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/verification/profiles/${createdId1}`,
      method: 'GET'
    });
    assert(singleProfileRes.status === 200, 'GET /api/verification/profiles/:id returns 200 OK');
    assert(singleProfileRes.data.data._id === createdId1, 'Fetched correct profile by MongoDB _id');

    // TEST 6: Fetch profile by Identifier (PAN or GST)
    const lookupRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: `/api/verification/status/ABCDE1234F`,
      method: 'GET'
    });
    assert(lookupRes.status === 200, 'GET /api/verification/status/:pan returns 200 OK');
    assert(lookupRes.data.data.pan === 'ABCDE1234F', 'Matched profile by PAN lookup');

    // TEST 7: Input Validation Error Handling (Invalid PAN & Invalid GST)
    console.log('\n--- 5. Testing Input Validation & Error Handling ---');
    const invalidRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/verification/verify-entity',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        pan: 'INVALID_PAN',
        gst: 'BAD_GST',
        industryCategory: 'InvalidCategory',
        investmentSize: -10
      }
    );
    assert(invalidRes.status === 400, 'POST with invalid input rejected with 400 Bad Request');
    assert(invalidRes.data.success === false, 'Error response returns success: false');
    assert(invalidRes.data.errors.length >= 4, `Validation caught ${invalidRes.data.errors.length} input format errors`);

    // TEST 8: Topological Regulatory Dependency Engine - Green Category DAG
    console.log('\n--- 6. Testing Topological Regulatory Dependency Engine (Green Category) ---');
    const greenDagRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/regulatory/dependency-graph?category=Green',
      method: 'GET'
    });
    assert(greenDagRes.status === 200, 'GET /api/regulatory/dependency-graph?category=Green returns 200 OK');
    assert(greenDagRes.data.success === true, 'Green DAG returned with success: true');
    assert(greenDagRes.data.data.category === 'Green', 'Green category correctly identified');
    assert(greenDagRes.data.data.mahaParwanaEligible === true, 'Green category is Maha Parwana eligible');
    assert(greenDagRes.data.data.statutorySlaHours === 48, 'Green category has statutory 48-hour Maha Parwana SLA');
    assert(Array.isArray(greenDagRes.data.data.topologicalOrder), 'Topological order is computed via Kahn Algorithm');
    assert(greenDagRes.data.data.topologicalOrder.length === greenDagRes.data.data.rawGraph.nodes.length, 'Deterministic DAG verified (no cycles)');
    assert(greenDagRes.data.data.criticalPath.criticalPathDaysTotal > 0, `Critical path computed: ${greenDagRes.data.data.criticalPath.criticalPathDaysTotal} days`);
    assert(greenDagRes.data.data.reactFlow.nodes.length > 0, 'React Flow nodes generated with coordinates');
    assert(greenDagRes.data.data.reactFlow.edges.length > 0, 'React Flow edges generated');
    assert(greenDagRes.data.data.parallelTracks.length > 0, 'Parallel approval tracks identified for concurrency');

    // Verify node color-coding / status fields
    const statuses = new Set(greenDagRes.data.data.reactFlow.nodes.map(n => n.data.status));
    assert(statuses.has('Validated') || statuses.has('Pending') || statuses.has('Uploaded'), 'React Flow nodes contain status properties');

    // TEST 9: Topological Regulatory Dependency Engine - Orange Category DAG (POST)
    console.log('\n--- 7. Testing Topological Regulatory Dependency Engine (Orange Category via POST) ---');
    const orangeDagRes = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/regulatory/dependency-graph',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { industryCategory: 'Orange' }
    );
    assert(orangeDagRes.status === 200, 'POST /api/regulatory/dependency-graph (Orange) returns 200 OK');
    assert(orangeDagRes.data.data.category === 'Orange', 'Orange category correctly returned');
    assert(orangeDagRes.data.data.mahaParwanaEligible === true, 'Orange category is Maha Parwana eligible');
    assert(orangeDagRes.data.data.statutorySlaHours === 48, 'Orange category has statutory 48-hour SLA');
    assert(orangeDagRes.data.data.parallelTracks.length > 0, 'Orange category identifies parallel engineering streams');

    // TEST 10: Topological Regulatory Dependency Engine - Red Category DAG (Params)
    console.log('\n--- 8. Testing Topological Regulatory Dependency Engine (Red Category via URL Params) ---');
    const redDagRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/regulatory/dependency-graph/Red',
      method: 'GET'
    });
    assert(redDagRes.status === 200, 'GET /api/regulatory/dependency-graph/Red returns 200 OK');
    assert(redDagRes.data.data.category === 'Red', 'Red category correctly returned');
    assert(redDagRes.data.data.mahaParwanaEligible === false, 'Red category requires full SEIAA/EIA Environmental Clearance');
    assert(redDagRes.data.data.statutorySlaHours === 360, 'Red category assigned standard statutory SLA (360h)');
    assert(redDagRes.data.data.criticalPath.criticalPathDaysTotal > 100, `Red category critical path reflects EIA scrutiny (${redDagRes.data.data.criticalPath.criticalPathDaysTotal} days)`);

    // TEST 11: Invalid Industry Category Validation
    console.log('\n--- 9. Testing Category Validation ---');
    const invalidCatRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/regulatory/dependency-graph?category=Purple',
      method: 'GET'
    });
    assert(invalidCatRes.status === 400, 'Invalid category rejected with 400 Bad Request');
    assert(invalidCatRes.data.validCategories.includes('Green'), 'Response lists valid categories');

    // TEST 12: Categories Overview Endpoint
    console.log('\n--- 10. Testing Categories Overview Endpoint ---');
    const categoriesMetaRes = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/regulatory/categories',
      method: 'GET'
    });
    assert(categoriesMetaRes.status === 200, 'GET /api/regulatory/categories returns 200 OK');
    assert(categoriesMetaRes.data.data.length === 3, 'Metadata returned for Green, Orange, and Red categories');

  } catch (err) {
    console.error('[Test Execution Error]:', err);
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
