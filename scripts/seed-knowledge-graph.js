/**
 * Knowledge Graph Seeder for MIDC Legal & Regulatory Statutes
 * SIH26130 - UdyogSetu Deterministic GraphRAG Compliance Validator
 *
 * Seeds Neo4j with deterministic legal rules connecting:
 *  (RegulatoryEntity)-[:GOVERNED_BY]->(MIDCRule)-[:BELONGS_TO]->(StatuteAuthority)
 */
require('dotenv').config();
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'udyogsetu2026';

// Definitive Knowledge Graph Seed Data
const REGULATORY_KNOWLEDGE_BASE = [
  {
    entity: 'Chemical_Storage',
    category: 'Hazardous_Materials',
    authority: 'MIDC Special Planning Authority & DISH',
    act: 'MIDC Development Control Regulations (DCR) 2014 & Factories Act 1948',
    rule: {
      code: 'REQUIRES_SETBACK_MIN',
      operator: 'GTE', // Greater than or equal to
      threshold: 15.0,
      unit: 'meters',
      statuteSection: 'MIDC DCR Section 14.3 (Hazardous Chemical Buffer Norms)',
      description: 'Minimum physical distance required between hazardous chemical storage and plot boundary.',
      penalty: 'Immediate rejection of Building Plan & Fire Provisional NOC clearance.',
      remediation: 'Relocate chemical storage containment deeper into plot interior to satisfy minimum 15.00m setback.'
    }
  },
  {
    entity: 'Water_Consumption',
    category: 'Utilities_And_Effluent',
    authority: 'Maharashtra Pollution Control Board (MPCB)',
    act: 'Water (Prevention and Control of Pollution) Act, 1974',
    rule: {
      code: 'REQUIRES_ETP_TREATMENT',
      operator: 'LTE', // If exceeds threshold, triggers mandatory ETP installation
      threshold: 25.0,
      unit: 'KL/day',
      statuteSection: 'MPCB Water Consent Schedule II (Trade Effluent Treatment)',
      description: 'Industrial water consumption threshold beyond which an on-site Effluent Treatment Plant (ETP) is mandatory.',
      penalty: 'Refusal of Consent to Establish (CTE); stop-work notice.',
      remediation: 'Install primary/secondary ETP or obtain CETP connection quota from MIDC.'
    }
  },
  {
    entity: 'Hazardous_Waste',
    category: 'Hazardous_Waste_Management',
    authority: 'MPCB & MoEFCC',
    act: 'Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016',
    rule: {
      code: 'REQUIRES_CHWTSDF_MEMBERSHIP',
      operator: 'LTE',
      threshold: 5.0,
      unit: 'MT/annum',
      statuteSection: 'Hazardous Waste Rules 2016 Rule 6 (Mandatory Common Facility Siting)',
      description: 'Annual hazardous waste generation threshold requiring active membership with common facility (Taloja/Ranjangaon).',
      penalty: 'Withholding of Consent to Operate (CTO) and statutory fine under Environmental Protection Act.',
      remediation: 'Execute binding membership agreement with authorized Common Hazardous Waste Treatment Facility (CHWTSDF).'
    }
  },
  {
    entity: 'Industry_Classification',
    category: 'SLA_And_Fast_Track',
    authority: 'Directorate of Industries & MAITRI',
    act: 'Maharashtra Right to Public Services (MRTPS) Act, 2015 & Maha Parwana Initiative',
    rule: {
      code: 'MAHA_PARWANA_FAST_TRACK',
      operator: 'IN',
      allowedValues: ['Green', 'Orange'],
      statuteSection: 'Maha Parwana Single Window Government Resolution 2020',
      description: 'Categories eligible for fast-track deemed approvals within statutory 48-hour SLA.',
      penalty: 'Ineligibility for fast track; standard 360-hour (15-45 day) regulatory review.',
      remediation: 'Submit comprehensive EIA report for SEIAA approval if classified under Red category.'
    }
  }
];

async function seedKnowledgeGraph() {
  console.log('================================================================');
  console.log(`🌐 Connecting to Neo4j instance at: ${NEO4J_URI}`);
  console.log('================================================================');

  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    { connectionTimeout: 5000 }
  );

  let session;
  try {
    // Verify connectivity
    await driver.verifyConnectivity();
    console.log('✅ Successfully connected to Neo4j database engine.');

    session = driver.session({ database: 'neo4j' });

    // 1. Create Constraints and Indexes
    console.log('\n[Cypher] Setting up constraints and indexes...');
    await session.executeWrite((tx) =>
      tx.run(`
        CREATE CONSTRAINT unique_entity_name IF NOT EXISTS
        FOR (e:RegulatoryEntity) REQUIRE e.name IS UNIQUE
      `)
    );
    await session.executeWrite((tx) =>
      tx.run(`
        CREATE CONSTRAINT unique_rule_code IF NOT EXISTS
        FOR (r:MIDCRule) REQUIRE r.code IS UNIQUE
      `)
    );

    // 2. Clear old test graph
    console.log('[Cypher] Clearing existing regulatory rule nodes...');
    await session.executeWrite((tx) =>
      tx.run(`
        MATCH (e:RegulatoryEntity)-[rel:GOVERNED_BY]->(r:MIDCRule)
        DELETE rel, r, e
      `)
    );

    // 3. Seed entities, rules, and relationships
    console.log('[Cypher] Seeding MIDC legal statutes & regulatory rules...');
    for (const item of REGULATORY_KNOWLEDGE_BASE) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (e:RegulatoryEntity {name: $entity})
          ON CREATE SET e.category = $category, e.authority = $authority, e.statutoryAct = $act
          
          MERGE (r:MIDCRule {code: $ruleCode})
          ON CREATE SET 
            r.operator = $operator,
            r.threshold = $threshold,
            r.unit = $unit,
            r.statuteSection = $statuteSection,
            r.description = $description,
            r.penalty = $penalty,
            r.remediation = $remediation,
            r.allowedValues = $allowedValues

          MERGE (e)-[rel:GOVERNED_BY]->(r)
          ON CREATE SET rel.seededAt = datetime()
          `,
          {
            entity: item.entity,
            category: item.category,
            authority: item.authority,
            act: item.act,
            ruleCode: item.rule.code,
            operator: item.rule.operator,
            threshold: item.rule.threshold !== undefined ? item.rule.threshold : 0.0,
            unit: item.rule.unit || 'N/A',
            statuteSection: item.rule.statuteSection,
            description: item.rule.description,
            penalty: item.rule.penalty,
            remediation: item.rule.remediation,
            allowedValues: item.rule.allowedValues || []
          }
        )
      );
      console.log(`  🔗 Seeded: (:RegulatoryEntity {name: '${item.entity}'})-[:GOVERNED_BY]->(:MIDCRule {code: '${item.rule.code}', threshold: ${item.rule.threshold || item.rule.allowedValues}}`);
    }

    // 4. Verify graph counts
    const countResult = await session.executeRead((tx) =>
      tx.run(`
        MATCH (e:RegulatoryEntity)-[r:GOVERNED_BY]->(rule:MIDCRule)
        RETURN count(e) AS entityCount, count(rule) AS ruleCount
      `)
    );

    const record = countResult.records[0];
    const entityCount = record.get('entityCount').toNumber();
    const ruleCount = record.get('ruleCount').toNumber();

    console.log('\n================================================================');
    console.log(`🎉 Neo4j Knowledge Graph successfully seeded with ${entityCount} entities and ${ruleCount} MIDC rules.`);
    console.log('================================================================\n');

    return { success: true, entityCount, ruleCount };
  } catch (error) {
    console.warn(`[Knowledge Graph Notice]: Live Neo4j connection not reachable: ${error.message}`);
    console.log('[Notice] The GraphRAG engine automatically uses its embedded deterministic Knowledge Graph fallback for environments without live Neo4j containers.');
    return { success: false, error: error.message };
  } finally {
    if (session) await session.close();
    await driver.close();
  }
}

// Export seed data and runner
module.exports = {
  seedKnowledgeGraph,
  REGULATORY_KNOWLEDGE_BASE
};

if (require.main === module) {
  seedKnowledgeGraph().then(() => process.exit(0));
}
