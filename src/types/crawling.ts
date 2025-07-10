export interface CrawlConfig {
  headless?: boolean;
  maxRequestsPerCrawl?: number;
  navigationTimeout?: number;
  pageLoadTimeout?: number;
  maxPaginationPages?: number;
  maxScrollAttempts?: number;
  screenshotTimeout?: number;
  scrollDelay?: number;
  paginationDelay?: number;
  botDetectionBypass?: boolean;
  extractAllContent?: boolean;
  takeScreenshots?: boolean;
  cybersecurityFilter?: boolean;
  dateFilter?: boolean;
  aiBatchSize?: number;
  maxAiBatches?: number;
  retryOnTimeout?: boolean;
  maxRetries?: number;
  stealthMode?: boolean;
  randomDelays?: boolean;
  rotateUserAgents?: boolean;
  humanBehavior?: boolean;
  siteSpecificBehavior?: boolean;
}

export interface CrawlLog {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  url?: string;
  id: string;
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

export interface FilteredContentItem extends RawContentItem {
  // Additional filtering metadata can be added here
}

export interface ThreatAnalysis {
  riskScore: number;
  eventType: CyberEventType;
  attacker?: string;
  victim?: string;
  vulnerabilities: string[];
  isKeppelVendor: boolean;
  isKeppelCustomer: boolean;
  keppelVulnerable: boolean;
  targetsKeppelSectors: boolean;
  confidenceScore: number;
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

export enum CyberEventType {
  CYBER_ATTACK = 'CYBER_ATTACK',
  DATA_BREACH = 'DATA_BREACH',
  MALWARE_CAMPAIGN = 'MALWARE_CAMPAIGN',
  VULNERABILITY_DISCLOSURE = 'VULNERABILITY_DISCLOSURE',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
  UNKNOWN = 'UNKNOWN'
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

export interface CrawlProgress {
  status: 'idle' | 'initializing' | 'crawling' | 'processing' | 'saving' | 'completed' | 'error';
  progress: number;
  currentUrl?: string;
  currentPage?: number;
  stats: CrawlStats;
  logs: CrawlLog[];
  screenshots: Record<string, Screenshot>;
  rawData: RawContentItem[];
  filteredData: FilteredContentItem[];
  processedData: ProcessedArticle[];
}

export interface CrawlerState {
  isActive: boolean;
  progress: CrawlProgress;
  result?: CrawlResult;
  abortController?: AbortController;
}

export interface DatabaseSaveResult {
  articlesSaved: number;
  analysesSaved: number;
  errors?: string[];
}

// OpenAI Integration Types
export interface OpenAIConfig {
  apiKey?: string;
  endpoint?: string;
  deploymentName?: string;
  apiVersion?: string;
  model?: string;
}

export interface AIBatchRequest {
  items: RawContentItem[];
  batchNumber: number;
  totalBatches: number;
}

export interface AIBatchResponse {
  cybersecurityItems: ProcessedArticle[];
  batchNumber: number;
  processingTime: number;
  errors?: string[];
}

// UI Component Props
export interface URLInputProps {
  onSubmit: (urls: string[], config: CrawlConfig) => void;
  isLoading?: boolean;
}

export interface CrawlProgressProps {
  progress: CrawlProgress;
  onCancel?: () => void;
  onDeleteScreenshot?: (screenshotId: string) => void;
}

export interface ResultsDisplayProps {
  rawData: RawContentItem[];
  filteredData: FilteredContentItem[];
  processedData: ProcessedArticle[];
  isLoading?: boolean;
  onExport?: (data: any) => void;
}

// Predefined crawling targets
export interface PredefinedSite {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
  config?: Partial<CrawlConfig>;
}

// Real-time updates
export interface CrawlUpdate {
  type: 'log' | 'progress' | 'screenshot' | 'data' | 'stats' | 'error' | 'complete' | 'database-save';
  payload: any;
  timestamp: string;
} 