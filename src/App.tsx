import React, { useState } from 'react';
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Telemetry & Status Bar */}
      <TopStatusBar />

      {/* Mobile Horizontal City Navigation Strip */}
      <MobileNavBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main App Grid: Desktop Sidebar + View Container */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Desktop Persistent Sidebar */}
        <DesktopSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* View Port Area */}
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

      {/* Institutional Quick Order Ticket Modal */}
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
    <WeatherMarketProvider>
      <AppContent />
    </WeatherMarketProvider>
  );
}
