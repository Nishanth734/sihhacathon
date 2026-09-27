import React from 'react';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  FileCheck2,
  Scale,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'profile',
      label: 'Business Profile',
      icon: Building2
    },
    {
      id: 'approvals',
      label: 'Approvals DAG',
      icon: GitBranch
    },
    {
      id: 'pre-scrutiny',
      label: 'Pre-Scrutiny & CAD',
      icon: FileCheck2
    },
    {
      id: 'governance',
      label: 'MRTPS Governance',
      icon: Scale
    }
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      userSelect: 'none',
      zIndex: 20
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          backgroundColor: '#1d4ed8', // Trust Blue
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '18px',
          boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)'
        }}>
          U
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
              UdyogSetu
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}>
              LIVE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
            Industrial Compliance Portal
          </p>
        </div>
      </div>

      {/* Navigation List - Clean & Aligned */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#94a3b8',
          letterSpacing: '0.06em',
          padding: '6px 12px',
          textTransform: 'uppercase'
        }}>
          Modules
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#eff6ff' : 'transparent', // Trust Blue tint
                color: isActive ? '#1d4ed8' : '#475569',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid #1d4ed8' : '3px solid transparent'
              }}
            >
              <Icon size={18} color={isActive ? '#1d4ed8' : '#64748b'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <ChevronRight size={14} color="#1d4ed8" />}
            </button>
          );
        })}
      </nav>

      {/* Trust & Security Badge */}
      <div style={{
        padding: '12px 14px',
        margin: '0 12px 16px 12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <ShieldCheck size={18} color="#1d4ed8" />
        <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.3' }}>
          <strong style={{ color: '#0f172a' }}>API Setu Verified</strong>
          <div>Secured with Maha Parwana</div>
        </div>
      </div>

      {/* Active Organization Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '700',
          color: '#1d4ed8'
        }}>
          MP
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            Maha Precision Ltd
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
            GST: 27AABCU9603R
          </div>
        </div>
      </div>
    </aside>
  );
}
