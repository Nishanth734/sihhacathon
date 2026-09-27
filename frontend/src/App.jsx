import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import BusinessProfileView from './views/BusinessProfileView';
import ApprovalsDAGView from './views/ApprovalsDAGView';
import PreScrutinyView from './views/PreScrutinyView';
import GovernanceView from './views/GovernanceView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'profile':
        return <BusinessProfileView />;
      case 'approvals':
        return <ApprovalsDAGView />;
      case 'pre-scrutiny':
        return <PreScrutinyView />;
      case 'governance':
        return <GovernanceView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      overflow: 'hidden'
    }}>
      {/* Sidebar with Trust Blue & White Rylo Scheme */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f1f5f9'
      }}>
        {/* Top Clean White Navbar */}
        <Navbar activeTab={activeTab} />

        {/* Active Work Area */}
        <main style={{
          flex: 1,
          overflowY: activeTab === 'approvals' ? 'hidden' : 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f1f5f9'
        }}>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
