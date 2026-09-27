/**
 * Automated Test Suite for Deterministic GraphRAG Compliance Validator
 * SIH26130 - UdyogSetu
 */
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('./server');
const graphRagValidator = require('./services/graphRagValidatorService');

const TEST_PORT = 5002;

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
  console.log('🏛️  Testing Deterministic GraphRAG Compliance Validator');
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
    // TEST 1: Direct Cypher Query for Chemical_Storage Rule
    console.log('--- 1. Testing Cypher Query Against Regulatory Knowledge Graph ---');
    const chemRule = await graphRagValidator.queryGoverningRule('Chemical_Storage');
    assert(chemRule !== null, 'Found Chemical_Storage governing rule');
    assert(chemRule.rule.ruleCode === 'REQUIRES_SETBACK_MIN', 'Rule code is REQUIRES_SETBACK_MIN');
    assert(chemRule.rule.threshold === 15.0, 'Statutory threshold is 15.0 meters');
    assert(chemRule.rule.operator === 'GTE', 'Operator is GTE (Greater than or equal to)');
    assert(Boolean(chemRule.cypherQuery), 'Cypher query provenance captured');

    // TEST 2: Direct Cypher Query for Water and HazWaste Rules
    const waterRule = await graphRagValidator.queryGoverningRule('Water_Consumption');
    assert(waterRule.rule.threshold === 25.0, 'Water threshold is 25.0 KL/day');

    const hazRule = await graphRagValidator.queryGoverningRule('Hazardous_Waste');
    assert(hazRule.rule.threshold === 5.0, 'Hazardous waste threshold is 5.0 MT/annum');

    // TEST 3: Validation with 10m Setback (Explicit User Scenario: CAD 10m violation)
    console.log('\n--- 2. Testing 10m Setback Validation (MIDC DCR Violation) ---');
    const inputViolation = {
      cadSetbackMeters: 10.0, // 10m setback calculated from CAD file
      industryCategory: 'Orange',
      waterRequirementKld: 45.5,
      hazardousWasteMt: 12.8,
      companyName: 'Apex Precision Forgings Pvt Ltd'
    };

    const resViolation = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/compliance/validate-proof-sheet',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      inputViolation
    );

    assert(resViolation.status === 200, 'POST /api/compliance/validate-proof-sheet returns 200 OK');
    assert(resViolation.data.isCompliant === false, 'Overall isCompliant is false due to setback violation');
    assert(resViolation.data.verdict === 'NON_COMPLIANT', 'Overall verdict is NON_COMPLIANT');

    const sheetViolation = resViolation.data.data.complianceProofSheet;
    assert(Boolean(sheetViolation.header.proofSheetId), 'Proof sheet ID generated');
    assert(sheetViolation.executiveSummary.violationsCount === 1, 'Exactly 1 fatal violation flagged');

    // Inspect the specific setback audit trail
    const setbackAudit = sheetViolation.deterministicAuditTrail.find(
      (r) => r.ruleCode === 'REQUIRES_SETBACK_MIN'
    );
    assert(setbackAudit !== undefined, 'Setback rule included in audit trail');
    assert(setbackAudit.passed === false, 'Setback rule failed (10m < 15m)');
    assert(setbackAudit.extractedValue === 10.0, 'Extracted value is 10.0m');
    assert(setbackAudit.statutoryThreshold === 15.0, 'Statutory threshold is 15.0m');
    assert(setbackAudit.deficitMeters === 5.0, 'Calculated deficit is exactly 5.0m');
    assert(setbackAudit.complianceStatus === 'FATAL_VIOLATION', 'Compliance status is FATAL_VIOLATION');
    assert(Boolean(setbackAudit.penalty), 'Penalty citation included');
    assert(Boolean(setbackAudit.actionRequired), 'Actionable remediation steps included');

    // TEST 4: Validation with Compliant Setback (20m >= 15m)
    console.log('\n--- 3. Testing Compliant Setback (20m >= 15m) ---');
    const inputCompliant = {
      cadSetbackMeters: 20.0,
      industryCategory: 'Green',
      waterRequirementKld: 12.0,
      hazardousWasteMt: 0.0,
      companyName: 'Sahyadri Green Tech Pvt Ltd'
    };

    const resCompliant = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/compliance/validate-proof-sheet',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      inputCompliant
    );

    assert(resCompliant.status === 200, 'POST /api/compliance/validate-proof-sheet (Compliant) returns 200 OK');
    assert(resCompliant.data.isCompliant === true, 'Overall isCompliant is true');
    assert(resCompliant.data.verdict === 'COMPLIANT', 'Overall verdict is COMPLIANT');

    const sheetCompliant = resCompliant.data.data.complianceProofSheet;
    assert(sheetCompliant.executiveSummary.violationsCount === 0, 'Zero violations for compliant layout');

    const setbackAuditCompliant = sheetCompliant.deterministicAuditTrail.find(
      (r) => r.ruleCode === 'REQUIRES_SETBACK_MIN'
    );
    assert(setbackAuditCompliant.passed === true, 'Setback rule passed (20m >= 15m)');
    assert(setbackAuditCompliant.marginMeters === 5.0, 'Safety buffer margin is 5.0m');

    // TEST 5: Cryptographic Integrity Proof
    console.log('\n--- 4. Testing Cryptographic Audit Trail Hash ---');
    assert(Boolean(sheetViolation.cryptographicProof.hash), 'Cryptographic SHA-256 audit hash generated');
    assert(sheetViolation.cryptographicProof.hash.length === 64, 'SHA-256 hash length is 64 characters');

    // TEST 6: Rule Lookup Endpoint (GET /api/compliance/rule/:entityName)
    console.log('\n--- 5. Testing Rule Lookup HTTP Endpoint ---');
    const resRule = await makeRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/compliance/rule/Chemical_Storage',
      method: 'GET'
    });
    assert(resRule.status === 200, 'GET /api/compliance/rule/Chemical_Storage returns 200 OK');
    assert(resRule.data.data.rule.threshold === 15.0, 'HTTP endpoint returns correct threshold');

  } catch (err) {
    console.error('[Compliance Test Error]:', err);
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
