import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle2, Clock, FileText, Building2 } from 'lucide-react';

/**
 * Custom React Flow Node for Maharashtra Industrial Approvals (Rylo Color Strategy)
 * Validated: Emerald Green (#10B981)
 * Uploaded: Trust Blue (#1D4ED8)
 * Pending: Alert Orange (#F97316)
 */
const statusConfig = {
  Validated: {
    borderColor: '#10b981',
    bgColor: '#ffffff',
    headerBg: '#ecfdf5',
    textColor: '#065f46',
    badgeBg: '#10b981',
    badgeText: '#ffffff',
    Icon: CheckCircle2,
    label: 'Validated'
  },
  Uploaded: {
    borderColor: '#1d4ed8',
    bgColor: '#ffffff',
    headerBg: '#eff6ff',
    textColor: '#1e40af',
    badgeBg: '#1d4ed8',
    badgeText: '#ffffff',
    Icon: FileText,
    label: 'Uploaded'
  },
  Pending: {
    borderColor: '#f97316',
    bgColor: '#ffffff',
    headerBg: '#fff7ed',
    textColor: '#9a3412',
    badgeBg: '#f97316',
    badgeText: '#ffffff',
    Icon: Clock,
    label: 'Pending'
  }
};

const departmentColors = {
  MIDC: '#1d4ed8',
  'MIDC SPA': '#2563eb',
  MPCB: '#059669',
  'MPCB HQ': '#047857',
  'Fire Department': '#ea580c',
  DISH: '#d97706',
  MSEDCL: '#0284c7',
  'MoEFCC / SEIAA Maharashtra': '#6d28d9',
  PESO: '#b91c1c',
  'CGWA / GSDA': '#0369a1'
};

const RegulatoryApprovalNode = ({ id, data, isConnectable }) => {
  const currentStatus = data.status || 'Pending';
  const config = statusConfig[currentStatus] || statusConfig.Pending;
  const StatusIcon = config.Icon;
  const deptColor = departmentColors[data.department] || '#475569';

  const handleStatusChange = (e, nextStatus) => {
    e.stopPropagation();
    if (data.onStatusChange) {
      data.onStatusChange(id, nextStatus);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderColor: config.borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '10px',
        minWidth: '250px',
        maxWidth: '280px',
        boxShadow: currentStatus === 'Validated'
          ? '0 4px 12px rgba(16, 185, 129, 0.15)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        transition: 'all 0.15s ease-in-out'
      }}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{
          background: config.borderColor,
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          border: '2px solid #ffffff'
        }}
      />

      {/* Node Header */}
      <div
        style={{
          backgroundColor: config.headerBg,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <span
          style={{
            backgroundColor: deptColor,
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            padding: '2px 7px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Building2 size={10} />
          {data.department || 'Authority'}
        </span>

        {/* SLA Badge */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#475569'
          }}
        >
          SLA: {data.statutorySlaDays || 7}d
        </span>
      </div>

      {/* Node Body */}
      <div style={{ padding: '12px', backgroundColor: '#ffffff' }}>
        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: '13px',
            fontWeight: '700',
            color: '#0f172a',
            lineHeight: '1.3'
          }}
        >
          {data.label}
        </h4>

        {/* Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: config.badgeBg,
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            marginBottom: '8px'
          }}
        >
          <StatusIcon size={12} />
          <span>{config.label}</span>
        </div>

        {/* Status Quick Cycler */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginTop: '4px',
            paddingTop: '6px',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          {['Pending', 'Uploaded', 'Validated'].map((st) => (
            <button
              key={st}
              onClick={(e) => handleStatusChange(e, st)}
              style={{
                flex: 1,
                fontSize: '10px',
                fontWeight: currentStatus === st ? '700' : '500',
                padding: '3px 4px',
                borderRadius: '4px',
                border: currentStatus === st ? `1px solid ${statusConfig[st].borderColor}` : '1px solid #e2e8f0',
                backgroundColor: currentStatus === st ? statusConfig[st].headerBg : '#ffffff',
                color: currentStatus === st ? statusConfig[st].textColor : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={`Switch status to ${st}`}
            >
              {st === 'Validated' ? '✓ Valid' : st === 'Uploaded' ? '↑ Upload' : '⏳ Wait'}
            </button>
          ))}
        </div>
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{
          background: config.borderColor,
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          border: '2px solid #ffffff'
        }}
      />
    </div>
  );
};

export default memo(RegulatoryApprovalNode);
