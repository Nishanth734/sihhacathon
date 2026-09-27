import React from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Clock,
  Database,
  Building
} from 'lucide-react';

export default function Navbar({ activeTab }) {
  const tabTitles = {
    dashboard: 'Dashboard',
    profile: 'Business Profile',
    approvals: 'Approvals DAG',
    'pre-scrutiny': 'Pre-Scrutiny & CAD',
    governance: 'MRTPS Governance'
  };

  return (
    <header style={{
      height: '60px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      flexShrink: 0,
      zIndex: 10
    }}>
      {/* Breadcrumb Navigation - Simple & Clear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: '#64748b', fontWeight: '500' }}>UdyogSetu</span>
        <ChevronRight size={14} color="#94a3b8" />
        <span style={{ color: '#0f172a', fontWeight: '700' }}>
          {tabTitles[activeTab] || 'Dashboard'}
        </span>
      </div>

      {/* Badges - Rylo Colors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Compliance Green: 48h SLA Active */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#ecfdf5', // Light Emerald
          border: '1px solid #a7f3d0',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          color: '#065f46',
          fontWeight: '600'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981' // Compliance Green
          }} />
          <span>Maha Parwana 48h SLA</span>
        </div>

        {/* Trust Blue: Deterministic GraphRAG */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#eff6ff', // Light Royal Blue
          border: '1px solid #bfdbfe',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          color: '#1d4ed8', // Trust Blue
          fontWeight: '600'
        }}>
          <Database size={13} color="#1d4ed8" />
          <span>Neo4j GraphRAG</span>
        </div>

        {/* State System Gateway */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          color: '#475569',
          fontWeight: '500'
        }}>
          <Building size={13} color="#64748b" />
          <span>MAITRI 2.0</span>
        </div>
      </div>
    </header>
  );
}
