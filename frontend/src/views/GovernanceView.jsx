import React, { useState, useEffect } from 'react';
import {
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  Award,
  ChevronRight,
  X
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

export default function GovernanceView() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // New Application Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newApp, setNewApp] = useState({
    companyName: 'Sahyadri Specialty Chemicals Ltd',
    department: 'Pollution_Control',
    industryCategory: 'Green',
    documentUrl: 'https://storage.udyogsetu.maharashtra.gov.in/docs/cte_app_2026.pdf',
    hoursAgo: 50 // Allows immediate testing of 48h SLA breach
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/applications`);
      if (res.data?.success) {
        setApplications(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/applications/trigger-sla-scan`);
      if (res.data?.success) {
        setScanResult(res.data);
        await fetchApplications();
      }
    } catch (err) {
      console.error('Scan trigger error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submissionDate = new Date(Date.now() - (newApp.hoursAgo * 3600 * 1000)).toISOString();
      await axios.post(`${BACKEND_URL}/api/applications/submit`, {
        companyName: newApp.companyName,
        department: newApp.department,
        industryCategory: newApp.industryCategory,
        documentUrl: newApp.documentUrl,
        submissionDate: submissionDate
      });
      setShowNewModal(false);
      await fetchApplications();
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
            MRTPS Act Statutory SLA Enforcer
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
            Section 8 Deemed Approval
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Enforces statutory deadlines (48h for Green, 30 days for others) with automatic Deemed Approvals and Appellate escalation.
        </p>
      </div>

      {/* Control Action Strip */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Green Category SLA
            </div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#059669' }}>
              48 Hours (Maha Parwana)
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Standard Category SLA
            </div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
              30 Days (720 Hours)
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Appellate Authority
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8' }}>
              Member Secretary, MPCB
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={14} color="#1d4ed8" />
            <span>Submit Application</span>
          </button>

          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              backgroundColor: scanning ? '#93c5fd' : '#1d4ed8', // Trust Blue
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              cursor: scanning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
            }}
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            <span>{scanning ? 'Enforcing Scan...' : 'Trigger SLA Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scan Results Notification Banner */}
      {scanResult && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          backgroundColor: '#ecfdf5', // Compliance Green tint
          border: '1px solid #a7f3d0',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span style={{ fontSize: '13px', color: '#065f46', fontWeight: '600' }}>
              MRTPS Scan Executed: {scanResult.results?.breachesFound || 0} statutory breach(es) transitioned to 'Deemed Approved'.
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Scanned {scanResult.results?.totalPendingScanned || 0} applications
          </span>
        </div>
      )}

      {/* Applications Table Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            Application Registry & Escalation Logs
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {applications.length} Total Records
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Application Number</th>
                <th style={{ padding: '10px 12px' }}>Enterprise Name</th>
                <th style={{ padding: '10px 12px' }}>Department</th>
                <th style={{ padding: '10px 12px' }}>Category / SLA</th>
                <th style={{ padding: '10px 12px' }}>Submission</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Escalation</th>
                <th style={{ padding: '10px 12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const subDate = new Date(app.submissionDate);
                const elapsedHours = Math.round((Date.now() - subDate.getTime()) / (3600 * 1000));
                const slaLimit = app.industryCategory === 'Green' ? 48 : 720;
                const isBreached = elapsedHours > slaLimit;

                return (
                  <tr key={app._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: '600', fontFamily: 'monospace', fontSize: '12px' }}>
                      {app.applicationNumber}
                    </td>
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: '500' }}>
                      {app.companyName}
                    </td>
                    <td style={{ padding: '12px', color: '#475569' }}>
                      {app.department?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          backgroundColor: app.industryCategory === 'Green' ? '#ecfdf5' : '#fff7ed',
                          color: app.industryCategory === 'Green' ? '#065f46' : '#c2410c',
                          border: app.industryCategory === 'Green' ? '1px solid #a7f3d0' : '1px solid #fed7aa'
                        }}>
                          {app.industryCategory}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          ({slaLimit}h)
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                      <div>{subDate.toLocaleDateString()}</div>
                      <div style={{ fontSize: '11px', color: isBreached ? '#ea580c' : '#64748b', fontWeight: isBreached ? '600' : '400' }}>
                        Elapsed: {elapsedHours}h
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontWeight: '700',
                        backgroundColor: app.status === 'Deemed Approved' ? '#ecfdf5' : '#eff6ff',
                        color: app.status === 'Deemed Approved' ? '#047857' : '#1d4ed8',
                        border: app.status === 'Deemed Approved' ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      {app.escalatedToAppellate ? (
                        <div style={{ color: '#ea580c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={13} color="#f97316" />
                          <span>Appellate Escalated</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Within Legal Limit</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {app.status === 'Deemed Approved' ? (
                        <button
                          onClick={() => setSelectedCertificate(app)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#059669',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Award size={13} />
                          <span>Certificate</span>
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>In Review</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deemed Approval Certificate Modal - Clean White with Emerald Accent */}
      {selectedCertificate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px solid #10b981', // Compliance Green
            borderRadius: '12px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <Award size={24} color="#10b981" />
              </div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                GOVERNMENT OF MAHARASHTRA
              </h2>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#059669' }}>
                STATUTORY DEEMED APPROVAL CERTIFICATE
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Section 8 of Maharashtra Right to Public Services Act 2015
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Certificate No:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                  CERT-MRTPS-{selectedCertificate.applicationNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Enterprise Name:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>
                  {selectedCertificate.companyName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Clearance:</span>
                <span style={{ color: '#1d4ed8', fontWeight: '600' }}>
                  {selectedCertificate.department?.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Statutory SLA:</span>
                <span>{selectedCertificate.industryCategory === 'Green' ? '48 Hours (Maha Parwana)' : '30 Days'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Legal Finding:</span>
                <span style={{ color: '#059669', fontWeight: '600' }}>
                  Statutory SLA Expired Without Rejection. Approval Deemed by Law.
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Escalation Status:</span>
                <span style={{ color: '#ea580c', fontWeight: '500' }}>
                  Forwarded to Appellate Authority (MPCB Member Secretary)
                </span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedCertificate(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  backgroundColor: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Application Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Submit Permit Application
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateApplication}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={newApp.companyName}
                  onChange={(e) => setNewApp({ ...newApp, companyName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Department
                  </label>
                  <select
                    value={newApp.department}
                    onChange={(e) => setNewApp({ ...newApp, department: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '13px' }}
                  >
                    <option value="Pollution_Control">Pollution Control (MPCB)</option>
                    <option value="MIDC_Building_Plan">MIDC Building Plan</option>
                    <option value="Fire_Services">Fire Services NOC</option>
                    <option value="Factory_Inspectorate">Factory Inspectorate (DISH)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newApp.industryCategory}
                    onChange={(e) => setNewApp({ ...newApp, industryCategory: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '13px' }}
                  >
                    <option value="Green">Green (48h SLA)</option>
                    <option value="Orange">Orange (30d SLA)</option>
                    <option value="Red">Red (30d SLA)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Submission Time Simulation (Hours Ago)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={newApp.hoursAgo}
                  onChange={(e) => setNewApp({ ...newApp, hoursAgo: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '13px' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                  Set to 50+ hours for Green category to simulate statutory breach.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#1d4ed8', color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Save & Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
