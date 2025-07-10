import { io, Socket } from 'socket.io-client';
import { CrawlConfig, CrawlLog, CrawlStats, Screenshot, RawContentItem, ProcessedArticle } from '../types/crawling';

type CrawlEventHandlers = {
  onLog: (log: CrawlLog) => void;
  onProgress: (stats: CrawlStats) => void;
  onPhase: (phase: string) => void;
  onScreenshot: (screenshot: Screenshot) => void;
  onRawItem: (item: RawContentItem) => void;
  onProcessedItem: (article: ProcessedArticle) => void;
  onCompleted: (result: { success: boolean; error?: string }) => void;
  onError: (error: { error: string }) => void;
};

export class WebSocketCrawlerService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private handlers: Partial<CrawlEventHandlers> = {};

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.serverUrl, {
        timeout: 10000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('Connected to crawler backend');
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Failed to connect to crawler backend:', error);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.handlers = {};
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Listen for crawler events
    this.socket.on('crawl:log', (log: CrawlLog) => {
      this.handlers.onLog?.(log);
    });

    this.socket.on('crawl:progress', ({ stats }: { stats: CrawlStats }) => {
      this.handlers.onProgress?.(stats);
    });

    this.socket.on('crawl:phase', ({ phase }: { phase: string }) => {
      this.handlers.onPhase?.(phase);
    });

    this.socket.on('crawl:screenshot', (screenshot: Screenshot) => {
      this.handlers.onScreenshot?.(screenshot);
    });

    this.socket.on('crawl:raw-item', (item: RawContentItem) => {
      this.handlers.onRawItem?.(item);
    });

    this.socket.on('crawl:processed-item', (article: ProcessedArticle) => {
      this.handlers.onProcessedItem?.(article);
    });

    this.socket.on('crawl:completed', (result: { success: boolean; error?: string }) => {
      this.handlers.onCompleted?.(result);
    });

    this.socket.on('crawl:error', (error: { error: string }) => {
      this.handlers.onError?.(error);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from crawler backend');
    });
  }

  setEventHandlers(handlers: Partial<CrawlEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  startCrawl(urls: string[], config: CrawlConfig): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to crawler backend');
    }

    console.log('Starting crawl with URLs:', urls);
    this.socket.emit('crawl:start', { urls, config });
  }

  cancelCrawl(): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('Cancelling crawl');
    this.socket.emit('crawl:cancel');
  }

  clearScreenshots(): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('Clearing screenshots');
    this.socket.emit('crawl:clear-screenshots');
  }

  async fetchConfigs(): Promise<{
    default: CrawlConfig;
    bloomberg: CrawlConfig;
    fast: CrawlConfig;
  } | null> {
    try {
      const response = await fetch(`${this.serverUrl}/api/configs`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch configs from backend:', error);
      return null;
    }
  }

  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    activeCrawlers: number;
  } | null> {
    try {
      const response = await fetch(`${this.serverUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to check backend health:', error);
      return null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
export const crawlerService = new WebSocketCrawlerService(); 