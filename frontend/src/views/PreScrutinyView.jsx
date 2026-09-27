import React, { useState } from 'react';
import {
  FileCheck2,
  UploadCloud,
  FileCode,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';
const AI_SERVICE_URL = 'http://127.0.0.1:8000';

export default function PreScrutinyView() {
  // CAD State
  const [cadFile, setCadFile] = useState(null);
  const [cadResult, setCadResult] = useState(null);
  const [cadLoading, setCadLoading] = useState(false);
  const [cadError, setCadError] = useState(null);

  // PDF State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfResult, setPdfResult] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Compliance Proof Sheet State
  const [proofSheet, setProofSheet] = useState(null);
  const [validatingCompliance, setValidatingCompliance] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Upload Handlers
  const handleCadUpload = async (file) => {
    if (!file) return;
    setCadFile(file);
    setCadLoading(true);
    setCadError(null);
    setCadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/validate-cad`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCadResult(response.data);
    } catch (err) {
      console.error('CAD Validation Error:', err);
      setCadError(err.response?.data?.detail || err.message || 'CAD parsing failed.');
    } finally {
      setCadLoading(false);
    }
  };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    setPdfFile(file);
    setPdfLoading(true);
    setPdfError(null);
    setPdfResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/extract-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPdfResult(response.data);
    } catch (err) {
      console.error('PDF Extraction Error:', err);
      setPdfError(err.response?.data?.detail || err.message || 'PDF extraction failed.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Presets
  const handleSimulateNonCompliantCad = () => {
    setCadLoading(true);
    setCadError(null);
    setCadResult({
      success: false,
      filename: 'factory_layout_chakan_v1_violation.dxf',
      compliance_status: 'NON_COMPLIANT',
      is_compliant: false,
      shortest_setback_meters: 10.0,
      minimum_required_meters: 15.0,
      deficit_meters: 5.0,
      regulation_reference: 'MIDC DCR Section 14.2 & NBC 2016 Fire Safety Code',
      compliance_error: 'Chemical storage polyline setback 10.00m is less than statutory 15.00m requirement.',
      spatial_metadata: {
        plot_boundary_layer: 'PLOT_BOUNDARY',
        storage_layer: 'CHEMICAL_STORAGE',
        closest_boundary_vertex: [350.0, 100.0],
        closest_storage_vertex: [350.0, 110.0]
      },
      timestamp: new Date().toISOString()
    });
    setCadLoading(false);
  };

  const handleSimulateCompliantCad = () => {
    setCadLoading(true);
    setCadError(null);
    setCadResult({
      success: true,
      filename: 'factory_layout_chakan_v2_rectified.dxf',
      compliance_status: 'COMPLIANT',
      is_compliant: true,
      shortest_setback_meters: 20.0,
      minimum_required_meters: 15.0,
      deficit_meters: 0.0,
      regulation_reference: 'MIDC DCR Section 14.2 & NBC 2016 Fire Safety Code',
      compliance_error: null,
      spatial_metadata: {
        plot_boundary_layer: 'PLOT_BOUNDARY',
        storage_layer: 'CHEMICAL_STORAGE',
        closest_boundary_vertex: [350.0, 100.0],
        closest_storage_vertex: [350.0, 120.0]
      },
      timestamp: new Date().toISOString()
    });
    setCadLoading(false);
  };

  const handleSimulatePdfExtraction = () => {
    setPdfLoading(true);
    setPdfError(null);
    setPdfResult({
      success: true,
      filename: 'MPCB_Consent_To_Establish_Form1.pdf',
      model_name: 'microsoft/layoutlmv3-base',
      pipeline: 'LayoutLMv3 Multimodal Token Classification',
      inference_time_ms: 38.4,
      extracted_fields: {
        'Industry Category': 'Orange',
        'Water Requirement (KL/day)': 45.5,
        'Hazardous Waste Volume': '12.8 MT/annum (Spent Solvent / Sludge)'
      },
      regulatory_context: {
        state_authority: 'Maharashtra Pollution Control Board (MPCB)',
        maha_parwana_fast_track: true,
        statutory_sla_hours: 48,
        calculated_risk_index: 40
      }
    });
    setPdfLoading(false);
  };

  // Generate Proof Sheet
  const handleGenerateProofSheet = async () => {
    setValidatingCompliance(true);
    try {
      const setback = cadResult ? cadResult.shortest_setback_meters : 10.0;
      const category = pdfResult?.extracted_fields?.['Industry Category'] || 'Orange';
      const water = pdfResult?.extracted_fields?.['Water Requirement (KL/day)'] || 45.5;

      const payload = {
        companyName: 'Maharashtra Precision Forgings Ltd',
        industryCategory: category,
        pan: 'AABCU9603R',
        gst: '27AABCU9603R1ZM',
        calculatedSetbackMeters: setback,
        waterRequirementKlDay: water,
        hazardousWasteMtAnnum: 12.8
      };

      const response = await axios.post(`${BACKEND_URL}/api/validate-compliance`, payload);
      if (response.data?.success) {
        setProofSheet(response.data.data.complianceProofSheet);
      }
    } catch (err) {
      console.error('Proof Sheet Validation Error:', err);
    } finally {
      setValidatingCompliance(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
            Cognitive Pre-Scrutiny & CAD Verification
          </h1>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            fontWeight: '600'
          }}>
            ezdxf + LayoutLMv3
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Validates 15m chemical storage setback distance in AutoCAD DXF files and extracts structured MPCB parameters.
        </p>
      </div>

      {/* Preset Action Strip */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
          <Sparkles size={15} color="#1d4ed8" />
          <span>Quick Scrutiny Presets:</span>
        </div>
        <button
          onClick={handleSimulateNonCompliantCad}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#fff7ed', // Alert Orange tint
            border: '1px solid #fed7aa',
            color: '#c2410c',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Load 10m Setback Violation (5m Deficit)
        </button>
        <button
          onClick={handleSimulateCompliantCad}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#ecfdf5', // Compliance Green tint
            border: '1px solid #a7f3d0',
            color: '#059669',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Load 20m Compliant CAD (5m Buffer)
        </button>
        <button
          onClick={handleSimulatePdfExtraction}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            color: '#0f172a',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Parse MPCB CTE Form-1 PDF
        </button>
      </div>

      {/* Two Column Layout: CAD Engine & PDF Extractor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* CAD Scrutiny Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCode size={18} color="#1d4ed8" />
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                  Vector-Geometric CAD Scrutiny
                </h2>
              </div>
              <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                MIDC DCR Sec 14.2
              </span>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
              Calculates shortest euclidean distance between polylines on <code>PLOT_BOUNDARY</code> and <code>CHEMICAL_STORAGE</code> layers. Minimum setback: <strong>15.0m</strong>.
            </p>

            {/* Drag & Drop CAD Upload Area */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '22px',
              borderRadius: '8px',
              border: '2px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginBottom: '16px'
            }}>
              <UploadCloud size={28} color="#1d4ed8" style={{ marginBottom: '6px' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                {cadFile ? cadFile.name : 'Upload AutoCAD DXF File (.dxf)'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Drag & drop or click to select
              </span>
              <input
                type="file"
                accept=".dxf"
                style={{ display: 'none' }}
                onChange={(e) => handleCadUpload(e.target.files[0])}
              />
            </label>

            {cadLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontSize: '12px', padding: '8px 0' }}>
                <RefreshCw size={15} className="animate-spin" />
                <span>Computing vector geometry via ezdxf...</span>
              </div>
            )}

            {cadError && (
              <div style={{ padding: '10px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', color: '#c2410c', fontSize: '12px' }}>
                {cadError}
              </div>
            )}

            {/* CAD Result Inspection with Rylo Alert Orange / Compliance Green */}
            {cadResult && (
              <div style={{
                borderRadius: '8px',
                padding: '14px',
                backgroundColor: cadResult.is_compliant ? '#ecfdf5' : '#fff7ed', // Compliance Green or Alert Orange
                border: cadResult.is_compliant ? '1px solid #a7f3d0' : '1px solid #fed7aa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {cadResult.is_compliant ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : (
                      <AlertTriangle size={16} color="#f97316" />
                    )}
                    <span style={{ fontSize: '13px', fontWeight: '700', color: cadResult.is_compliant ? '#059669' : '#c2410c' }}>
                      {cadResult.compliance_status}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                    {cadResult.shortest_setback_meters.toFixed(2)}m / 15.00m
                  </span>
                </div>

                {!cadResult.is_compliant && (
                  <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '4px', lineHeight: '1.4' }}>
                    <strong>Action Required:</strong> Deficit of {cadResult.deficit_meters.toFixed(2)} meters below statutory threshold.
                  </div>
                )}

                {cadResult.is_compliant && (
                  <div style={{ fontSize: '12px', color: '#065f46', marginTop: '4px' }}>
                    ✓ Statutory setback satisfied with { (cadResult.shortest_setback_meters - 15.0).toFixed(2) }m safety margin.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PDF LayoutLMv3 Extractor Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#1d4ed8" />
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                  LayoutLMv3 Administrative PDF Scrutiny
                </h2>
              </div>
              <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                MPCB Form-1
              </span>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
              Extracts <code>Industry Category</code>, <code>Water Requirement</code>, and <code>Hazardous Waste</code> via multimodal token classification.
            </p>

            {/* Drag & Drop PDF Upload Area */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '22px',
              borderRadius: '8px',
              border: '2px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginBottom: '16px'
            }}>
              <UploadCloud size={28} color="#1d4ed8" style={{ marginBottom: '6px' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                {pdfFile ? pdfFile.name : 'Upload Project PDF (.pdf)'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Drag & drop or click to select
              </span>
              <input
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={(e) => handlePdfUpload(e.target.files[0])}
              />
            </label>

            {pdfLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontSize: '12px', padding: '8px 0' }}>
                <RefreshCw size={15} className="animate-spin" />
                <span>Running LayoutLMv3 multimodal inference...</span>
              </div>
            )}

            {pdfError && (
              <div style={{ padding: '10px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', color: '#c2410c', fontSize: '12px' }}>
                {pdfError}
              </div>
            )}

            {/* PDF Extractions Display */}
            {pdfResult && (
              <div style={{
                borderRadius: '8px',
                padding: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Extracted Entities
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Industry Category:</span>
                    <strong style={{ color: '#0f172a' }}>{pdfResult.extracted_fields?.['Industry Category']}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Water Requirement:</span>
                    <strong style={{ color: '#1d4ed8' }}>{pdfResult.extracted_fields?.['Water Requirement (KL/day)']} KL/day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Hazardous Waste:</span>
                    <span style={{ color: '#0f172a', fontWeight: '500', maxWidth: '60%', textAlign: 'right' }}>{pdfResult.extracted_fields?.['Hazardous Waste Volume']}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deterministic GraphRAG Compliance Proof Sheet Container */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#1d4ed8" />
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Deterministic Compliance Proof Sheet
              </h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Submits extracted CAD metrics to Neo4j GraphRAG for deterministic Cypher validation.
            </p>
          </div>

          <button
            onClick={handleGenerateProofSheet}
            disabled={validatingCompliance}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#1d4ed8', // Trust Blue
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              cursor: validatingCompliance ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
            }}
          >
            {validatingCompliance ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Running Graph Query...</span>
              </>
            ) : (
              <>
                <FileCheck2 size={15} />
                <span>Generate Proof Sheet</span>
              </>
            )}
          </button>
        </div>

        {/* Render Proof Sheet When Generated */}
        {proofSheet && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
            {/* Verdict Banner using Rylo Emerald / Alert Orange */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '8px',
              backgroundColor: proofSheet.overallVerdict === 'COMPLIANT' ? '#ecfdf5' : '#fff7ed',
              border: proofSheet.overallVerdict === 'COMPLIANT' ? '1px solid #a7f3d0' : '1px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: proofSheet.overallVerdict === 'COMPLIANT' ? '#059669' : '#c2410c'
                  }}>
                    VERDICT: {proofSheet.overallVerdict}
                  </span>
                  <span style={{ fontSize: '11px', backgroundColor: '#ffffff', padding: '2px 8px', borderRadius: '4px', color: '#64748b', fontFamily: 'monospace', border: '1px solid #e2e8f0' }}>
                    {proofSheet.header?.proofSheetId}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Engine: {proofSheet.header?.engine}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                <div>Evaluated in <strong>{proofSheet.header?.evaluationTimeMs}ms</strong></div>
                <div style={{ fontFamily: 'monospace', marginTop: '2px' }}>
                  SHA-256: {proofSheet.cryptographicAuditHash?.slice(0, 16)}...
                </div>
              </div>
            </div>

            {/* Rule Verification Table */}
            <div style={{ overflowX: 'auto', marginBottom: '18px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px' }}>Entity</th>
                    <th style={{ padding: '8px 12px' }}>Rule Code</th>
                    <th style={{ padding: '8px 12px' }}>Extracted</th>
                    <th style={{ padding: '8px 12px' }}>Threshold</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                    <th style={{ padding: '8px 12px' }}>Statute Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {proofSheet.ruleEvaluations?.map((rule, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>
                        {rule.entity}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                        {rule.ruleCode}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                        {rule.extractedValue} {rule.unit}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569', fontFamily: 'monospace' }}>
                        {rule.operator} {rule.statutoryThreshold} {rule.unit}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          backgroundColor: rule.passed ? '#ecfdf5' : '#fff7ed',
                          color: rule.passed ? '#059669' : '#c2410c',
                          border: rule.passed ? '1px solid #a7f3d0' : '1px solid #fed7aa'
                        }}>
                          {rule.passed ? 'PASS' : 'ACTION REQUIRED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748b' }}>
                        {rule.citation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actionable Error Remediation Box - Rylo Alert Orange */}
            {proofSheet.actionableRemediation && proofSheet.actionableRemediation.length > 0 && (
              <div style={{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldAlert size={16} color="#f97316" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#c2410c' }}>
                    Remediation Required Prior to Portal Submission
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {proofSheet.actionableRemediation.map((rem, idx) => (
                    <div key={idx} style={{ fontSize: '12px', color: '#9a3412', lineHeight: '1.4' }}>
                      <div style={{ fontWeight: '700' }}>
                        {rem.rule}: {rem.action}
                      </div>
                      <div style={{ marginTop: '2px', color: '#475569' }}>
                        {rem.details}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSON Toggle */}
            <div>
              <button
                onClick={() => setShowJson(!showJson)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{showJson ? 'Hide Proof Sheet JSON' : 'Inspect Proof Sheet JSON'}</span>
                {showJson ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showJson && (
                <pre style={{
                  marginTop: '10px',
                  padding: '14px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  fontSize: '11px',
                  overflowX: 'auto',
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify(proofSheet, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
