# UdyogSetu (उद्योगसेतु)
### Intelligent Regulatory Compliance & Cognitive Pre-Scrutiny Middleware for Maharashtra Industrial Approvals (MAITRI 2.0 / Maha Parwana)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.18-008CC1?logo=neo4j&logoColor=white)](https://neo4j.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🏛️ Executive Summary

**UdyogSetu** is an enterprise-grade regulatory planning and cognitive compliance middleware platform designed to eliminate the cognitive bottleneck in the Maharashtra industrial approval ecosystem. 

Under the Government of Maharashtra's **Maha Parwana** initiative, statutory bodies are mandated to process Green and Orange category industrial clearances within **48 hours**, while standard applications under the **Maharashtra Right to Public Services (MRTPS) Act, 2015** must be completed within **30 days**. Human officers face massive backlogs verifying complex AutoCAD drawings, chemical storage setbacks, environmental parameters, and cross-departmental prerequisites.

UdyogSetu acts as an **algorithmic pre-scrutiny compiler**:
1. **Zero-Entry Onboarding**: Autonomous verification of PAN, GSTIN, and DigiLocker incorporation records via API Setu Sandbox.
2. **Topological Blockers Engine**: Directed Acyclic Graph (DAG) computation via Kahn's Algorithm to sequence statutory approvals across MIDC, MPCB, DISH, and Fire authorities.
3. **Vector CAD Geometric Scrutiny**: Sub-millimeter euclidean polyline distance calculation checking against the mandatory 15-meter chemical storage setback (MIDC DCR Section 14.2 & NBC 2016 Part 4).
4. **Cognitive Multimodal Document Processing**: HuggingFace LayoutLMv3 token classification extracting structured water, waste, and pollution indices from administrative PDFs.
5. **Deterministic GraphRAG Validator**: Cypher rule engine querying a localized Neo4j legal knowledge graph to generate tamper-evident **Compliance Proof Sheets** with SHA-256 cryptographic audit hashes.
6. **MRTPS Act SLA Enforcer**: Automated daily cron scheduler tracking statutory time limits and issuing **Statutory Deemed Approval Certificates** with appellate escalation.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |         UdyogSetu React SaaS          |
                                  |    (Clean White & Slate / Rylo UI)    |
                                  |         http://localhost:3000         |
                                  +-------------------+-------------------+
                                                      |
                                                      | REST / Multipart
                                                      v
                                  +---------------------------------------+
                                  |       Node.js / Express Backend       |
                                  |         http://localhost:5000         |
                                  +---------+-------------------+---------+
                                            |                   |
                   +------------------------+                   +------------------------+
                   |                                                                     |
                   v                                                                     v
  +---------------------------------+                                   +---------------------------------+
  |      API Setu Sandbox Gateway   |                                   |    Python FastAPI Microservice  |
  |  - MCA-21 DigiLocker Records    |                                   |       http://localhost:8000     |
  |  - GSTN Taxpayer Verification   |                                   +----------------+----------------+
  +---------------------------------+                                                    |
                   |                                                    +----------------+----------------+
                   v                                                    |                                 |
  +---------------------------------+                                   v                                 v
  |      MongoDB Document Store     |                  +--------------------------------+ +-------------------------------+
  |  - BusinessProfile              |                  |  ezdxf Vector CAD Engine       | | LayoutLMv3 Multimodal AI      |
  |  - ApplicationState             |                  |  - Shortest Polyline Distance  | | - Industry Category (P.I.)    |
  |  - User Entity                  |                  |  - 15m Setback Enforcement     | | - Water Requirement (KL/day)  |
  +---------------------------------+                  +----------------+---------------+ | - Hazardous Waste Volume      |
                   |                                                    |                 +---------------+---------------+
                   v                                                    +----------------+----------------+
  +---------------------------------+                                                    | Extracted JSON
  |    MRTPS Act SLA Enforcer       |                                                    v
  |  - Daily node-cron Scanner      |                                   +---------------------------------+
  |  - 48h (Green) / 30d (Standard) |                                   |   Deterministic GraphRAG Engine |
  |  - Deemed Approval Certificate  | <-------------------------------- |   - Neo4j Knowledge Graph       |
  |  - Appellate Escalation         |                                   |   - Cypher Deterministic Rules  |
  +---------------------------------+                                   |   - Compliance Proof Sheet JSON |
                                                                        +---------------------------------+
```

---

## 🎨 Rylo Color System & UI Strategy

The interface strictly implements the **Rylo Strategy** designed for high-stakes government and regulatory portals:

* **Clean White (`#FFFFFF`)**: Primary background for cards, tables, and document containers. Ensures complex CAD reports and checklists remain the focal point.
* **High-Contrast Dark (`#0F172A`)**: Deep Slate for WCAG AAA typography across headers, data fields, and statutory citations.
* **Trust Blue (`#1D4ED8`)**: Royal Blue for primary branding, active navigation indicators, and secure API Setu verification actions.
* **Compliance Green (`#10B981`)**: Emerald for positive actions, "Validated" nodes, "COMPLIANT" proof sheets, and "Deemed Approved" certificates.
* **Alert Orange (`#F97316`)**: Targeted friction identifier. Flags CAD setback deficits ($< 15\,\text{m}$) and pending SLA breaches without inducing red panic.
* **Surface Gray (`#F1F5F9`)**: Canvas backdrop providing visual hierarchy without visual clutter.
* **Subtle Borders (`#E2E8F0`)**: Hairline borders defining content sections cleanly.

---

## 🚀 Key Modules & Capabilities

### 1. Zero-Entry Entity Verification Gateway
* **Route**: `POST /api/verify-business`
* Autonomous lookup against API Setu Sandbox (`https://sandbox.api-setu.in`).
* Fetches MCA-21 DigiLocker Certificate of Incorporation (CIN, RoC, authorized directors) and GSTN taxpayer status.
* Auto-assigns MSME category (Micro, Small, Medium) and Maha Parwana 48-hour SLA qualification based on investment size and pollution classification.

### 2. Topological Regulatory Dependency Engine
* **Route**: `GET /api/regulatory/dependency-graph?category={Green|Orange|Red}`
* Implements Kahn's Algorithm to construct a Directed Acyclic Graph (DAG) verifying deterministic zero-cycle execution.
* Sequentially chains approvals:
  $$\text{MPCB CTE} \longrightarrow \text{MIDC Plan} \longrightarrow \text{Fire NOC} \longrightarrow \text{DISH Factory License}$$
* Computes exact critical path timelines (70 days for Green, 105 days for Orange, 255 days for Red with EIA SEIAA review) and exposes parallel engineering streams.

### 3. Vector CAD Geometric Pre-Scrutiny Engine
* **Route**: `POST /api/validate-cad` (FastAPI Port 8000)
* Employs `ezdxf` to parse `.dxf` CAD drawings.
* Identifies boundary entities on `PLOT_BOUNDARY` and chemical storage perimeters on `CHEMICAL_STORAGE`.
* Calculates minimum euclidean point-to-segment distance:
  $$d_{\min} = \min_{p \in \text{Boundary}, q \in \text{Storage}} \|p - q\|$$
* Flags non-compliance if $d_{\min} < 15.0\,\text{meters}$ per MIDC DCR Section 14.2 & NBC 2016 Fire Safety Code, reporting the exact deficit in meters.

### 4. LayoutLMv3 Multimodal Document Extractor
* **Route**: `POST /api/extract-pdf` (FastAPI Port 8000)
* Multimodal token classification pipeline extracting key statutory fields from administrative PDFs (MPCB Form-1 / CTE applications):
  1. *Industry Category* (Green / Orange / Red)
  2. *Water Requirement (KL/day)*
  3. *Hazardous Waste Volume (MT/annum)*
* Emits bounding boxes, confidence scores, and statutory routing parameters.

### 5. Deterministic GraphRAG Compliance Validator
* **Route**: `POST /api/validate-compliance`
* Queries a Neo4j Knowledge Graph via Cypher statements:
  ```cypher
  MATCH (e:RegulatoryEntity {name: 'Chemical_Storage'})-[:GOVERNED_BY]->(r:ComplianceRule {ruleCode: 'REQUIRES_SETBACK_MIN'})
  RETURN r.thresholdValue AS statutoryMinSetback, r.legalCitation AS citation;
  ```
* Evaluates extracted metrics without generative LLM hallucinations.
* Returns a verifiable **Compliance Proof Sheet** containing:
  * Cryptographic SHA-256 audit hash
  * Pass/Fail rule breakdown
  * Actionable remediation instructions for non-compliant parameters

### 6. MRTPS Act 2015 Statutory SLA Enforcer
* **Route**: `POST /api/applications/trigger-sla-scan`
* Automated daily `node-cron` job scanning pending applications:
  * **48 Hours** statutory limit for Green Category under Maha Parwana.
  * **30 Days** (720 Hours) statutory limit for Orange and Red Categories.
* Automatically transitions breached applications to **`Deemed Approved`** (Section 8 of MRTPS Act 2015).
* Dispatches escalation notice to the **First Appellate Authority** (Member Secretary, MPCB) and renders a printable Statutory Deemed Approval Certificate.

---

## 📦 Project Structure

```
d:/sih/
├── ai_service/                      # Python FastAPI Microservice
│   ├── cad_scrutiny.py             # Vector CAD 15m setback ezdxf engine
│   ├── main.py                     # LayoutLMv3 & CAD API endpoints
│   ├── requirements.txt            # Python dependencies
│   └── test_ai_service.py          # 11 Unit & Integration tests
├── config/
│   └── db.js                       # MongoDB connection with auto-reconnect
├── controllers/
│   ├── apiSetuController.js        # Zero-entry onboarding controller
│   ├── applicationStateController.js # MRTPS application tracker
│   ├── complianceProofController.js# GraphRAG validation controller
│   └── regulatoryEngineController.js # Topological DAG controller
├── frontend/                       # Vite + React 19 Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top breadcrumbs & live indicators
│   │   │   ├── RegulatoryApprovalNode.jsx # React Flow custom node
│   │   │   ├── Sidebar.jsx         # SaaS navigation sidebar
│   │   │   └── TopologicalDependencyTree.jsx # React Flow interactive DAG
│   │   ├── views/
│   │   │   ├── ApprovalsDAGView.jsx# Approval sequence viewer
│   │   │   ├── BusinessProfileView.jsx # Zero-entry form & DigiLocker
│   │   │   ├── DashboardView.jsx   # Metrics, clearances & quick actions
│   │   │   ├── GovernanceView.jsx  # MRTPS enforcer & Deemed certificates
│   │   │   └── PreScrutinyView.jsx # CAD & PDF pre-scrutiny workspace
│   │   ├── App.jsx                 # Workspace root with view router
│   │   └── index.css               # Rylo color palette & scrollbars
│   ├── package.json
│   └── vite.config.js
├── models/
│   ├── ApplicationState.js         # Mongoose schema for MRTPS applications
│   ├── BusinessProfile.js          # Mongoose schema for verified businesses
│   └── User.js                     # User authentication model
├── routes/
│   ├── applicationRoutes.js        # /api/applications endpoints
│   ├── complianceRoutes.js         # /api/compliance endpoints
│   ├── regulatoryRoutes.js         # /api/regulatory endpoints
│   └── verificationRoutes.js       # /api/verification endpoints
├── scripts/
│   └── seed-knowledge-graph.js     # Neo4j Cypher seeding script
├── services/
│   ├── apiSetuService.js           # API Setu Sandbox client & mock fallback
│   ├── graphRagValidatorService.js # Deterministic Cypher rule validator
│   ├── mrtpsCronScheduler.js       # Statutory SLA daily cron scheduler
│   └── topologicalEngineService.js # Kahn's algorithm DAG compiler
├── docker-compose.yml              # Multi-container orchestration (Neo4j, Mongo, Node, Python)
├── package.json                    # Root backend scripts & dependencies
├── server.js                       # Express server initialization & routes
├── test-api.js                     # 55 API & DAG backend tests
├── test-compliance.js              # 30 GraphRAG compliance tests
└── test-mrtps.js                   # 21 MRTPS SLA enforcer tests
```

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
* **Node.js**: v18.0 or higher
* **Python**: v3.11 with `pip`
* **MongoDB**: Running locally at `mongodb://127.0.0.1:27017/udyogsetu`
* **Neo4j** (Optional for live Cypher; embedded fallback active): `bolt://localhost:7687`

---

### Step 1: Install Backend Dependencies
```bash
cd d:\sih
npm install
```

### Step 2: Install Python Microservice Dependencies
```bash
cd d:\sih\ai_service
py -3.11 -m pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd d:\sih\frontend
npm install
```

---

### Step 4: Run the Microservices

#### Terminal 1 — Node.js Express Backend (Port 5000)
```bash
cd d:\sih
npm start
```
*Health Check*: `http://localhost:5000/health`

#### Terminal 2 — Python FastAPI Cognitive Service (Port 8000)
```bash
cd d:\sih\ai_service
py -3.11 -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*Health Check*: `http://127.0.0.1:8000/health`

#### Terminal 3 — React Frontend Dev Server (Port 3000)
```bash
cd d:\sih\frontend
npm run dev
```
*Application*: `http://localhost:3000`

---

## 🧪 Comprehensive Test Suite

The codebase includes **117 automated tests** covering unit calculations, API endpoints, topological sorts, and SLA governance.

### Run All Backend Tests (106 Tests)
```bash
cd d:\sih
npm test
```
* `test-api.js`: 55 / 55 Passed (Zero-Entry onboarding, Kahn DAG, category endpoints)
* `test-compliance.js`: 30 / 30 Passed (10m setback violation, 20m compliant buffer, SHA-256 hashes)
* `test-mrtps.js`: 21 / 21 Passed (48h Green SLA breach, Deemed Approval transitions, Appellate escalation)

### Run Python AI Microservice Tests (11 Tests)
```bash
cd d:\sih
py -3.11 ai_service\test_ai_service.py
```
* `test_ai_service.py`: 11 / 11 Passed (LayoutLMv3 token inference, ezdxf polyline setback distance, 15m MIDC DCR violation detection)

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Backend and MongoDB connectivity health check |
| `POST` | `/api/verify-business` | Zero-entry entity onboarding via API Setu Sandbox |
| `GET` | `/api/verification/profiles` | Fetch all verified business profiles |
| `GET` | `/api/regulatory/dependency-graph` | Compute topological approval DAG (`?category=Green\|Orange\|Red`) |
| `POST` | `/api/validate-compliance` | Generate deterministic GraphRAG Compliance Proof Sheet |
| `GET` | `/api/compliance/rule/:entityName` | Lookup governing rule by entity name |
| `POST` | `/api/applications/submit` | Submit an industrial permit application |
| `GET` | `/api/applications` | Query all active applications with SLA metrics |
| `POST` | `/api/applications/trigger-sla-scan` | Manually trigger statutory MRTPS SLA enforcement scan |
| `POST` | `http://127.0.0.1:8000/validate-cad` | ezdxf vector CAD setback geometric scrutiny |
| `POST` | `http://127.0.0.1:8000/extract-document` | LayoutLMv3 administrative PDF multimodal extraction |

---

## 📜 Regulatory Citations & Compliance Foundations

* **Maha Parwana Initiative (Government of Maharashtra)**: 48-hour statutory clearance window for designated industries.
* **Maharashtra Right to Public Services (MRTPS) Act, 2015**: Section 8 statutory deemed approvals for unadjudicated applications.
* **MIDC Development Control Regulations (DCR) Section 14.2**: 15-meter minimum statutory setback between plot boundary and chemical storage.
* **National Building Code (NBC) 2016 Part 4**: Fire and life safety clearances for industrial layouts.
* **Water (Prevention and Control of Pollution) Act, 1974 & Air Act, 1981**: MPCB Consent to Establish (CTE) & Consent to Operate (CTO).

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
