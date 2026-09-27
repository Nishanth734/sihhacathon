import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

export default function BusinessProfileView() {
  const [formData, setFormData] = useState({
    companyName: 'Maharashtra Precision Forgings Ltd',
    pan: 'AABCU9603R',
    gst: '27AABCU9603R1ZM',
    industryCategory: 'Orange',
    investmentSize: 45.5,
    location: 'Chakan Phase II, Taluka Khed, Pune'
  });

  const [loading, setLoading] = useState(false);
  const [verifiedProfile, setVerifiedProfile] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const presets = [
    {
      title: 'Auto Components (Orange)',
      data: {
        companyName: 'Maharashtra Precision Forgings Ltd',
        pan: 'AABCU9603R',
        gst: '27AABCU9603R1ZM',
        industryCategory: 'Orange',
        investmentSize: 45.5,
        location: 'Chakan Phase II, Pune'
      }
    },
    {
      title: 'Solar Bio-Power (Green)',
      data: {
        companyName: 'Sahyadri Solar Bio-Power LLP',
        pan: 'ABCDE1234F',
        gst: '27ABCDE1234F1Z5',
        industryCategory: 'Green',
        investmentSize: 12.5,
        location: 'MIDC Solapur, Maharashtra'
      }
    },
    {
      title: 'Chemical Processing (Red)',
      data: {
        companyName: 'Konkan Heavy Synthetics Ltd',
        pan: 'KONKA5678M',
        gst: '27KONKA5678M1ZK',
        industryCategory: 'Red',
        investmentSize: 180.0,
        location: 'Tarapur MIDC Chemical Zone, Palghar'
      }
    }
  ];

  const handleApplyPreset = (presetData) => {
    setFormData(presetData);
    setVerifiedProfile(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/verify-business`, formData);
      if (response.data?.success) {
        setVerifiedProfile(response.data.data);
        setSuccessMessage('Business verified via API Setu Sandbox and DigiLocker Gateway.');
      } else {
        setError(response.data?.message || 'Verification failed.');
      }
    } catch (err) {
      console.error('Zero-Entry verification error:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to verification gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
            Zero-Entry Entity Onboarding
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
            API Setu Sandbox
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Fetches DigiLocker incorporation certificates and active GSTN records without manual paperwork.
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
          <span>Quick Presets:</span>
        </div>
        {presets.map((preset, index) => (
          <button
            key={index}
            onClick={() => handleApplyPreset(preset.data)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Main Grid: Form + Verification Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Form Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            Entity Identifiers
          </h2>

          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Company Name (Auto-resolved if blank)
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Maharashtra Precision Forgings Ltd"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  PAN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  GSTIN *
                </label>
                <input
                  type="text"
                  required
                  value={formData.gst}
                  onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                  maxLength={15}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Pollution Category *
                </label>
                <select
                  value={formData.industryCategory}
                  onChange={(e) => setFormData({ ...formData, industryCategory: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="Green">Green Category (48h Fast-Track)</option>
                  <option value="Orange">Orange Category (48h Fast-Track)</option>
                  <option value="Red">Red Category (Standard Scrutiny)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                  Plant Investment (₹ Crores) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.investmentSize}
                  onChange={(e) => setFormData({ ...formData, investmentSize: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                Facility Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Chakan Phase II, Taluka Khed, Pune"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Trust Blue Action Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                backgroundColor: loading ? '#93c5fd' : '#1d4ed8', // Trust Blue
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connecting to API Setu...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify via Government Gateway</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#fff7ed', // Alert Orange tint
              border: '1px solid #fed7aa',
              color: '#c2410c',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="#f97316" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#ecfdf5', // Compliance Green tint
              border: '1px solid #a7f3d0',
              color: '#047857',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Verification Result Card */}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                Verification Record
              </h2>
              {verifiedProfile && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckCircle2 size={12} color="#10b981" />
                  <span>VERIFIED</span>
                </span>
              )}
            </div>

            {verifiedProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Entity Summary */}
                <div style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    {verifiedProfile.companyName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                    <span>PAN: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{verifiedProfile.pan}</strong></span>
                    <span>GSTIN: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{verifiedProfile.gst}</strong></span>
                  </div>
                </div>

                {/* Statutory Fast-Track & MSME Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: verifiedProfile.mahaParwanaEligible ? '#ecfdf5' : '#f8fafc',
                    border: verifiedProfile.mahaParwanaEligible ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>SLA Window</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: verifiedProfile.mahaParwanaEligible ? '#059669' : '#0f172a', marginTop: '2px' }}>
                      {verifiedProfile.mahaParwanaEligible ? '48-Hour Fast-Track' : 'Standard 30-Day'}
                    </div>
                  </div>

                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>MSME Classification</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8', marginTop: '2px' }}>
                      {verifiedProfile.msmeCategory || 'Medium Enterprise'}
                    </div>
                  </div>
                </div>

                {/* DigiLocker MCA Card */}
                <div style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} color="#1d4ed8" />
                    <span>DigiLocker Incorporation (MCA-21)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>CIN: <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{verifiedProfile.digiLockerData?.cin || 'U28112PN2018PTC176543'}</span></div>
                    <div>Incorporation Date: <span style={{ color: '#0f172a' }}>{verifiedProfile.digiLockerData?.incorporationDate || '2018-04-18'}</span></div>
                    <div>State of RoC: <span style={{ color: '#0f172a' }}>Maharashtra (RoC Pune)</span></div>
                  </div>

                  {verifiedProfile.digiLockerData?.directors && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
                        Authorized Directors
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {verifiedProfile.digiLockerData.directors.map((dir, idx) => (
                          <span key={idx} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px' }}>
                            {dir.name || dir}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* GSTN Status */}
                <div style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} color="#10b981" />
                    <span>GSTN Taxpayer Registry</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>Filing Status: <span style={{ color: '#059669', fontWeight: '700' }}>{verifiedProfile.gstnData?.status || 'Active'}</span></div>
                    <div>Jurisdiction: <span style={{ color: '#0f172a' }}>{verifiedProfile.gstnData?.jurisdiction || 'Ward 3, Pune West, Maharashtra'}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                height: '320px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <Building2 size={24} color="#94a3b8" />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                  No Profile Verified Yet
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b', maxWidth: '260px' }}>
                  Click "Verify via Government Gateway" to fetch mock DigiLocker records.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
