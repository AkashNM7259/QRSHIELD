import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { SafeInspectionModal } from './components/SafeInspectionModal';
import { HeroLandingPage } from './pages/HeroLandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScannerPage } from './pages/ScannerPage';
import { UrlAnalysisPage } from './pages/UrlAnalysisPage';
import { UpiSecurityPage } from './pages/UpiSecurityPage';
import { QrVerificationPage } from './pages/QrVerificationPage';
import { RegisteredQrsPage } from './pages/RegisteredQrsPage';
import { ScanHistoryPage } from './pages/ScanHistoryPage';
import { SecurityReportsPage } from './pages/SecurityReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { api, ApiStatus } from './services/api';
import { ScanResult, AuthUser } from './types';

export const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => api.getStoredUser());
  const [activeTab, setActiveTab] = useState<string>('hero');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [activeModalScan, setActiveModalScan] = useState<ScanResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>(api.getStatus());

  useEffect(() => {
    return api.subscribe((status) => setApiStatus(status));
  }, []);

  const handleScanComplete = (scan: ScanResult) => {
    setActiveModalScan(scan);
  };

  const handleOpenScanDetails = (scan: ScanResult) => {
    setActiveModalScan(scan);
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    api.logout();
    setAuthUser(null);
  };

  // Very First Page: Login Portal if not authenticated
  if (!authUser) {
    return <LoginPage onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-obsidian-900 text-chrome-200 flex flex-col font-sans cyber-grid selection:bg-laser-600/30 selection:text-laser-400">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-12">
          {activeTab === 'hero' && (
            <HeroLandingPage
              onScanClick={() => setActiveTab('scanner')}
              onExploreFeatures={() => setActiveTab('dashboard')}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              onScanClick={() => setActiveTab('scanner')}
              onSelectScan={handleOpenScanDetails}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'scanner' && (
            <ScannerPage onScanComplete={handleScanComplete} />
          )}

          {activeTab === 'url-analysis' && <UrlAnalysisPage />}

          {activeTab === 'upi-security' && <UpiSecurityPage />}

          {activeTab === 'qr-verification' && (
            <QrVerificationPage onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'registered-qrs' && <RegisteredQrsPage />}

          {activeTab === 'scan-history' && (
            <ScanHistoryPage onSelectScan={handleOpenScanDetails} />
          )}

          {activeTab === 'security-reports' && <SecurityReportsPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Safe Inspection Modal Dialog */}
      <SafeInspectionModal
        scan={activeModalScan}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigateTab={(tab) => {
          setIsModalOpen(false);
          setActiveTab(tab);
        }}
      />
    </div>
  );
};
