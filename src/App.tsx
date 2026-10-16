import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { PipelineTab } from './components/PipelineTab';
import { CustomerTab } from './components/CustomerTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { TeamTab } from './components/TeamTab';
import { AuditLogsTab } from './components/AuditLogsTab';
import { LostReasonModal } from './components/LostReasonModal';
import { TargetSettingModal } from './components/TargetSettingModal';
import { SystemCheckerModal } from './components/SystemCheckerModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { activeTab, setActiveTab, isCheckerOpen, setIsCheckerOpen, toast } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [pipelineInitialStage, setPipelineInitialStage] = useState<string | undefined>(undefined);

  const navigateToPipelineWithStage = (stage?: string) => {
    setPipelineInitialStage(stage);
    setActiveTab('pipeline');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Left Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenTargetModal={() => setIsTargetModalOpen(true)}
      />

      {/* Main Content View shifted right on desktop */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenTargetModal={() => setIsTargetModalOpen(true)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'overview' && (
            <OverviewTab
              onOpenTargetModal={() => setIsTargetModalOpen(true)}
              onNavigateToPipeline={navigateToPipelineWithStage}
            />
          )}
          {activeTab === 'pipeline' && (
            <PipelineTab initialStageFilter={pipelineInitialStage} />
          )}
          {activeTab === 'customers' && <CustomerTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'logs' && <AuditLogsTab />}
        </main>

        {/* Global Modals */}
        <LostReasonModal />
        <TargetSettingModal
          isOpen={isTargetModalOpen}
          onClose={() => setIsTargetModalOpen(false)}
        />
        <SystemCheckerModal
          isOpen={isCheckerOpen}
          onClose={() => setIsCheckerOpen(false)}
        />

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-xl shadow-2xl text-xs border border-slate-800 dark:border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-medium">
              © {new Date().getFullYear()} BIOTA SMARTHOME SALES PROJECT. All Rights Reserved.
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
              <span>Sistem Penjualan Proyek & IoT Automation</span>
              <span>·</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Fitroh Adhiansyah (Senior Sales Executive)
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
