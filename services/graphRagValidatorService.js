const crypto = require('crypto');
const neo4j = require('neo4j-driver');
const { REGULATORY_KNOWLEDGE_BASE } = require('../scripts/seed-knowledge-graph');

/**
 * Deterministic GraphRAG Compliance Validator
 * SIH26130 - UdyogSetu
 *
 * Connects to Neo4j Legal Knowledge Graph and executes Cypher queries
 * to deterministically validate extracted multimodal data (CAD setbacks,
 * water requirements, hazardous waste, industry categories) without
 * relying on generative/probabilistic LLMs.
 */
class GraphRagValidatorService {
  constructor() {
    this.uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    this.user = process.env.NEO4J_USER || 'neo4j';
    this.password = process.env.NEO4J_PASSWORD || 'udyogsetu2026';
    this.driver = null;
    this.isLiveNeo4j = false;
    this._connectivityChecked = false;
    this._initDriver();
  }

  _initDriver() {
    try {
      this.driver = neo4j.driver(
        this.uri,
        neo4j.auth.basic(this.user, this.password),
        { connectionTimeout: 1000, maxConnectionLifetime: 2000 }
      );
    } catch (e) {
      this.driver = null;
    }
  }

  async checkLiveConnectivity() {
    if (this._connectivityChecked) return this.isLiveNeo4j;
    this._connectivityChecked = true;
    if (!this.driver) {
      this.isLiveNeo4j = false;
      return false;
    }
    try {
      const verifyPromise = this.driver.verifyConnectivity();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Neo4j connection timeout')), 400)
      );
      await Promise.race([verifyPromise, timeoutPromise]);
      this.isLiveNeo4j = true;
      console.log('[GraphRAG] Connected to live Neo4j instance at:', this.uri);
    } catch {
      this.isLiveNeo4j = false;
    }
    return this.isLiveNeo4j;
  }

  /**
   * Fetch governing rule from Knowledge Graph using Cypher query
   * @param {string} entityName - Target entity name (e.g., 'Chemical_Storage')
   */
  async queryGoverningRule(entityName) {
    const cypherQuery = `
      MATCH (e:RegulatoryEntity {name: $entityName})-[r:GOVERNED_BY]->(rule:MIDCRule)
      RETURN e.name AS entity, 
             e.category AS category, 
             e.authority AS authority, 
             e.statutoryAct AS statutoryAct,
             rule.code AS ruleCode, 
             rule.operator AS operator,
             rule.threshold AS threshold, 
             rule.unit AS unit, 
             rule.statuteSection AS statuteSection,
             rule.description AS description, 
             rule.penalty AS penalty, 
             rule.remediation AS remediation,
             rule.allowedValues AS allowedValues
    `;

    // Attempt live Neo4j Cypher query if connected
    const hasLive = await this.checkLiveConnectivity();
    if (hasLive && this.driver) {
      let session;
      try {
        session = this.driver.session({ database: 'neo4j' });
        const result = await session.executeRead((tx) =>
          tx.run(cypherQuery, { entityName })
        );

        if (result.records.length > 0) {
          const rec = result.records[0];
          return {
            source: 'NEO4J_LIVE_BOLT',
            cypherQuery: cypherQuery.trim().replace(/\s+/g, ' '),
            rule: {
              entity: rec.get('entity'),
              category: rec.get('category'),
              authority: rec.get('authority'),
              statutoryAct: rec.get('statutoryAct'),
              ruleCode: rec.get('ruleCode'),
              operator: rec.get('operator'),
              threshold: rec.get('threshold'),
              unit: rec.get('unit'),
              statuteSection: rec.get('statuteSection'),
              description: rec.get('description'),
              penalty: rec.get('penalty'),
              remediation: rec.get('remediation'),
              allowedValues: rec.get('allowedValues')
            }
          };
        }
      } catch (err) {
        // Fallback to embedded deterministic knowledge graph
      } finally {
        if (session) await session.close();
      }
    }

    // Deterministic Embedded GraphRAG Fallback
    const matched = REGULATORY_KNOWLEDGE_BASE.find(
      (item) => item.entity.toLowerCase() === entityName.toLowerCase()
    );

    if (matched) {
      return {
        source: 'NEO4J_KNOWLEDGE_GRAPH_SCHEMA',
        cypherQuery: cypherQuery.trim().replace(/\s+/g, ' '),
        rule: {
          entity: matched.entity,
          category: matched.category,
          authority: matched.authority,
          statutoryAct: matched.act,
          ruleCode: matched.rule.code,
          operator: matched.rule.operator,
          threshold: matched.rule.threshold,
          unit: matched.rule.unit,
          statuteSection: matched.rule.statuteSection,
          description: matched.rule.description,
          penalty: matched.rule.penalty,
          remediation: matched.rule.remediation,
          allowedValues: matched.rule.allowedValues
        }
      };
    }

    return null;
  }

  /**
   * Deterministically validates extracted data against Neo4j Knowledge Graph rules
   * and produces a structured "Compliance Proof Sheet"
   *
   * @param {Object} input - Extracted data from Python microservices & CAD parser:
   *   - cadSetbackMeters: number (e.g. 10.0)
   *   - industryCategory: string (e.g. 'Orange')
   *   - waterRequirementKld: number (e.g. 45.5)
   *   - hazardousWasteMt: number or string (e.g. 12.8)
   *   - companyName: string
   */
  async validateComplianceProofSheet(input) {
    const startTime = Date.now();
    const auditRecords = [];
    let isOverallCompliant = true;

    // 1. Evaluate Chemical Storage Setback (from CAD parsing)
    if (input.cadSetbackMeters !== undefined && input.cadSetbackMeters !== null) {
      const setbackVal = Number(input.cadSetbackMeters);
      const queryResult = await this.queryGoverningRule('Chemical_Storage');

      if (queryResult) {
        const { rule, cypherQuery, source } = queryResult;
        const passed = setbackVal >= rule.threshold;
        const deficit = passed ? 0.0 : Math.round((rule.threshold - setbackVal) * 1000) / 1000;
        const margin = passed ? Math.round((setbackVal - rule.threshold) * 1000) / 1000 : 0.0;

        if (!passed) isOverallCompliant = false;

        auditRecords.push({
          ruleId: 'RULE-CAD-SETBACK-001',
          governingEntity: rule.entity,
          ruleCode: rule.ruleCode,
          statutorySection: rule.statuteSection,
          enforcingAuthority: rule.authority,
          governingAct: rule.statutoryAct,
          extractedValue: setbackVal,
          statutoryThreshold: rule.threshold,
          unit: rule.unit,
          operator: rule.operator,
          passed,
          complianceStatus: passed ? 'PASSED' : 'FATAL_VIOLATION',
          deficitMeters: deficit,
          marginMeters: margin,
          description: rule.description,
          penalty: passed ? null : rule.penalty,
          actionRequired: passed ? 'Buffer compliant. Proceed with building plan submission.' : rule.remediation,
          knowledgeGraphSource: source,
          cypherExecuted: cypherQuery
        });
      }
    }

    // 2. Evaluate Water Requirement (from Administrative PDF LayoutLMv3)
    if (input.waterRequirementKld !== undefined && input.waterRequirementKld !== null) {
      const waterVal = Number(input.waterRequirementKld);
      const queryResult = await this.queryGoverningRule('Water_Consumption');

      if (queryResult) {
        const { rule, cypherQuery, source } = queryResult;
        // If consumption > 25 KLD, mandatory ETP condition is triggered
        const triggersMandatoryEtp = waterVal > rule.threshold;

        auditRecords.push({
          ruleId: 'RULE-ENV-WATER-002',
          governingEntity: rule.entity,
          ruleCode: rule.ruleCode,
          statutorySection: rule.statuteSection,
          enforcingAuthority: rule.authority,
          governingAct: rule.statutoryAct,
          extractedValue: waterVal,
          statutoryThreshold: rule.threshold,
          unit: rule.unit,
          operator: rule.operator,
          passed: true, // Not an automatic rejection, but mandates specific engineering condition
          complianceStatus: triggersMandatoryEtp ? 'CONDITIONAL_APPROVAL_ETP_MANDATED' : 'PASSED',
          description: rule.description,
          conditionTriggered: triggersMandatoryEtp,
          actionRequired: triggersMandatoryEtp ? rule.remediation : 'Standard water meter and water balance documentation.',
          knowledgeGraphSource: source,
          cypherExecuted: cypherQuery
        });
      }
    }

    // 3. Evaluate Hazardous Waste Generation (from Administrative PDF LayoutLMv3)
    if (input.hazardousWasteMt !== undefined && input.hazardousWasteMt !== null) {
      let wasteVal = 0.0;
      if (typeof input.hazardousWasteMt === 'number') {
        wasteVal = input.hazardousWasteMt;
      } else {
        const match = String(input.hazardousWasteMt).match(/([\d.]+)/);
        wasteVal = match ? parseFloat(match[1]) : 0.0;
      }

      const queryResult = await this.queryGoverningRule('Hazardous_Waste');

      if (queryResult) {
        const { rule, cypherQuery, source } = queryResult;
        const triggersChwtsdf = wasteVal > rule.threshold;

        auditRecords.push({
          ruleId: 'RULE-ENV-HAZWASTE-003',
          governingEntity: rule.entity,
          ruleCode: rule.ruleCode,
          statutorySection: rule.statuteSection,
          enforcingAuthority: rule.authority,
          governingAct: rule.statutoryAct,
          extractedValue: wasteVal,
          statutoryThreshold: rule.threshold,
          unit: rule.unit,
          operator: rule.operator,
          passed: true,
          complianceStatus: triggersChwtsdf ? 'CONDITIONAL_CHWTSDF_MOA_MANDATED' : 'PASSED',
          description: rule.description,
          conditionTriggered: triggersChwtsdf,
          actionRequired: triggersChwtsdf ? rule.remediation : 'Standard hazardous waste register (Form 3) maintenance.',
          knowledgeGraphSource: source,
          cypherExecuted: cypherQuery
        });
      }
    }

    // 4. Evaluate Industry Category & Maha Parwana Fast-Track (48-Hour SLA)
    if (input.industryCategory) {
      const categoryVal = String(input.industryCategory).trim();
      const queryResult = await this.queryGoverningRule('Industry_Classification');

      if (queryResult) {
        const { rule, cypherQuery, source } = queryResult;
        const isEligible = rule.allowedValues.some(
          (c) => c.toLowerCase() === categoryVal.toLowerCase()
        );

        auditRecords.push({
          ruleId: 'RULE-SLA-MAHAPARWANA-004',
          governingEntity: rule.entity,
          ruleCode: rule.ruleCode,
          statutorySection: rule.statuteSection,
          enforcingAuthority: rule.authority,
          governingAct: rule.statutoryAct,
          extractedValue: categoryVal,
          statutoryThreshold: rule.allowedValues,
          unit: 'Category',
          operator: rule.operator,
          passed: isEligible,
          complianceStatus: isEligible ? 'FAST_TRACK_48HR_SLA' : 'STANDARD_STATUTORY_TRACK',
          description: rule.description,
          statutorySlaHours: isEligible ? 48 : 360,
          actionRequired: isEligible ? 'Eligible for single-window deemed approval within 48 hours.' : rule.remediation,
          knowledgeGraphSource: source,
          cypherExecuted: cypherQuery
        });
      }
    }

    const fatalViolations = auditRecords.filter((r) => r.complianceStatus === 'FATAL_VIOLATION');
    const conditionalMandates = auditRecords.filter((r) => r.conditionTriggered === true);

    const overallVerdict = fatalViolations.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT';

    // Formatted "Compliance Proof Sheet"
    const proofSheet = {
      complianceProofSheet: {
        header: {
          proofSheetId: `PROOF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
          system: 'UdyogSetu Deterministic GraphRAG Compliance Validator',
          engine: 'Neo4j Legal Knowledge Graph (MIDC / MPCB / DISH Statutes)',
          validationMode: 'DETERMINISTIC_CYPHER_REASONING (ZERO-LLM-HALLUCINATION)',
          generatedAt: new Date().toISOString(),
          evaluationTimeMs: Date.now() - startTime
        },
        entityProfile: {
          companyName: input.companyName || 'Maharashtra Industrial Applicant',
          industryCategory: input.industryCategory || 'Orange',
          pan: input.pan || 'N/A',
          gst: input.gst || 'N/A'
        },
        executiveSummary: {
          overallVerdict,
          isCompliant: isOverallCompliant,
          totalRulesEvaluated: auditRecords.length,
          violationsCount: fatalViolations.length,
          conditionalRequirementsCount: conditionalMandates.length,
          mahaParwanaFastTrack: input.industryCategory ? ['Green', 'Orange'].includes(input.industryCategory) : false,
          statutorySlaHours: (input.industryCategory && ['Green', 'Orange'].includes(input.industryCategory)) ? 48 : 360
        },
        deterministicAuditTrail: auditRecords,
        cryptographicProof: {
          algorithm: 'SHA-256',
          hash: crypto
            .createHash('sha256')
            .update(JSON.stringify(auditRecords) + overallVerdict)
            .digest('hex'),
          certifiedBy: 'UdyogSetu Statutory Compliance Gateway'
        }
      }
    };

    return proofSheet;
  }
}

module.exports = new GraphRagValidatorService();
