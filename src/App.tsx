import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { WeatherMarketProvider, useWeatherMarket } from './context/WeatherMarketContext';
import { TopStatusBar } from './components/layout/TopStatusBar';
import { DesktopSidebar, type NavTabId } from './components/layout/DesktopSidebar';
import { MobileNavBar } from './components/layout/MobileNavBar';
import { LiveCommandView } from './components/views/LiveCommandView';
import { PreMarketIntelView } from './components/views/PreMarketIntelView';
import { CityDeepDiveView } from './components/views/CityDeepDiveView';
import { AgentConfigLogsView } from './components/views/AgentConfigLogsView';
import { QuickOrderTicket } from './components/widgets/QuickOrderTicket';
import { SettlementModal } from './components/widgets/SettlementModal';
import type { QuantitativeEdge } from './types/weatherMarket';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabId>('live-command');
  const [stagedEdge, setStagedEdge] = useState<QuantitativeEdge | null>(null);

  const {
    executeTrade,
    portfolio,
    activeSettlementNotice,
    dismissSettlementNotice,
    settledHistory
  } = useWeatherMarket();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f141c] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-700 dark:selection:text-sky-300 transition-colors">
      {/* Top Status & Telemetry Bar with Theme Switcher */}
      <TopStatusBar />

      {/* Mobile Horizontal City Navigation Strip */}
      <MobileNavBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Terminal Layout: Sidebar + Active View */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Persistent Bloomberg-Style Sidebar */}
        <DesktopSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Viewport Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-[1920px] mx-auto w-full">
          {activeTab === 'live-command' && (
            <LiveCommandView onOpenOrderTicket={(edge) => setStagedEdge(edge)} />
          )}

          {activeTab === 'pre-market-intel' && (
            <PreMarketIntelView onStageTrade={(edge) => setStagedEdge(edge)} />
          )}

          {activeTab === 'city-deep-dive' && <CityDeepDiveView />}

          {activeTab === 'agent-config' && <AgentConfigLogsView />}
        </main>
      </div>

      {/* Quick Order Execution Ticket Modal */}
      {stagedEdge && (
        <QuickOrderTicket
          initialEdge={stagedEdge}
          onClose={() => setStagedEdge(null)}
          onExecute={executeTrade}
          cashBalance={portfolio.cashBalance}
        />
      )}

      {/* Hourly Period Settlement Breakdown Modal */}
      {activeSettlementNotice && (
        <SettlementModal
          resolution={activeSettlementNotice}
          settledContracts={settledHistory}
          onClose={dismissSettlementNotice}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <WeatherMarketProvider>
        <AppContent />
      </WeatherMarketProvider>
    </ThemeProvider>
  );
}
