import React from 'react';
import TopologicalDependencyTree from '../components/TopologicalDependencyTree';

export default function ApprovalsDAGView() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <TopologicalDependencyTree defaultCategory="Orange" />
      </div>
    </div>
  );
}
