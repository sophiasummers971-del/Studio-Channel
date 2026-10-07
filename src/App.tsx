import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ContentDetailModal } from '@/components/ContentDetailModal';
import { DashboardHome } from '@/views/DashboardHome';
import { PlatformSection } from '@/views/PlatformSection';
import { PipelineView } from '@/views/PipelineView';
import { HandoffFlow } from '@/views/HandoffFlow';
import { InputPanel } from '@/views/InputPanel';
import { OutputPanel } from '@/views/OutputPanel';
import { UniversalWorkflowView } from '@/views/UniversalWorkflowView';
import { WeeklyApprovalView } from '@/views/WeeklyApprovalView';
import { ExtensionPointsView } from '@/views/ExtensionPointsView';
import { TestPlanView } from '@/views/TestPlanView';
import { DeploymentGateView } from '@/views/DeploymentGateView';
import { ChannelRolloutView } from '@/views/ChannelRolloutView';
import { FallbackPathView } from '@/views/FallbackPathView';
import { InstagramPilotView } from '@/views/InstagramPilotView';
import { TikTokSetupView } from '@/views/TikTokSetupView';
import { PinterestSetupView } from '@/views/PinterestSetupView';
import { LinkedInSetupView } from '@/views/LinkedInSetupView';
import { ConnectionsView } from '@/views/ConnectionsView';
import { ContentGeneratorView } from '@/views/ContentGeneratorView';
import { PublishHandoffView } from '@/views/PublishHandoffView';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useTestPlan } from '@/hooks/useTestPlan';
import type { ViewId, PlatformId, ContentItem } from '@/types';

function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [activePlatform, setActivePlatform] = useState<PlatformId | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const workflow = useWorkflow();
  const testPlan = useTestPlan();

  const handleNavigate = (view: ViewId) => {
    setActiveView(view);
    if (view !== 'platform') setActivePlatform(null);
  };

  const handlePlatformSelect = (platformId: PlatformId) => {
    setActivePlatform(platformId);
    setActiveView('platform');
  };

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar
        activeView={activeView}
        activePlatform={activePlatform}
        onNavigate={handleNavigate}
        onPlatformSelect={handlePlatformSelect}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeView={activeView}
          activePlatform={activePlatform}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          onNewContent={() => handleNavigate('content-generator')}
        />

        <main id="main-content" className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' && (
            <DashboardHome
              onPlatformSelect={handlePlatformSelect}
              onNavigate={handleNavigate}
            />
          )}
          {activeView === 'platform' && activePlatform && (
            <PlatformSection
              platformId={activePlatform}
              onBack={() => handleNavigate('dashboard')}
              onItemClick={handleItemClick}
            />
          )}
          {activeView === 'pipeline' && <PipelineView onItemClick={handleItemClick} />}
          {activeView === 'content' && <HandoffFlow onItemClick={handleItemClick} />}
          {activeView === 'inputs' && <InputPanel />}
          {activeView === 'outputs' && <OutputPanel />}
          {activeView === 'workflow' && (
            <UniversalWorkflowView
              workflow={workflow}
              onNavigateToApproval={() => handleNavigate('approval')}
            />
          )}
          {activeView === 'approval' && <WeeklyApprovalView workflow={workflow} />}
          {activeView === 'extensions' && <ExtensionPointsView />}
          {activeView === 'test-plan' && (
            <TestPlanView
              testPlan={testPlan}
              onNavigateToGate={() => handleNavigate('deployment-gate')}
            />
          )}
          {activeView === 'deployment-gate' && <DeploymentGateView testPlan={testPlan} />}
          {activeView === 'channel-rollout' && <ChannelRolloutView />}
          {activeView === 'fallback-path' && <FallbackPathView />}
          {activeView === 'connections' && <ConnectionsView />}
          {activeView === 'instagram-pilot' && <InstagramPilotView />}
          {activeView === 'tiktok-setup' && <TikTokSetupView />}
          {activeView === 'pinterest-setup' && <PinterestSetupView />}
          {activeView === 'linkedin-setup' && <LinkedInSetupView />}
          {activeView === 'content-generator' && <ContentGeneratorView />}
          {activeView === 'publish-handoff' && <PublishHandoffView />}
        </main>
      </div>

      <ContentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}

export default App;