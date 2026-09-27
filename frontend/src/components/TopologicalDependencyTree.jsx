import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  MiniMap
} from 'reactflow';
import axios from 'axios';
import {
  GitBranch,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  ChevronRight,
  Filter,
  RefreshCw,
  FileText,
  Building2,
  X
} from 'lucide-react';
import RegulatoryApprovalNode from './RegulatoryApprovalNode';

const BACKEND_URL = 'http://localhost:5000';

const nodeTypes = {
  regulatoryApproval: RegulatoryApprovalNode
};

export default function TopologicalDependencyTree({ defaultCategory = 'Orange' }) {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [graphMetadata, setGraphMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Status handler
  const handleNodeStatusChange = useCallback((nodeId, nextStatus) => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              status: nextStatus
            }
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  // Fetch DAG from API
  const fetchDependencyGraph = useCallback(async (category) => {
    setLoading(true);
    setSelectedNode(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/regulatory/dependency-graph`, {
        params: { category }
      });

      if (response.data && response.data.success) {
        const { flowNodes, flowEdges, metadata } = response.data.data;

        const augmentedNodes = flowNodes.map((fn) => ({
          ...fn,
          type: 'regulatoryApproval',
          data: {
            ...fn.data,
            onStatusChange: handleNodeStatusChange
          }
        }));

        const styledEdges = flowEdges.map((fe) => ({
          ...fe,
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: '#64748b'
          }
        }));

        setNodes(augmentedNodes);
        setEdges(styledEdges);
        setGraphMetadata(metadata);
      }
    } catch (err) {
      console.warn('Backend DAG fetch error, using local fallback:', err.message);
    } finally {
      setLoading(false);
    }
  }, [handleNodeStatusChange, setNodes, setEdges]);

  useEffect(() => {
    fetchDependencyGraph(selectedCategory);
  }, [selectedCategory, fetchDependencyGraph]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const liveStats = useMemo(() => {
    const counts = { Validated: 0, Uploaded: 0, Pending: 0 };
    nodes.forEach((n) => {
      const st = n.data?.status || 'Pending';
      if (counts[st] !== undefined) counts[st]++;
    });
    const total = nodes.length || 1;
    const progressPercent = Math.round((counts.Validated / total) * 100);
    return { counts, total, progressPercent };
  }, [nodes]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Top Controls Header */}
      <div style={{
        padding: '16px 28px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
              Topological Regulatory Dependency Graph
            </h2>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              fontWeight: '700'
            }}>
              Kahn Sort
            </span>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Visualizes sequential approval blockers and parallel tracks across MIDC, MPCB, DISH & Fire.
          </p>
        </div>

        {/* Industry Category Switcher Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f1f5f9',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { cat: 'Green', label: 'Green Category', activeColor: '#10b981' },
            { cat: 'Orange', label: 'Orange Category', activeColor: '#f97316' },
            { cat: 'Red', label: 'Red Category', activeColor: '#dc2626' }
          ].map(({ cat, label, activeColor }) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#0f172a' : '#64748b',
                  border: isSelected ? '1px solid #cbd5e1' : '1px solid transparent',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isSelected ? '700' : '500',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: activeColor }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{
        padding: '10px 28px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
          <span><strong>{liveStats.total}</strong> Clearances Required</span>
          <span>•</span>
          <span>Critical Path: <strong>{graphMetadata?.metrics?.criticalPathDays || 70} Days</strong></span>
          <span>•</span>
          <span>Parallel Streams: <strong>{graphMetadata?.metrics?.parallelStreams || 2} Concurrent</strong></span>
          <span>•</span>
          <span style={{ color: graphMetadata?.mahaParwanaEligible ? '#059669' : '#dc2626', fontWeight: '600' }}>
            {graphMetadata?.mahaParwanaEligible ? '48-Hour Maha Parwana SLA' : 'SEIAA Environmental Scrutiny'}
          </span>
        </div>

        {/* Live Status Pill Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: '600' }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span>{liveStats.counts.Validated} Validated</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1d4ed8', fontWeight: '600' }}>
            <FileText size={13} color="#1d4ed8" />
            <span>{liveStats.counts.Uploaded} Uploaded</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c2410c', fontWeight: '600' }}>
            <Clock size={13} color="#f97316" />
            <span>{liveStats.counts.Pending} Pending</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '3px', backgroundColor: '#e2e8f0' }}>
        <div
          style={{
            height: '100%',
            width: `${liveStats.progressPercent}%`,
            backgroundColor: '#10b981',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* React Flow Canvas */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              color: '#1d4ed8',
              fontWeight: '600',
              gap: '8px'
            }}>
              <RefreshCw size={16} className="animate-spin" />
              <span>Computing topological graph...</span>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            style={{ backgroundColor: '#f8fafc' }}
          >
            <Controls style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fill: '#0f172a' }} />
            <MiniMap
              nodeColor={(n) => {
                if (n.data?.status === 'Validated') return '#10b981';
                if (n.data?.status === 'Uploaded') return '#1d4ed8';
                return '#f97316';
              }}
              style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}
            />
            <Background color="#cbd5e1" gap={20} size={1} />
          </ReactFlow>

          {/* Floating Clean White Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              zIndex: 5
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
              <span style={{ color: '#0f172a', fontWeight: '500' }}>Validated</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#1d4ed8' }} />
              <span style={{ color: '#0f172a', fontWeight: '500' }}>Uploaded</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f97316' }} />
              <span style={{ color: '#0f172a', fontWeight: '500' }}>Pending</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div
            style={{
              width: '320px',
              backgroundColor: '#ffffff',
              borderLeft: '1px solid #e2e8f0',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
              zIndex: 10
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' }}>
                  {selectedNode.data?.department || 'Department'}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                {selectedNode.data?.label}
              </h3>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: selectedNode.data?.status === 'Validated' ? '#ecfdf5' : '#eff6ff',
                  color: selectedNode.data?.status === 'Validated' ? '#047857' : '#1d4ed8'
                }}>
                  {selectedNode.data?.status || 'Pending'}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569'
                }}>
                  SLA: {selectedNode.data?.statutorySlaDays || 7} Days
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Prerequisites Required:
                </div>
                <div style={{ fontSize: '12px', color: '#0f172a', lineHeight: '1.4' }}>
                  {selectedNode.data?.prerequisites && selectedNode.data.prerequisites.length > 0 ? (
                    selectedNode.data.prerequisites.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <ChevronRight size={12} color="#1d4ed8" />
                        <span>{p}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#059669', fontWeight: '500' }}>✓ Zero prerequisites (Can begin immediately)</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Mandatory Documents:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedNode.data?.requiredDocuments && selectedNode.data.requiredDocuments.length > 0 ? (
                    selectedNode.data.requiredDocuments.map((doc, idx) => (
                      <div key={idx} style={{ fontSize: '11px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px', color: '#334155' }}>
                        {doc}
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Standard statutory application form</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
