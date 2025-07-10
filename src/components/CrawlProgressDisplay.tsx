import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2Icon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  CameraIcon,
  TrashIcon,
  EyeIcon,
  DownloadIcon,
  PauseIcon,
  ClockIcon,
  DatabaseIcon,
  ZapIcon,
  FileTextIcon,
  BrainIcon,
  ServerIcon
} from 'lucide-react';
import { CrawlProgressProps, CrawlLog, Screenshot } from '../types/crawling';
import { ScreenshotModal } from './ScreenshotModal';

export const CrawlProgressDisplay: React.FC<CrawlProgressProps> = ({
  progress,
  onCancel,
  onDeleteScreenshot
}) => {
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true);
  const [modalScreenshot, setModalScreenshot] = useState<{id: string, data: Screenshot} | null>(null);

  // Auto-cleanup screenshots older than 5 minutes
  useEffect(() => {
    if (!autoCleanupEnabled) return;

    const cleanup = () => {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      Object.entries(progress.screenshots).forEach(([id, screenshot]) => {
        if (screenshot.timestamp < fiveMinutesAgo) {
          onDeleteScreenshot?.(id);
        }
      });
    };

    const interval = setInterval(cleanup, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [progress.screenshots, autoCleanupEnabled, onDeleteScreenshot]);

  const getStatusIcon = (level: CrawlLog['level'], message: string, isCompleted: boolean) => {
    // If crawl is completed, don't show spinning icons
    if (isCompleted && level === 'INFO') {
      return <CheckIcon size={16} className="text-blue-500" />;
    }
    
    switch (level) {
      case 'SUCCESS':
        return <CheckIcon size={16} className="text-green-500" />;
      case 'ERROR':
        return <XIcon size={16} className="text-red-500" />;
      case 'WARNING':
        return <AlertTriangleIcon size={16} className="text-yellow-500" />;
      default:
        return <Loader2Icon size={16} className="text-blue-500 animate-spin" />;
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'initializing':
        return <ServerIcon size={20} className="text-blue-400" />;
      case 'crawling':
        return <Loader2Icon size={20} className="text-purple-400 animate-spin" />;
      case 'processing':
        return <BrainIcon size={20} className="text-yellow-400" />;
      case 'saving':
        return <DatabaseIcon size={20} className="text-green-400" />;
      case 'completed':
        return <CheckIcon size={20} className="text-green-500" />;
      case 'error':
        return <XIcon size={20} className="text-red-500" />;
      default:
        return <ZapIcon size={20} className="text-gray-400" />;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'initializing':
        return 'Initializing Crawler';
      case 'crawling':
        return 'Crawling Website';
      case 'processing':
        return 'Processing with AI';
      case 'saving':
        return 'Saving to Database';
      case 'completed':
        return 'Crawl Completed';
      case 'error':
        return 'Error Occurred';
      default:
        return 'Unknown Phase';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  const downloadScreenshot = useCallback((id: string, screenshot: Screenshot) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${screenshot.data}`;
    link.download = `screenshot_${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const openScreenshotModal = useCallback((id: string, screenshot: Screenshot) => {
    setModalScreenshot({ id, data: screenshot });
  }, []);

  const closeScreenshotModal = useCallback(() => {
    setModalScreenshot(null);
  }, []);

  const recentLogs = showAllLogs ? progress.logs : progress.logs.slice(-10);
  const screenshotEntries = Object.entries(progress.screenshots || {});

  return (
    <div className="w-full space-y-6">
        {/* Main Progress Card */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Advanced Crawling in Progress
            </h2>
            {onCancel && progress.status !== 'completed' && progress.status !== 'error' && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 flex items-center space-x-2 transition-all"
              >
                <PauseIcon size={16} />
                <span>Cancel Crawl</span>
              </button>
            )}
          </div>

          {/* Current Phase */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              {getPhaseIcon(progress.status)}
              <span className="text-lg font-medium">{getPhaseLabel(progress.status)}</span>
            </div>
            {progress.currentUrl && (
              <div className="text-sm text-gray-400">
                Processing: <span className="text-blue-300">{progress.currentUrl}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-sm">
              <span>Overall Progress</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
              <div className="text-sm text-gray-400">Pages Crawled</div>
              <div className="text-2xl font-bold">{progress.stats.totalPages}</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
              <div className="text-sm text-gray-400">Raw Items</div>
              <div className="text-2xl font-bold">{progress.stats.rawItemsExtracted}</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
              <div className="text-sm text-gray-400">Filtered Items</div>
              <div className="text-2xl font-bold">{progress.filteredData.length}</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
              <div className="text-sm text-gray-400">Cyber Articles</div>
              <div className="text-2xl font-bold text-green-500">
                {progress.processedData.length}
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center text-sm text-gray-400 animate-pulse">
            {progress.status === 'crawling' && "Extracting content and analyzing web pages..."}
            {progress.status === 'processing' && "Processing content with AI for cybersecurity relevance..."}
            {progress.status === 'saving' && "Saving processed data to database..."}
            {progress.status === 'completed' && "Crawl completed successfully!"}
            {progress.status === 'error' && "An error occurred during crawling."}
          </div>
        </div>

        {/* Screenshots Section */}
        {screenshotEntries.length > 0 && (
          <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <CameraIcon size={20} className="mr-2" />
                Screenshots ({screenshotEntries.length})
              </h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoCleanupEnabled}
                    onChange={(e) => setAutoCleanupEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <ClockIcon size={16} className="text-gray-400" />
                  <span className="text-gray-300">Auto-cleanup (5min)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {screenshotEntries.map(([id, screenshot]) => (
                <div key={id} className="bg-gray-900/50 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">{id}</div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setExpandedScreenshot(expandedScreenshot === id ? null : id)}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Toggle Preview"
                      >
                        <EyeIcon size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => openScreenshotModal(id, screenshot)}
                        className="p-1.5 hover:bg-blue-600/20 rounded-lg transition-colors"
                        title="View Full Size"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-400">
                          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => downloadScreenshot(id, screenshot)}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Download Screenshot"
                      >
                        <DownloadIcon size={16} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => onDeleteScreenshot?.(id)}
                        className="p-1.5 hover:bg-red-600/20 rounded-lg transition-colors"
                        title="Delete Screenshot"
                      >
                        <TrashIcon size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Size: {formatFileSize(screenshot.size)}</div>
                    <div>Taken: {formatTimeAgo(screenshot.timestamp)}</div>
                  </div>

                  {expandedScreenshot === id && (
                    <div className="mt-3">
                      <img
                        src={`data:image/png;base64,${screenshot.data}`}
                        alt={`Screenshot ${id}`}
                        className="w-full h-auto rounded-lg border border-white/10 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => openScreenshotModal(id, screenshot)}
                        title="Click to view in modal"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Logs Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center">
              <FileTextIcon size={20} className="mr-2" />
              Live Logs ({progress.logs.length})
            </h3>
            <button
              onClick={() => setShowAllLogs(!showAllLogs)}
              className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 border border-white/10 rounded-lg text-sm transition-colors"
            >
              {showAllLogs ? 'Show Recent' : 'Show All'}
            </button>
          </div>

          <div className="bg-gray-900/50 rounded-xl border border-white/5 max-h-80 overflow-y-auto">
            <div className="divide-y divide-white/5">
              {recentLogs.slice().reverse().map((log, index) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 hover:bg-gray-800/30">
                  <div className="mt-1">{getStatusIcon(log.level, log.message, progress.status === 'completed')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        log.level === 'ERROR' ? 'text-red-300' :
                        log.level === 'WARNING' ? 'text-yellow-300' :
                        log.level === 'SUCCESS' ? 'text-green-300' :
                        'text-gray-300'
                      }`}>
                        {log.message}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.url && (
                      <div className="text-xs text-blue-400 mt-1 truncate">
                        {log.url}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Screenshot Modal */}
      <ScreenshotModal
        screenshot={modalScreenshot?.data || null}
        screenshotId={modalScreenshot?.id || null}
        isOpen={modalScreenshot !== null}
        onClose={closeScreenshotModal}
        onDownload={downloadScreenshot}
      />
    </div>
  );
}; 