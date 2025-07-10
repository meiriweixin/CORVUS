import React, { useState, useEffect, useCallback } from 'react';
import { EnhancedURLInput } from './components/EnhancedURLInput';
import { CrawlProgressDisplay } from './components/CrawlProgressDisplay';
import { FilteredResultsDisplay } from './components/FilteredResultsDisplay';
import { ProcessedResultsDisplay } from './components/ProcessedResultsDisplay';
import { Dashboard } from './components/Dashboard';
import { Study } from './components/Study';
import { Chat } from './components/Chat';
import { Layout } from './components/Layout';
import { GlowEffect } from './components/ui/glow-effect';
import { crawlerService } from './services/websocketService';
import { 
  CrawlConfig, 
  CrawlLog, 
  CrawlStats, 
  Screenshot, 
  RawContentItem, 
  ProcessedArticle,
  CrawlProgress 
} from './types/crawling';
import { AlertCircle, Link, Activity, BarChart3 } from 'lucide-react';

interface AppState {
  isConnected: boolean;
  isConnecting: boolean;
  isCrawling: boolean;
  currentPhase: 'idle' | 'initializing' | 'crawling' | 'processing' | 'saving' | 'completed' | 'error';
  stats: CrawlStats;
  logs: CrawlLog[];
  screenshots: Screenshot[];
  rawItems: RawContentItem[];
  processedArticles: ProcessedArticle[];
  connectionError?: string;
}

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'crawler' | 'study' | 'chat'>('dashboard');
  const [activeTab, setActiveTab] = useState<'input' | 'progress' | 'results'>('input');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [resultsTab, setResultsTab] = useState<'filtered' | 'processed'>('filtered');
  const [state, setState] = useState<AppState>({
    isConnected: false,
    isConnecting: false,
    isCrawling: false,
    currentPhase: 'idle',
    stats: {
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      screenshotsTaken: 0,
      scrollAttempts: 0,
      rawItemsExtracted: 0,
      filteredItems: 0,
      cybersecurityArticles: 0
    },
    logs: [],
    screenshots: [],
    rawItems: [],
    processedArticles: []
  });



  const connectToBackend = async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, connectionError: undefined }));
      
      // Connect to WebSocket
      await crawlerService.connect();
      
      // Test backend health
      const health = await crawlerService.checkHealth();
      if (health?.status === 'healthy') {
        setState(prev => ({ 
          ...prev,
          isConnected: true, 
          isConnecting: false,
          connectionError: undefined 
        }));
        
        // Setup event handlers
        crawlerService.setEventHandlers({
          onLog: (log) => {
            setState(prev => ({ 
              ...prev,
              logs: [...prev.logs, log].slice(-1000) // Keep last 1000 logs
            }));
          },
          onProgress: (stats) => {
            setState(prev => ({ ...prev, stats }));
          },
          onPhase: (phase) => {
            setState(prev => ({ ...prev, currentPhase: phase as any }));
          },
          onScreenshot: (screenshot) => {
            setState(prev => ({
              ...prev,
              screenshots: [...prev.screenshots, screenshot]
            }));
          },
          onRawItem: (item) => {
            setState(prev => ({
              ...prev,
              rawItems: [...prev.rawItems, item]
            }));
          },
          onProcessedItem: (article) => {
            setState(prev => ({
              ...prev,
              processedArticles: [...prev.processedArticles, article]
            }));
          },
          onCompleted: (result) => {
            setState(prev => ({ 
              ...prev,
              isCrawling: false, 
              currentPhase: result.success ? 'completed' : 'error'
            }));
            if (!result.success && result.error) {
              console.error('Crawl completed with error:', result.error);
            }
          },
          onError: (error) => {
            setState(prev => ({ 
              ...prev,
              isCrawling: false, 
              currentPhase: 'error',
              logs: [...prev.logs, {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: error.error || 'Unknown error occurred'
              }]
            }));
          }
        });
        
      } else {
        throw new Error('Backend health check failed');
      }
      
    } catch (error) {
      console.error('Failed to connect to backend:', error);
      setState(prev => ({ 
        ...prev,
        isConnected: false, 
        isConnecting: false,
        connectionError: error instanceof Error ? error.message : 'Unknown connection error'
      }));
    }
  };

  // Initialize connection on component mount
  useEffect(() => {
    connectToBackend();
    
    return () => {
      crawlerService.disconnect();
    };
  }, []);

  const handleStartCrawl = useCallback(async (urls: string[], config: CrawlConfig) => {
    if (!state.isConnected) {
      alert('Not connected to backend server. Please ensure the backend is running.');
      return;
    }

    try {
      // Reset state for new crawl
      setState(prev => ({
        ...prev,
        isCrawling: true,
        currentPhase: 'initializing',
        stats: {
          totalPages: 0,
          successfulPages: 0,
          failedPages: 0,
          screenshotsTaken: 0,
          scrollAttempts: 0,
          rawItemsExtracted: 0,
          filteredItems: 0,
          cybersecurityArticles: 0
        },
        logs: [],
        screenshots: [],
        rawItems: [],
        processedArticles: []
      }));

      // Switch to progress tab
      setActiveTab('progress');

      // Start crawling
      crawlerService.startCrawl(urls, config);
      
    } catch (error) {
      console.error('Failed to start crawl:', error);
      setState(prev => ({ 
        ...prev,
        isCrawling: false, 
        currentPhase: 'error',
        logs: [{
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: error instanceof Error ? error.message : 'Failed to start crawl'
        }]
      }));
    }
  }, [state.isConnected]);

  const handleCancelCrawl = useCallback(() => {
    crawlerService.cancelCrawl();
    setState(prev => ({ 
      ...prev,
      isCrawling: false, 
      currentPhase: 'idle'
    }));
  }, []);

  const handleDeleteScreenshot = useCallback((screenshotId: string) => {
    setState(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, index) => `screenshot_${index}` !== screenshotId)
    }));
  }, []);

  const handleClearAllScreenshots = useCallback(() => {
    crawlerService.clearScreenshots();
    setState(prev => ({ ...prev, screenshots: [] }));
  }, []);

  const handleDownloadScreenshot = useCallback((screenshot: Screenshot) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${screenshot.data}`;
    link.download = `screenshot_${screenshot.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleExportData = useCallback((data: any) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mis2-data-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Also need clearScreenshots function
  const clearScreenshots = useCallback(() => {
    setState(prev => ({ ...prev, screenshots: [] }));
  }, []);

  // Calculate progress based on current phase
  const calculateProgress = (): number => {
    switch (state.currentPhase) {
      case 'idle':
        return 0;
      case 'initializing':
        return 10;
      case 'crawling':
        // 10-60% for crawling phase
        if (state.stats.totalPages === 0) return 15;
        const crawlProgress = Math.min(50, (state.stats.successfulPages / Math.max(state.stats.totalPages, 1)) * 50);
        return 10 + crawlProgress;
      case 'processing':
        // 60-90% for AI processing phase
        const totalItems = state.stats.rawItemsExtracted;
        const processedItems = state.processedArticles.length;
        if (totalItems === 0) return 65;
        const processProgress = Math.min(30, (processedItems / totalItems) * 30);
        return 60 + processProgress;
      case 'saving':
        return 95;
      case 'completed':
        return 100;
      case 'error':
        return state.stats.totalPages > 0 ? Math.round((state.stats.successfulPages / state.stats.totalPages) * 100) : 0;
      default:
        return 0;
    }
  };

  // Create progress object for CrawlProgressDisplay
  const progress: CrawlProgress = {
    status: state.currentPhase,
    progress: calculateProgress(),
    currentUrl: state.logs.length > 0 ? state.logs[state.logs.length - 1].url : undefined,
    stats: state.stats,
    logs: state.logs,
    screenshots: state.screenshots.reduce((acc, screenshot, index) => {
      acc[`screenshot_${index}`] = screenshot;
      return acc;
    }, {} as Record<string, Screenshot>),
    rawData: state.rawItems,
    filteredData: state.rawItems, // Assuming filtered data is same for now
    processedData: state.processedArticles
  };

  // Navigation items for LimelightNav (only shown when in crawler view)
  const navItems = currentView === 'crawler' ? [
    {
      id: 'input',
      icon: <Link />,
      label: 'URL Input',
      onClick: () => setActiveTab('input')
    },
    {
      id: 'progress',
      icon: <Activity />,
      label: 'Progress',
      onClick: () => setActiveTab('progress')
    },
    {
      id: 'results',
      icon: <BarChart3 />,
      label: 'Results',
      onClick: () => setActiveTab('results')
    }
  ] : [];

  const handleTabChange = (index: number) => {
    const tabs: ('input' | 'progress' | 'results')[] = ['input', 'progress', 'results'];
    setActiveTab(tabs[index]);
    setActiveTabIndex(index);
  };



  return (
    <Layout 
      isConnected={state.isConnected}
      isConnecting={state.isConnecting}
      connectionError={state.connectionError}
      navItems={navItems}
      activeTabIndex={activeTabIndex}
      onTabChange={handleTabChange}
      currentView={currentView}
      onViewChange={setCurrentView}
    >
      {currentView === 'dashboard' ? (
        <Dashboard />
      ) : currentView === 'study' ? (
        <Study />
      ) : currentView === 'chat' ? (
        <Chat />
      ) : (
        <div className="container mx-auto px-4 py-2">
          <div className="max-w-7xl mx-auto">
            {!state.isConnected && !state.isConnecting && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="text-red-300 font-medium">Backend Connection Required</h3>
                    <p className="text-red-400 text-sm mt-1">
                      Please make sure the backend server is running on port 3001. 
                      The crawler requires a Node.js backend to function properly.
                    </p>
                    <p className="text-red-400 text-sm mt-2">
                      Run: <code className="bg-red-900/30 px-2 py-1 rounded text-red-300">cd backend && npm run dev</code>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Crawler Interface */}
            <div className="space-y-6">
              {/* Title - Match dashboard title style */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 mt-6">Advanced Cyber Intelligence Crawler</h1>
                  <p className="text-gray-300">Leverage cutting-edge AI and automation to extract, process, and analyze cybersecurity intelligence from across the web.</p>
                </div>
              </div>

              {/* Tab Section - Enhanced Modern Design */}
              {currentView === 'crawler' && navItems.length > 0 && (
                <div className="px-4">
                  <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <nav className="p-1">
                      <div className="relative flex bg-gray-800/40 rounded-xl p-1">
                        {/* Animated indicator */}
                        <div 
                          className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transition-all duration-300 ease-out shadow-lg"
                          style={{
                            left: `${(activeTabIndex * 100) / 3}%`,
                            width: `${100 / 3}%`,
                            transform: 'translateX(0.25rem)',
                            right: '0.25rem'
                          }}
                        />
                        
                        {navItems.map((item, index) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              item.onClick();
                              setActiveTabIndex(index);
                            }}
                            className={`relative flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all duration-300 ease-out flex-1 z-10 ${
                              activeTabIndex === index
                                ? 'text-white transform scale-105'
                                : 'text-gray-400 hover:text-white hover:scale-102'
                            }`}
                          >
                            <div className={`transition-all duration-300 ${
                              activeTabIndex === index ? 'scale-110' : 'scale-100'
                            }`}>
                              {item.icon}
                            </div>
                            <span className="font-semibold tracking-wide">{item.label}</span>
                            
                            {/* Active state glow effect */}
                            {activeTabIndex === index && (
                              <div className="absolute inset-0 bg-white/5 rounded-lg animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>
                    </nav>
                  </div>
                </div>
              )}

              {/* Main Crawler Card - Content only */}
              <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8">
                  <div className="min-h-[400px]">
                    {/* Tab Content with Smooth Transitions */}
                    <div className="relative">
                      {/* URL Input Tab */}
                      <div className={`transition-all duration-500 ease-out ${
                        activeTab === 'input' 
                          ? 'opacity-100 transform translate-x-0 pointer-events-auto' 
                          : 'opacity-0 transform translate-x-4 pointer-events-none absolute inset-0'
                      }`}>
                        {activeTab === 'input' && (
                          <div className="animate-fadeIn">
                            <EnhancedURLInput
                              onSubmit={handleStartCrawl}
                              isLoading={state.isCrawling || !state.isConnected}
                            />
                          </div>
                        )}
                      </div>

                      {/* Progress Tab */}
                      <div className={`transition-all duration-500 ease-out ${
                        activeTab === 'progress' 
                          ? 'opacity-100 transform translate-x-0 pointer-events-auto' 
                          : 'opacity-0 transform translate-x-4 pointer-events-none absolute inset-0'
                      }`}>
                        {activeTab === 'progress' && (
                          <div className="animate-fadeIn">
                            <CrawlProgressDisplay
                              progress={progress}
                              onCancel={handleCancelCrawl}
                              onDeleteScreenshot={handleDeleteScreenshot}
                            />
                          </div>
                        )}
                      </div>

                      {/* Results Tab */}
                      <div className={`transition-all duration-500 ease-out ${
                        activeTab === 'results' 
                          ? 'opacity-100 transform translate-x-0 pointer-events-auto' 
                          : 'opacity-0 transform translate-x-4 pointer-events-none absolute inset-0'
                      }`}>
                        {activeTab === 'results' && (
                          <div className="animate-fadeIn space-y-6">
                            {/* Results Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Crawl Results</h2>
                                <p className="text-gray-400">Review and analyze the extracted cybersecurity intelligence</p>
                              </div>
                            </div>

                            {/* Results Tabs */}
                            <div className="bg-gray-800/30 rounded-xl p-1">
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => setResultsTab('filtered')}
                                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    resultsTab === 'filtered'
                                      ? 'bg-blue-600 text-white shadow-lg'
                                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                  }`}
                                >
                                  Filtered Results ({state.rawItems.length})
                                </button>
                                <button 
                                  onClick={() => setResultsTab('processed')}
                                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    resultsTab === 'processed'
                                      ? 'bg-blue-600 text-white shadow-lg'
                                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                  }`}
                                >
                                  Cybersecurity Articles ({state.processedArticles.length})
                                </button>
                              </div>
                            </div>

                            {/* Results Content */}
                            {resultsTab === 'filtered' ? (
                              <FilteredResultsDisplay 
                                filteredData={state.rawItems}
                                onExport={handleExportData}
                              />
                            ) : (
                              <ProcessedResultsDisplay 
                                processedData={state.processedArticles}
                                onExport={handleExportData}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 text-gray-400 text-sm">
              <p>
                MIS2 Crawler v2.0 - Powered by Crawlee, Playwright, and GPT-4 
                {state.isConnected && <span className="text-green-400 ml-2">● Backend Connected</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}