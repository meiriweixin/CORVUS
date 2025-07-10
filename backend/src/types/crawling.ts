export interface CrawlConfig {
  maxConcurrency: number;
  maxRequestsPerCrawl: number;
  maxRequestRetries: number;
  requestHandlerTimeoutSecs: number;
  headless: boolean;
  maxSessionsPerCrawler: number;
  useSessionPool: boolean;
  sessionPoolMaxPoolSize: number;
  persistCookiesPerSession: boolean;
  maxCrawlingDepth: number;
  sameDomainDelay: number;
  requestDelay: number;
  enableJavaScript: boolean;
  enableImages: boolean;
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  enableScreenshots: boolean;
  screenshotQuality: number;
  enableAIProcessing: boolean;
  openaiApiKey?: string;
  azureOpenaiApiKey?: string;
  azureOpenaiEndpoint?: string;
  azureOpenaiDeploymentName?: string;
  useAzureOpenAI: boolean;
}

export interface CrawlLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  url?: string;
  details?: any;
}

export interface CrawlStats {
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  screenshotsTaken: number;
  scrollAttempts: number;
  rawItemsExtracted: number;
  filteredItems: number;
  cybersecurityArticles: number;
  totalTime?: number;
  finalStatus?: string;
}

export interface Screenshot {
  data: string; // base64 encoded image
  timestamp: number;
  size: number;
}

export interface RawContentItem {
  type: 'link' | 'article' | 'headline' | 'clickable';
  title: string;
  url: string;
  content: string;
  description?: string;
  index: number;
  sourceUrl: string;
  crawledDate: string;
  pageNumber: number;
  contentLength: number;
  sourcePage: string;
  selector?: string;
}

export enum CyberEventType {
  CYBER_ATTACK = 'CYBER_ATTACK',
  DATA_BREACH = 'DATA_BREACH',
  MALWARE_CAMPAIGN = 'MALWARE_CAMPAIGN',
  VULNERABILITY_DISCLOSURE = 'VULNERABILITY_DISCLOSURE',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
  UNKNOWN = 'UNKNOWN'
}

export interface ProcessedArticle extends RawContentItem {
  articleTitle: string;
  articleSummary: string;
  articleDate?: string;
  articleCrawledDate: string;
  published: string;
  site: string;
  keywords: string[];
  cybersecurityTopics: string[];
  cybersecurityRelevant: boolean;
  riskScore: number;
  eventType: CyberEventType;
  attacker: string;
  victim: string;
  victimCountry: string;
  vulnerabilities: string[];
  impact: 'high' | 'medium' | 'low';
  isKeppelVendor: boolean;
  isKeppelCustomer: boolean;
  keppelVulnerable: boolean;
  targetsKeppelSectors: boolean;
  confidenceScore: number;
  relevanceScore: number;
  summary: string;
}

// Component Props Interfaces
export interface URLInputProps {
  onSubmit: (urls: string[], config: CrawlConfig) => void;
  isLoading: boolean;
}

export interface CrawlProgressProps {
  isActive: boolean;
  stats: CrawlStats;
  logs: CrawlLog[];
  screenshots: Screenshot[];
  currentPhase: 'idle' | 'initializing' | 'crawling' | 'processing' | 'saving' | 'completed' | 'error';
  onCancel: () => void;
  onClearScreenshots: () => void;
  onDownloadScreenshot: (screenshot: Screenshot) => void;
}

export interface FilteredResultsProps {
  items: RawContentItem[];
  onExport: (format: 'json' | 'csv') => void;
}

export interface ProcessedResultsProps {
  articles: ProcessedArticle[];
  onExport: (format: 'json' | 'csv') => void;
}

// Additional types needed for crawler
export interface CrawlUpdate {
  type: 'log' | 'stats' | 'progress' | 'screenshot' | 'data' | 'complete' | 'error' | 'database-save';
  payload: any;
  timestamp: string;
}

export interface DatabaseSaveResult {
  articlesSaved: number;
  analysesSaved: number;
  errors?: string[];
}

export interface CrawlResult {
  success: boolean;
  error?: string;
  rawData: RawContentItem[];
  filteredData: FilteredContentItem[];
  cybersecurityData: ProcessedArticle[];
  stats: CrawlStats;
  logs: CrawlLog[];
  screenshots: Record<string, Screenshot>;
  databaseSaveResult?: DatabaseSaveResult;
}

export interface FilteredContentItem extends RawContentItem {
  // Additional filtering metadata can be added here
}

// WebSocket Events
export interface WebSocketEvents {
  // Client to Server
  'crawl:start': { urls: string[]; config: CrawlConfig };
  'crawl:cancel': {};
  'crawl:clear-screenshots': {};
  
  // Server to Client
  'crawl:progress': { stats: CrawlStats };
  'crawl:log': CrawlLog;
  'crawl:phase': { phase: string };
  'crawl:screenshot': Screenshot;
  'crawl:raw-item': RawContentItem;
  'crawl:processed-item': ProcessedArticle;
  'crawl:database-save': DatabaseSaveResult;
  'crawl:completed': { success: boolean; error?: string; databaseSaveResult?: DatabaseSaveResult };
  'crawl:error': { error: string };
} 