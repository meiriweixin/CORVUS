import React, { useState, useCallback, useEffect } from 'react';
import { 
  SearchIcon, 
  ArrowRightIcon, 
  GlobeIcon, 
  ShieldIcon, 
  DatabaseIcon, 
  SettingsIcon,
  ChevronDownIcon,
  InfoIcon,
  AlertTriangleIcon,
  ZapIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  NewspaperIcon,
  BuildingIcon
} from 'lucide-react';
import { URLInputProps, CrawlConfig } from '../types/crawling';
import { crawlerService } from '../services/websocketService';

interface PredefinedSite {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  description: string;
  config: Partial<CrawlConfig>;
}

export const EnhancedURLInput: React.FC<URLInputProps> = ({ onSubmit, isLoading = false }) => {
  const [url, setUrl] = useState('');
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customConfig, setCustomConfig] = useState<Partial<CrawlConfig>>({});
  const [selectedPreset, setSelectedPreset] = useState<'default' | 'bloomberg' | 'fast'>('default');
  const [configs, setConfigs] = useState<{
    default: CrawlConfig;
    bloomberg: CrawlConfig;
    fast: CrawlConfig;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch configurations from backend
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const backendConfigs = await crawlerService.fetchConfigs();
        if (backendConfigs) {
          setConfigs(backendConfigs);
        } else {
          // Fallback to default configurations if backend is not available
          setConfigs({
            default: getDefaultConfig(),
            bloomberg: getBloombergConfig(),
            fast: getFastConfig()
          });
        }
      } catch (error) {
        console.error('Failed to fetch configurations:', error);
        // Use fallback configurations
        setConfigs({
          default: getDefaultConfig(),
          bloomberg: getBloombergConfig(),
          fast: getFastConfig()
        });
      }
    };

    fetchConfigs();
  }, []);

  // Default configurations (fallback) - fixed to match actual CrawlConfig interface
  const getDefaultConfig = (): CrawlConfig => ({
    headless: true,
    maxRequestsPerCrawl: 50,
    navigationTimeout: 30000,
    pageLoadTimeout: 30000,
    maxPaginationPages: 3,
    maxScrollAttempts: 5,
    screenshotTimeout: 10000,
    scrollDelay: 1000,
    paginationDelay: 2000,
    botDetectionBypass: true,
    extractAllContent: true,
    takeScreenshots: true,
    cybersecurityFilter: true,
    dateFilter: true,
    aiBatchSize: 10,
    maxAiBatches: 5,
    retryOnTimeout: true,
    maxRetries: 3,
    stealthMode: true,
    randomDelays: true,
    rotateUserAgents: true,
    humanBehavior: true,
    siteSpecificBehavior: true
  });

  const getBloombergConfig = (): CrawlConfig => ({
    ...getDefaultConfig(),
    headless: false,
    maxRequestsPerCrawl: 3,
    navigationTimeout: 60000,
    pageLoadTimeout: 60000,
    scrollDelay: 3000,
    paginationDelay: 5000,
    takeScreenshots: false,
    stealthMode: true,
    humanBehavior: true
  });

  const getFastConfig = (): CrawlConfig => ({
    ...getDefaultConfig(),
    maxRequestsPerCrawl: 100,
    navigationTimeout: 15000,
    pageLoadTimeout: 15000,
    scrollDelay: 500,
    paginationDelay: 1000,
    takeScreenshots: true,
    stealthMode: false,
    randomDelays: false
  });

  // Updated predefined sites with user's 12 URLs
  const predefinedSites: PredefinedSite[] = [
    {
      id: 'bleepingcomputer',
      name: 'BleepingComputer',
      url: 'https://www.bleepingcomputer.com/',
      icon: <ShieldIcon size={16} />,
      description: 'General Cybersecurity News, Cyber Incidents, Vulnerability Disclosures',
      config: configs?.fast || getFastConfig()
    },
    {
      id: 'thehackernews',
      name: 'The Hacker News',
      url: 'https://thehackernews.com/',
      icon: <ZapIcon size={16} />,
      description: 'General Cybersecurity News, Vulnerabilities, Cyber Campaigns',
      config: configs?.fast || getFastConfig()
    },
    {
      id: 'csa-sg',
      name: 'CSA Singapore',
      url: 'https://www.csa.gov.sg/alerts-and-advisories',
      icon: <AlertTriangleIcon size={16} />,
      description: 'Regulator Alerts and Advisories',
      config: configs?.default || getDefaultConfig()
    },
    {
      id: 'cisa-gov',
      name: 'CISA Advisories',
      url: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
      icon: <ShieldIcon size={16} />,
      description: 'CISA Analysis Reports, Cybersecurity Advisories, Cyber Campaigns',
      config: configs?.default || getDefaultConfig()
    },
    {
      id: 'microsoft-security',
      name: 'Microsoft Security',
      url: 'https://microsoft.com/en-us/security/blog/topic/threat-intelligence/',
      icon: <BuildingIcon size={16} />,
      description: 'Vendor Threat Intel Research, Cyberespionage Operations, Infostealer Malware',
      config: configs?.default || getDefaultConfig()
    },
    {
      id: 'google-threat-intel',
      name: 'Google Cloud Threat Intel',
      url: 'https://cloud.google.com/blog/topics/threat-intelligence',
      icon: <DatabaseIcon size={16} />,
      description: 'Vendor Threat Intel Research, Trend Reports, Cyber Campaigns',
      config: configs?.default || getDefaultConfig()
    },
    {
      id: 'palo-alto-unit42',
      name: 'Palo Alto Unit 42',
      url: 'https://unit42.paloaltonetworks.com/category/threat-research/',
      icon: <ShieldIcon size={16} />,
      description: 'Vendor Threat Intel Research, Cloud Cybersecurity, Malware, Threat Research',
      config: configs?.default || getDefaultConfig()
    },
    {
      id: 'talos-intel',
      name: 'Talos Intelligence',
      url: 'https://blog.talosintelligence.com/',
      icon: <DatabaseIcon size={16} />,
      description: 'Vendor Threat Intel Research, Cloud Cybersecurity, Malware, Threat Research, Vulnerabilities',
      config: configs?.default || getDefaultConfig()
    },
    {
      id: 'crowdstrike',
      name: 'CrowdStrike',
      url: 'https://www.crowdstrike.com/en-us/blog/category.counter-adversary-operations/',
      icon: <ShieldIcon size={16} />,
      description: 'Vendor Threat Intel Research, Threat Landscape Reports',
      config: configs?.default || getDefaultConfig()
    },
    {
      id: 'straits-times',
      name: 'The Straits Times',
      url: 'https://www.straitstimes.com/',
      icon: <NewspaperIcon size={16} />,
      description: 'General News on Cyber Incidents',
      config: configs?.fast || getFastConfig()
    },
    {
      id: 'channel-news-asia',
      name: 'Channel NewsAsia',
      url: 'https://www.channelnewsasia.com/',
      icon: <NewspaperIcon size={16} />,
      description: 'General News on Cyber Incidents',
      config: configs?.fast || getFastConfig()
    },
    {
      id: 'bloomberg-tech',
      name: 'Bloomberg Technology',
      url: 'https://www.bloomberg.com/technology',
      icon: <BuildingIcon size={16} />,
      description: 'General News on Cyber Incidents',
      config: configs?.bloomberg || getBloombergConfig()
    }
  ];

  const configPresets = {
    default: {
      name: 'Default',
      description: 'Balanced crawling with moderate stealth',
      config: configs?.default || getDefaultConfig()
    },
    bloomberg: {
      name: 'Bloomberg/Strict Sites',
      description: 'Enhanced stealth for financial/strict sites',
      config: configs?.bloomberg || getBloombergConfig()
    },
    fast: {
      name: 'Fast Crawling',
      description: 'Optimized for speed on regular sites',
      config: configs?.fast || getFastConfig()
    }
  };

  // Pagination logic for horizontal scrolling
  const sitesPerPage = 6;
  const totalPages = Math.ceil(predefinedSites.length / sitesPerPage);
  const currentSites = predefinedSites.slice(
    currentPage * sitesPerPage,
    (currentPage + 1) * sitesPerPage
  );

  const toggleSite = useCallback((siteId: string) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  }, []);

  const handlePresetChange = useCallback((preset: 'default' | 'bloomberg' | 'fast') => {
    setSelectedPreset(preset);
    setCustomConfig(configPresets[preset].config);
  }, [configs]);

  const handleConfigChange = useCallback((key: keyof CrawlConfig, value: any) => {
    setCustomConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Build final configuration
    const baseConfig = configPresets[selectedPreset].config;
    const finalConfig: CrawlConfig = { ...baseConfig, ...customConfig };
    
    if (url.trim()) {
      // Single URL crawl
      onSubmit([url.trim()], finalConfig);
    } else if (selectedSites.length > 0) {
      // Multiple predefined sites
      const selectedSiteObjects = predefinedSites.filter(site => selectedSites.includes(site.id));
      const urls = selectedSiteObjects.map(site => site.url);
      
      onSubmit(urls, finalConfig);
    }
  }, [url, selectedSites, customConfig, selectedPreset, onSubmit, predefinedSites, configPresets]);

  const canSubmit = !isLoading && (url.trim() || selectedSites.length > 0);

  // Show loading state while configurations are being fetched
  if (!configs) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading crawler configurations...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* URL Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                <SearchIcon size={20} className="mr-2" />
                Target URL
              </h3>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <GlobeIcon size={20} className="text-gray-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL to crawl for cybersecurity intelligence..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-700/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-lg"
                  disabled={isLoading}
                />
              </div>
              
              <div className="text-sm text-gray-400 flex items-center">
                <InfoIcon size={16} className="mr-2" />
                Enter a complete URL (e.g., https://example.com) or select from predefined sources below
              </div>
            </div>

            {/* Predefined Sites Section with Horizontal Scrolling */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                  <ShieldIcon size={20} className="mr-2" />
                  Cybersecurity Sources
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0 || isLoading}
                    className="p-2 rounded-lg border border-white/10 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1 || isLoading}
                    className="p-2 rounded-lg border border-white/10 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentSites.map(site => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => toggleSite(site.id)}
                    disabled={isLoading}
                    className={`flex flex-col p-4 rounded-xl border transition-all duration-200 ${
                      selectedSites.includes(site.id)
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-white/10 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50 hover:border-white/20'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center">
                        <span className="mr-3">{site.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-sm">{site.name}</div>
                        </div>
                      </div>
                      {selectedSites.includes(site.id) && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <div className="text-xs opacity-70 text-left line-clamp-2">
                      {site.description}
                    </div>
                    <div className="text-xs opacity-50 text-left mt-1 truncate">
                      {site.url.replace('https://', '')}
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedSites.length > 0 && (
                <div className="text-sm text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <InfoIcon size={16} className="inline mr-2" />
                  {selectedSites.length} source{selectedSites.length > 1 ? 's' : ''} selected. Crawling will be performed sequentially.
                </div>
              )}
            </div>

            {/* Advanced Configuration */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                disabled={isLoading}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ChevronDownIcon 
                  size={20} 
                  className={`mr-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
                />
                Advanced Configuration
              </button>
              
              {showAdvanced && (
                <div className="bg-gray-900/50 border border-white/5 rounded-xl p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Pages to Crawl
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={customConfig.maxRequestsPerCrawl || 50}
                        onChange={(e) => handleConfigChange('maxRequestsPerCrawl', parseInt(e.target.value))}
                        disabled={isLoading}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Navigation Timeout (ms)
                      </label>
                      <input
                        type="number"
                        min="10000"
                        max="120000"
                        step="1000"
                        value={customConfig.navigationTimeout || 30000}
                        onChange={(e) => handleConfigChange('navigationTimeout', parseInt(e.target.value))}
                        disabled={isLoading}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Scroll Delay (ms)
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="10000"
                        step="100"
                        value={customConfig.scrollDelay || 1000}
                        onChange={(e) => handleConfigChange('scrollDelay', parseInt(e.target.value))}
                        disabled={isLoading}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Retries
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={customConfig.maxRetries || 3}
                        onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value))}
                        disabled={isLoading}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={customConfig.takeScreenshots ?? true}
                        onChange={(e) => handleConfigChange('takeScreenshots', e.target.checked)}
                        disabled={isLoading}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Take Screenshots</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={customConfig.cybersecurityFilter ?? true}
                        onChange={(e) => handleConfigChange('cybersecurityFilter', e.target.checked)}
                        disabled={isLoading}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Cybersecurity Filter</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={customConfig.stealthMode ?? true}
                        onChange={(e) => handleConfigChange('stealthMode', e.target.checked)}
                        disabled={isLoading}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Stealth Mode</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={customConfig.headless ?? true}
                        onChange={(e) => handleConfigChange('headless', e.target.checked)}
                        disabled={isLoading}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Headless Mode</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`px-8 py-4 rounded-xl text-white font-medium flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg ${
                  canSubmit
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/20'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Crawling in Progress...</span>
                  </>
                ) : (
                  <>
                    <span>Start Advanced Crawl</span>
                    <ArrowRightIcon size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Status Information */}
          <div className="mt-6 text-center text-sm text-gray-400">
            {url.trim() && (
              <div className="mb-2">
                Target: <span className="text-blue-300">{url}</span>
              </div>
            )}
            {selectedSites.length > 0 && (
              <div className="mb-2">
                Sources: <span className="text-purple-300">{selectedSites.length} selected</span>
              </div>
            )}
          </div>
    </div>
  );
}; 