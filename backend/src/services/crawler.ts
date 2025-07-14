import { PlaywrightCrawler, type PlaywrightCrawlingContext } from 'crawlee';
import { Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import {
  CrawlConfig,
  CrawlLog,
  CrawlStats,
  Screenshot,
  RawContentItem,
  FilteredContentItem,
  ProcessedArticle,
  CrawlResult,
  CyberEventType,
  CrawlUpdate,
  DatabaseSaveResult
} from '../types/crawling';
import { getDatabaseService } from './database';

export class AdvancedCrawleeCrawler {
  private config: CrawlConfig;
  private crawlData: RawContentItem[] = [];
  private crawlLogs: CrawlLog[] = [];
  private crawlStats: CrawlStats;
  private screenshots: Record<string, Screenshot> = {};
  private crawler?: PlaywrightCrawler;
  private aiClient?: OpenAI;
  private updateCallback?: (update: CrawlUpdate) => void;
  private abortController?: AbortController;
  private sharedBrowser?: any; // Shared browser for full text extraction
  private isAiClientInitialized: boolean = false; // Track initialization

  constructor(config?: Partial<CrawlConfig>, updateCallback?: (update: CrawlUpdate) => void) {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.updateCallback = updateCallback;
    this.crawlStats = this.getInitialStats();
    this.aiClient = this.initializeAIClient();
    
    this.addLog('INFO', `Advanced Crawlee Crawler initialized`);
  }

  private getDefaultConfig(): CrawlConfig {
    return {
      maxConcurrency: 5,
      maxRequestsPerCrawl: 50,
      maxRequestRetries: 3,
      requestHandlerTimeoutSecs: 180,
      headless: true,
      maxSessionsPerCrawler: 1,
      useSessionPool: true,
      sessionPoolMaxPoolSize: 10,
      persistCookiesPerSession: true,
      maxCrawlingDepth: 3,
      sameDomainDelay: 1000,
      requestDelay: 500,
      enableJavaScript: true,
      enableImages: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewportWidth: 1920,
      viewportHeight: 1080,
      enableScreenshots: true,
      screenshotQuality: 80,
      enableAIProcessing: true,
      useAzureOpenAI: true
    };
  }

  private getInitialStats(): CrawlStats {
    return {
      totalPages: 0,
      successfulPages: 0,
      failedPages: 0,
      screenshotsTaken: 0,
      scrollAttempts: 0,
      rawItemsExtracted: 0,
      filteredItems: 0,
      cybersecurityArticles: 0
    };
  }

  private initializeAIClient(): OpenAI | undefined {
    // Only log once per instance
    if (!this.isAiClientInitialized) {
      if (this.config.useAzureOpenAI && this.config.azureOpenaiApiKey && this.config.azureOpenaiEndpoint) {
        this.addLog('INFO', 'Using Azure OpenAI client for content transformation');
        this.isAiClientInitialized = true;
        return new OpenAI({
          apiKey: this.config.azureOpenaiApiKey,
          baseURL: `${this.config.azureOpenaiEndpoint}/openai/deployments/${this.config.azureOpenaiDeploymentName || 'gpt-4'}`,
          defaultQuery: { 'api-version': '2024-10-21' },
          defaultHeaders: {
            'api-key': this.config.azureOpenaiApiKey,
          },
        });
      } else if (this.config.openaiApiKey) {
        this.addLog('INFO', 'Using OpenAI client for content transformation');
        this.isAiClientInitialized = true;
        return new OpenAI({ apiKey: this.config.openaiApiKey });
      } else {
        this.addLog('WARNING', 'No AI client configured - will extract all content without AI processing');
        this.isAiClientInitialized = true;
        return undefined;
      }
    }
    
    // Return existing client or recreate silently
    if (this.config.useAzureOpenAI && this.config.azureOpenaiApiKey && this.config.azureOpenaiEndpoint) {
      return new OpenAI({
        apiKey: this.config.azureOpenaiApiKey,
        baseURL: `${this.config.azureOpenaiEndpoint}/openai/deployments/${this.config.azureOpenaiDeploymentName || 'gpt-4'}`,
        defaultQuery: { 'api-version': '2024-10-21' },
        defaultHeaders: {
          'api-key': this.config.azureOpenaiApiKey,
        },
      });
    } else if (this.config.openaiApiKey) {
      return new OpenAI({ apiKey: this.config.openaiApiKey });
    }
    return undefined;
  }

  private addLog(level: CrawlLog['level'], message: string, details?: any): void {
    const logEntry: CrawlLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };
    
    this.crawlLogs.push(logEntry);
    
    // Send real-time update
    this.sendUpdate('log', logEntry);
    
    // Also log to console with proper method mapping
    const consoleMethod = this.getConsoleMethod(level);
    console[consoleMethod](message, details || '');
  }

  private getConsoleMethod(level: CrawlLog['level']): 'log' | 'info' | 'warn' | 'error' {
    switch (level) {
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warn';
      case 'INFO':
        return 'info';
      case 'SUCCESS':
        return 'log';
      default:
        return 'log';
    }
  }

  private sendUpdate(type: CrawlUpdate['type'], payload: any): void {
    if (this.updateCallback) {
      this.updateCallback({
        type,
        payload,
        timestamp: new Date().toISOString()
      });
    }
  }

  public resetForNewCrawl(): void {
    this.crawlData = [];
    this.crawlLogs = [];
    this.crawlStats = this.getInitialStats();
    this.screenshots = {};
    this.crawler = undefined;
    this.abortController = new AbortController();
    // Clean up shared browser if it exists
    this.cleanupSharedBrowser();
    this.addLog('INFO', 'Crawler reset for new crawl');
  }

  private async initializeSharedBrowser(): Promise<any> {
    if (!this.sharedBrowser) {
      try {
        const { chromium } = await import('playwright');
        this.sharedBrowser = await chromium.launch({ 
          headless: this.config.headless,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        });
        this.addLog('INFO', 'Shared browser initialized for full text extraction');
      } catch (error) {
        this.addLog('ERROR', `Failed to initialize shared browser: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }
    }
    return this.sharedBrowser;
  }

  private async cleanupSharedBrowser(): Promise<void> {
    if (this.sharedBrowser) {
      try {
        await this.sharedBrowser.close();
        this.sharedBrowser = undefined;
        this.addLog('INFO', 'Shared browser cleaned up');
      } catch (error) {
        this.addLog('WARNING', `Failed to cleanup shared browser: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private detectStrictSite(url: string): boolean {
    const strictDomains = [
      'bloomberg.com',
      'wsj.com',
      'ft.com',
      'reuters.com',
      'nytimes.com',
      'washingtonpost.com',
      'economist.com',
      'forbes.com',
      'cnbc.com',
      'marketwatch.com',
      'barrons.com',
      'investopedia.com'
    ];
    
    const urlLower = url.toLowerCase();
    for (const domain of strictDomains) {
      if (urlLower.includes(domain)) {
        this.addLog('INFO', `Detected strict site: ${domain} - applying enhanced stealth`);
        return true;
      }
    }
    return false;
  }

  private async handlePage(context: PlaywrightCrawlingContext): Promise<void> {
    const url = context.request.url;
    const page = context.page;
    const startTime = Date.now();
    
    try {
      // Check if crawl was aborted
      if (this.abortController?.signal.aborted) {
        throw new Error('Crawl was aborted');
      }

      this.addLog('INFO', `Processing page: ${url}`);
      
      const isStrictSite = this.detectStrictSite(url);
      
      // Apply bot detection bypass
      await this.applyBotDetectionBypass(page);
      
      // Handle page loading
      await this.handlePageLoading(page, url, isStrictSite);
      
      // Handle popups and consents
      await this.handlePopupsAndConsents(page);
      
      // Take screenshot
      if (this.config.enableScreenshots) {
        const screenshotId = await this.takeScreenshot(page, url);
        if (screenshotId) {
          this.addLog('INFO', `Screenshot taken: ${screenshotId}`);
        }
      }
      
      // Extract content
      const pageData = await this.extractPageContent(page, url);
      if (pageData && pageData.length > 0) {
        this.crawlData.push(...pageData);
        this.crawlStats.rawItemsExtracted += pageData.length;
        this.crawlStats.successfulPages += 1;
        this.addLog('SUCCESS', `Extracted ${pageData.length} items from page`);
        
        // Send real-time data update
        this.sendUpdate('data', { newItems: pageData, totalItems: this.crawlData.length });
      } else {
        this.addLog('WARNING', `No content extracted from page`);
      }
      
      const responseTime = Date.now() - startTime;
            this.crawlStats.totalPages += 1;
      this.sendUpdate('stats', this.crawlStats);
      
    } catch (error) {
      this.addLog('ERROR', `Error processing page: ${error instanceof Error ? error.message : String(error)}`, { url });
      this.crawlStats.failedPages += 1;
      this.sendUpdate('stats', this.crawlStats);
    }
  }

  private async handlePageLoading(page: Page, url: string, isStrictSite: boolean): Promise<void> {
    try {
      if (isStrictSite) {
        await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
        this.addLog('INFO', 'DOM content loaded (strict site)', { url });
        await this.sleep(2000);
        
        try {
          await page.waitForLoadState('networkidle', { timeout: 30000 });
          this.addLog('INFO', 'Network idle achieved (strict site)', { url });
        } catch {
          this.addLog('WARNING', 'Network idle timeout - continuing anyway', { url });
        }
        
        await this.sleep(4000);
      } else {
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
        this.addLog('INFO', 'DOM content loaded (fast)', { url });
        await this.sleep(1000);
        
        try {
          await page.waitForLoadState('networkidle', { timeout: 10000 });
          this.addLog('INFO', 'Network idle achieved (fast)', { url });
        } catch {
          this.addLog('INFO', 'Network idle timeout - continuing (fast)', { url });
        }
      }
    } catch (error) {
      this.addLog('WARNING', `Page loading timeout: ${error instanceof Error ? error.message : String(error)} - continuing`, { url });
      await this.sleep(isStrictSite ? 2000 : 500);
    }
  }

  private async applyBotDetectionBypass(page: Page): Promise<void> {
    try {
      await page.addInitScript(`
        // Remove webdriver property completely
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Override automation flags
        delete window.navigator.__webdriver_script_fn;
        delete window.navigator.__webdriver_evaluate;
        delete window.navigator.__webdriver_unwrapped;
        delete window.navigator.__fxdriver_evaluate;
        delete window.navigator.__fxdriver_unwrapped;
        delete window.navigator.__driver_evaluate;
        delete window.navigator.__webdriver_evaluate__;
        delete window.navigator.__selenium_evaluate;
        delete window.navigator.__selenium_unwrapped;
        delete window.navigator.__driver_unwrapped;
        
        // Realistic plugins array
        Object.defineProperty(navigator, 'plugins', {
          get: () => [{
            "0": {
              "type": "application/x-google-chrome-pdf",
              "suffixes": "pdf",
              "description": "Portable Document Format",
              "enabledPlugin": "[object Plugin]"
            },
            "description": "Portable Document Format",
            "filename": "internal-pdf-viewer",
            "length": 1,
            "name": "Chrome PDF Plugin"
          }],
        });
        
        // Enhanced language settings
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'en-GB'],
        });
        
        // Platform info
        Object.defineProperty(navigator, 'platform', {
          get: () => 'Win32',
        });
        
        // User agent override
        Object.defineProperty(navigator, 'userAgent', {
          get: () => '${this.config.userAgent}',
        });
        
        // Chrome object
        window.chrome = {
          runtime: {
            onConnect: undefined,
            onMessage: undefined
          }
        };
        
        // Hardware info
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8,
        });
        
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 8,
        });
      `);
      
      // Set realistic viewport and headers
      await page.setViewportSize({ 
        width: this.config.viewportWidth, 
        height: this.config.viewportHeight 
      });
      
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'User-Agent': this.config.userAgent
      });
      
    } catch (error) {
      this.addLog('WARNING', `Bot detection bypass failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handlePopupsAndConsents(page: Page): Promise<void> {
    const consentSelectors = [
      "button[id*='accept']",
      "button[class*='accept']",
      "button[id*='consent']",
      "button[class*='consent']",
      ".cookie-accept",
      ".consent-accept",
      "#onetrust-accept-btn-handler",
      "button:has-text('Accept')",
      "button:has-text('Accept All')",
      "button:has-text('I Accept')",
      "button:has-text('Agree')",
      "button:has-text('Continue')"
    ];
    
    for (const selector of consentSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          this.addLog('INFO', `Clicked consent button: ${selector}`);
          await this.sleep(1000);
          break;
        }
      } catch {
        continue;
      }
    }
  }

  private async takeScreenshot(page: Page, url: string): Promise<string | null> {
    try {
      const screenshotId = uuidv4();
      const filename = `screenshot_${screenshotId}.png`;
      
      const screenshotBuffer = await page.screenshot({
        fullPage: false,
        type: 'png',
        timeout: 30000
      });
      
      const screenshotBase64 = screenshotBuffer.toString('base64');
      
      const screenshot: Screenshot = {
        data: screenshotBase64,
        timestamp: Date.now(),
        size: screenshotBuffer.length
      };
      
      this.screenshots[screenshotId] = screenshot;
      this.crawlStats.screenshotsTaken += 1;
      
      // Send real-time screenshot update
      this.sendUpdate('screenshot', screenshot);
      
      return screenshotId;
    } catch (error) {
      this.addLog('WARNING', `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async extractPageContent(page: Page, url: string): Promise<RawContentItem[]> {
    try {
      const allContent = await page.evaluate(() => {
        const results: any[] = [];
        
        // Extract all meaningful links
        document.querySelectorAll('a[href]').forEach((link, index) => {
          const element = link as HTMLAnchorElement;
          const href = element.href;
          const text = element.textContent?.trim() || '';
          const title = element.getAttribute('title') || '';
          
          if (href && text && !href.startsWith('javascript:') && text.length > 10) {
            results.push({
              type: 'link',
              title: text,
              url: href,
              content: text,
              description: title,
              index: index,
              sourceUrl: window.location.href
            });
          }
        });
        
        // Extract article-like content
        const articleSelectors = [
          'article', '.article', '.post', '.story', '.item', '.entry',
          '.content-item', '.news-item', '.athing', '.titleline',
          '.storylink', '.storyrow', '[class*="story"]', '[class*="article"]',
          '[class*="post"]', '[class*="item"]'
        ];
        
        articleSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach((element, index) => {
            const titleEl = element.querySelector('h1, h2, h3, h4, .title, .headline, .storylink, a[href]') || 
                           element.querySelector('a');
            const contentEl = element.querySelector('.content, .body, .description, .excerpt, p');
            const linkEl = element.querySelector('a[href]') || titleEl;
            
            const title = titleEl?.textContent?.trim() || '';
            const content = contentEl?.textContent?.trim() || '';
            const link = (linkEl as HTMLAnchorElement)?.href || '';
            
            if (title && title.length > 15) {
              results.push({
                type: 'article',
                title: title,
                content: content || title,
                url: link || window.location.href,
                selector: selector,
                index: index,
                sourceUrl: window.location.href
              });
            }
          });
        });
        
        // Extract headlines
        document.querySelectorAll('h1, h2, h3, h4, h5').forEach((heading, index) => {
          const text = heading.textContent?.trim() || '';
          const link = heading.querySelector('a') || heading.closest('a');
          
          if (text.length > 15) {
            results.push({
              type: 'headline',
              title: text,
              content: text,
              url: (link as HTMLAnchorElement)?.href || window.location.href,
              sourceUrl: window.location.href,
              index: index
            });
          }
        });
        
        return results;
      });
      
      // Convert to RawContentItem format
      const enhancedContent: RawContentItem[] = allContent.map((item, index) => {
        return {
          type: item.type || 'article',
          title: item.title || '',
          url: item.url || url,
          content: item.content || '',
          description: item.description,
          index: index,
          sourceUrl: item.sourceUrl || url,
          crawledDate: new Date().toISOString(),
          pageNumber: 1, // TODO: Track actual page number
          contentLength: (item.content || '').length,
          sourcePage: url,
          selector: item.selector
        };
      });
      
      this.addLog('INFO', `Extracted ${enhancedContent.length} content items from page`);
      return enhancedContent;
      
    } catch (error) {
      this.addLog('ERROR', `Content extraction failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }



  private filterContentForQuality(rawData: RawContentItem[]): FilteredContentItem[] {
    if (!rawData.length) return [];
    
    const socialMediaDomains = [
      'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com',
      'youtube.com', 'tiktok.com', 'pinterest.com', 'snapchat.com', 'reddit.com'
    ];
    
    const unwantedPatterns = [
      'mailto:', 'javascript:', 'tel:', '#', 'about:', 'data:',
      'home', 'subscribe', 'login', 'register', 'contact', 'privacy',
      'terms', 'cookie', 'sitemap', 'rss', 'feed', 'search'
    ];
    
    const filtered = rawData.filter(item => {
      const title = item.title?.trim() || '';
      const url = item.url?.toLowerCase() || '';
      
      if (title.length < 20) return false;
      
      if (socialMediaDomains.some(domain => url.includes(domain))) return false;
      
      if (unwantedPatterns.some(pattern => url.includes(pattern) || title.toLowerCase().includes(pattern))) {
        return false;
      }
      
      if (!url.startsWith('http')) return false;
      
      return true;
    });
    
    this.addLog('INFO', `Content filtering: ${rawData.length} → ${filtered.length} items`);
    this.crawlStats.filteredItems = filtered.length;
    
    return filtered;
  }

  private deduplicateByTitle(items: RawContentItem[]): RawContentItem[] {
    const seen = new Set<string>();
    const deduplicated: RawContentItem[] = [];
    
    for (const item of items) {
      // Create a normalized title for comparison
      const normalizedTitle = item.title?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
      
      // Skip if title is too short or already seen
      if (normalizedTitle.length < 10 || seen.has(normalizedTitle)) {
        continue;
      }
      
      seen.add(normalizedTitle);
      deduplicated.push(item);
    }
    
    this.addLog('INFO', `Deduplication: ${items.length} → ${deduplicated.length} items (removed ${items.length - deduplicated.length} duplicates)`);
    return deduplicated;
  }

  private async processWithAI(rawData: RawContentItem[]): Promise<ProcessedArticle[]> {
    if (!this.aiClient || !this.config.enableAIProcessing) {
      this.addLog('WARNING', 'AI processing disabled or not configured');
      return [];
    }
    
    // Step 1: Filter for quality
    const filteredData = this.filterContentForQuality(rawData);
    if (!filteredData.length) {
      this.addLog('WARNING', 'No content remaining after quality filtering');
      return [];
    }
    
    // Step 2: Deduplicate by title
    const deduplicatedData = this.deduplicateByTitle(filteredData);
    if (!deduplicatedData.length) {
      this.addLog('WARNING', 'No content remaining after deduplication');
      return [];
    }
    
    // Step 3: Limit to max 100 items for AI processing
    const maxItems = 100; 
    const batchSize = 20; // Process 20 items per batch
    
    const itemsToProcess = deduplicatedData.slice(0, maxItems);
    this.addLog('INFO', `AI Processing: ${deduplicatedData.length} deduplicated → ${itemsToProcess.length} items (max ${maxItems})`);
    
    const cybersecurityArticles: ProcessedArticle[] = [];
    
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      // Check if aborted
      if (this.abortController?.signal.aborted) {
        break;
      }
      
      const batch = itemsToProcess.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(itemsToProcess.length / batchSize);
      
      this.addLog('INFO', `Processing AI batch ${batchNumber}/${totalBatches}: ${batch.length} items`);
      
      try {
        const batchResult = await this.processBatchWithAI(batch);
        cybersecurityArticles.push(...batchResult);
        
        this.addLog('SUCCESS', `Batch ${batchNumber}/${totalBatches} completed: ${batchResult.length} cybersecurity articles found`);
        
        // Send progress update
        this.sendUpdate('progress', {
          phase: 'processing',
          itemsProcessed: cybersecurityArticles.length,
          totalItems: itemsToProcess.length,
          batchNumber,
          totalBatches
        });
        
        await this.sleep(1000); // Rate limiting
      } catch (error) {
        this.addLog('ERROR', `AI batch ${batchNumber}/${totalBatches} failed: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }
    
    this.crawlStats.cybersecurityArticles = cybersecurityArticles.length;
    this.addLog('SUCCESS', `AI processing complete: ${itemsToProcess.length} processed → ${cybersecurityArticles.length} cybersecurity articles`);
    
    return cybersecurityArticles;
  }

      private async extractFullTextFromUrl(url: string): Promise<{ fullText: string; publishedDate: string | null }> {
    let page: any = null;
    
    try {
      this.addLog('INFO', `Extracting full text from: ${url}`);
      
      // Use shared browser instead of creating new one
      const browser = await this.initializeSharedBrowser();
      if (!browser) {
        throw new Error('No browser available for content extraction');
      }
      
      page = await browser.newPage();
       
      if (!page) {
        throw new Error('Failed to create new page');
      }
      
      // Navigate to the URL
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Apply bot detection bypass
      await this.applyBotDetectionBypass(page);
      
      // Wait for page to load properly
      await this.sleep(2000);
      
      // Handle popups and consents
      await this.handlePopupsAndConsents(page);
      
      // Extract full text content and published date
      const pageData = await page.evaluate(() => {
        console.log('Starting content extraction...');
        
        // Remove unwanted elements first
        const unwantedSelectors = [
          'script', 'style', 'nav', 'header', 'footer', 'aside', 
          '.advertisement', '.ads', '.social', '.comments', '.sidebar',
          '[class*="ad-"]', '[id*="ad-"]', '[class*="social"]',
          '.cookie-notice', '.popup', '.modal', '.related-articles'
        ];
        
        unwantedSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => el.remove());
          } catch (e) {
            console.warn(`Failed to remove elements with selector: ${selector}`);
          }
        });
        
        // Extract main article content with priority order
        const contentSelectors = [
          'article',
          '[role="main"]', 
          '.article-content', 
          '.post-content',
          '.entry-content', 
          '.content', 
          '.story-body', 
          '.article-body',
          '.post-body', 
          '.main-content', 
          'main', 
          '.article', 
          '.story',
          '.post',
          '.blog-post'
        ];
        
        let fullText = '';
        let foundContent = false;
        
        // Try each selector in priority order
        for (const selector of contentSelectors) {
          const contentEl = document.querySelector(selector);
          if (contentEl) {
            const text = (contentEl as HTMLElement).innerText || contentEl.textContent || '';
            console.log(`Found content with selector "${selector}": ${text.length} characters`);
            
            if (text.length > fullText.length && text.length > 100) {
              fullText = text;
              foundContent = true;
            }
          }
        }
        
        // Enhanced fallback strategies
        if (!foundContent || fullText.length < 200) {
          console.log('No content found with main selectors, trying paragraphs...');
          
          // Try to get content from paragraphs
          const paragraphs = Array.from(document.querySelectorAll('p'));
          const paragraphText = paragraphs
            .map(p => (p as HTMLElement).innerText || p.textContent || '')
            .filter(text => text.length > 50)
            .join(' ');
          
          if (paragraphText.length > fullText.length) {
            fullText = paragraphText;
            foundContent = true;
            console.log(`Found content from paragraphs: ${fullText.length} characters`);
          }
        }
        
        // Final fallback to body (but filter out navigation/menu items)
        if (!foundContent || fullText.length < 100) {
          console.log('Using body content as final fallback...');
          fullText = document.body.innerText || document.body.textContent || '';
        }
        
        // Clean up the text
        fullText = fullText
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, '\n')
          .replace(/\t+/g, ' ')
          .trim();
        
        console.log(`Final text length: ${fullText.length} characters`);
        
        // Truncate to first 1000 words
        const words = fullText.split(' ').filter(word => word.length > 0);
        if (words.length > 1000) {
          fullText = words.slice(0, 1000).join(' ') + '...';
          console.log(`Truncated to 1000 words`);
        }
        
        // Extract published date using various strategies
        let publishedDate = null;
        
        // Strategy 1: Look for structured data (JSON-LD)
        const structuredDataElements = document.querySelectorAll('script[type="application/ld+json"]');
        for (const element of structuredDataElements) {
          try {
            const data = JSON.parse(element.textContent || '');
            if (data.datePublished) {
              publishedDate = data.datePublished;
              break;
            } else if (data['@graph']) {
              const article = data['@graph'].find((item: any) => 
                item['@type'] === 'Article' || item['@type'] === 'NewsArticle'
              );
              if (article && article.datePublished) {
                publishedDate = article.datePublished;
                break;
              }
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
        
        // Strategy 2: Look for meta tags
        if (!publishedDate) {
          const metaSelectors = [
            'meta[property="article:published_time"]',
            'meta[name="article:published_time"]',
            'meta[property="article:published"]',
            'meta[name="publishdate"]',
            'meta[name="date"]',
            'meta[property="article:publish_date"]',
            'meta[name="DC.date.issued"]',
            'meta[name="sailthru.date"]',
            'meta[property="og:article:published_time"]',
            'meta[name="twitter:data1"]'
          ];
          
          for (const selector of metaSelectors) {
            const metaEl = document.querySelector(selector);
            if (metaEl) {
              const content = metaEl.getAttribute('content');
              if (content && content.length > 8) {
                publishedDate = content;
                break;
              }
            }
          }
        }
        
        // Strategy 3: Look for time elements with datetime
        if (!publishedDate) {
          const timeElements = document.querySelectorAll('time[datetime], time[pubdate]');
          for (const timeEl of timeElements) {
            const datetime = timeEl.getAttribute('datetime') || timeEl.getAttribute('pubdate');
            if (datetime) {
              publishedDate = datetime;
              break;
            }
          }
        }
        
        // Strategy 4: Look for date in content elements
        if (!publishedDate) {
          const dateSelectors = [
            '.published-date', '.publish-date', '.post-date', '.article-date',
            '.date', '.publication-date', '.entry-date', '.post-meta .date'
          ];
          
          for (const selector of dateSelectors) {
            const dateEl = document.querySelector(selector);
            if (dateEl) {
              const dateText = (dateEl as HTMLElement).innerText || dateEl.textContent;
              if (dateText && dateText.length > 8) {
                publishedDate = dateText;
                break;
              }
            }
          }
        }
        
        console.log(`Extracted date: ${publishedDate}`);
        console.log(`Final content length: ${fullText.length} characters, ${words.length} words`);
        
        return { fullText, publishedDate };
      });
      
             this.addLog('SUCCESS', `Extracted ${pageData.fullText.split(' ').length} words from ${url}. Date: ${pageData.publishedDate || 'Not found'}`);
       
       // Only close the page, keep browser for reuse
       if (page) {
         try {
           await page.close();
         } catch (cleanupError) {
           this.addLog('WARNING', `Failed to close page: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
         }
       }
       
       return pageData;
       
     } catch (error) {
       this.addLog('ERROR', `Failed to extract full text from ${url}: ${error instanceof Error ? error.message : String(error)}`);
       
       // Clean up page on error
       if (page) {
         try {
           await page.close();
         } catch (cleanupError) {
           // Ignore cleanup errors on error path
         }
       }
       
       return { fullText: '', publishedDate: null };
     }
  }



  private async processBatchWithAI(batch: RawContentItem[]): Promise<ProcessedArticle[]> {
    const batchContent = batch.map((item, index) => ({
      index,
      title: item.title?.slice(0, 200) || '',
      content: item.content?.slice(0, 500) || '',
      url: item.url || '',
      type: item.type || ''
    }));
    
    const prompt = `You are an expert cybersecurity threat intelligence analyst. Analyze the following ${batch.length} web content items and identify which ones are related to cybersecurity, information security, or cyber threats.

For each item that IS cybersecurity-related, return a comprehensive analysis with:

BASIC INFO:
- index: the item index (0-${batch.length - 1})
- cybersecurity_relevant: true
- title: cleaned, meaningful title
- summary: 2-3 sentence summary focusing on cybersecurity aspects
- risk_score: integer 0-10 (0=informational, 10=critical threat)
- event_type: one of ["CYBER_ATTACK", "DATA_BREACH", "MALWARE_CAMPAIGN", "VULNERABILITY_DISCLOSURE", "THREAT_INTELLIGENCE", "SECURITY_INCIDENT", "PHISHING_CAMPAIGN", "RANSOMWARE_ATTACK", "APT_ACTIVITY", "ZERO_DAY_EXPLOIT", "SUPPLY_CHAIN_ATTACK", "INSIDER_THREAT"]

THREAT DETAILS (REQUIRED):
- threat_actors: array of threat actor names or ["Unknown"] if not specified
- victims: array of organization/sector names or ["Multiple Organizations"] if not specified
- victim_country: single country name where the primary victim is located (e.g., "United States", "Japan", "Germany") or "Unknown" if not specified
- impact: one of ["high", "medium", "low"] - assess the potential business/operational impact
- attack_vectors: array of attack methods
- indicators: array of IOCs, domains, IPs, hashes
- vulnerabilities: array of CVEs and vulnerability descriptions
- key_findings: array of important findings
- recommendations: array of security recommendations

IMPACT ASSESSMENT GUIDELINES:
- "high": Critical systems compromised, significant data breach, widespread impact, national security implications
- "medium": Important systems affected, moderate data exposure, regional impact, business disruption
- "low": Limited systems affected, minimal data exposure, localized impact, informational/advisory

For items that are NOT cybersecurity-related, return:
- index: the item index
- cybersecurity_relevant: false

Content items:
${JSON.stringify(batchContent, null, 2)}

Return ONLY a JSON array of results, no other text.`;
    
    try {
      const response = await this.aiClient!.chat.completions.create({
        model: this.config.useAzureOpenAI ? 'gpt-4' : 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert cybersecurity analyst. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 16000
      });
      
      const aiResponse = response.choices[0]?.message?.content?.trim() || '';
      
      // Parse AI response
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }
      
      const results = JSON.parse(jsonMatch[0]);
      const cybersecurityItems: ProcessedArticle[] = [];
      
      for (const result of results) {
        if (result.cybersecurity_relevant && result.index >= 0 && result.index < batch.length) {
          const originalItem = batch[result.index];
          
          // Extract full text content and published date from the individual URL
          this.addLog('INFO', `Extracting full content for cybersecurity article: ${originalItem.url}`);
          const { fullText, publishedDate } = await this.extractFullTextFromUrl(originalItem.url);
          
          // Enhanced published date extraction using AI
          let finalPublishedDate = publishedDate ? this.parseAndFormatDate(publishedDate) : null;
          
          if (!finalPublishedDate && this.aiClient) {
            try {
              this.addLog('INFO', `Using AI to extract published date for: ${originalItem.title}`);
              
              const dateExtractionPrompt = `You are an expert at extracting published dates from web content. 

              CRITICAL: You MUST return dates in EXACTLY this format: YYYY-MM-DD (e.g., 2024-07-15)
              
              Analyze the following content and extract the published date. Look for:
              - Explicit date mentions in the article
              - Date patterns in the title or content
              - Publication timestamps
              - Article metadata
              
              Title: ${originalItem.title}
              Content: ${fullText.slice(0, 1000)}
              URL: ${originalItem.url}
              
              EXAMPLES of correct format:
              - "Jul 08, 2025" → 2025-07-08
              - "January 15, 2024" → 2024-01-15
              - "2024/03/20" → 2024-03-20
              
              Return ONLY the date in YYYY-MM-DD format or "NOT_FOUND" if no reliable date found.
              NO explanations, NO other text, ONLY the date in YYYY-MM-DD format.`;
              
              const dateResponse = await this.aiClient.chat.completions.create({
                model: this.config.useAzureOpenAI ? 'gpt-4' : 'gpt-4',
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert date extraction specialist. Return only the date in YYYY-MM-DD format or "NOT_FOUND".'
                  },
                  {
                    role: 'user',
                    content: dateExtractionPrompt
                  }
                ],
                temperature: 0.1,
                max_tokens: 50
              });
              
              const extractedDate = dateResponse.choices[0]?.message?.content?.trim() || '';
              if (extractedDate && extractedDate !== 'NOT_FOUND') {
                // Use the new date parser to handle various formats
                const parsedDate = this.parseAndFormatDate(extractedDate);
                if (parsedDate) {
                  finalPublishedDate = parsedDate;
                  this.addLog('SUCCESS', `AI extracted and parsed published date: ${extractedDate} → ${finalPublishedDate}`);
                } else {
                  this.addLog('WARNING', `AI extracted date but could not parse format: ${extractedDate} for: ${originalItem.title}`);
                }
              } else {
                this.addLog('WARNING', `AI could not extract reliable published date for: ${originalItem.title}`);
              }
            } catch (error) {
              this.addLog('ERROR', `AI date extraction failed: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          
          // Skip article if no published date could be found
          if (!finalPublishedDate) {
            this.addLog('WARNING', `Skipping article due to missing published date: ${originalItem.title}`);
            continue;
          }
          
          // Get proper source domain from the ORIGINAL crawled site, not the article URL
          let sourceDomain = 'unknown';
          try {
            // Use the sourceUrl (original crawled page) not the article URL
            const sourceUrlObj = new URL(originalItem.sourceUrl || originalItem.sourcePage || originalItem.url);
            sourceDomain = sourceUrlObj.hostname.replace('www.', '');
            this.addLog('INFO', `Using source domain: ${sourceDomain} (from ${originalItem.sourceUrl || originalItem.sourcePage}) for article: ${originalItem.url}`);
          } catch (error) {
            this.addLog('WARNING', `Invalid URL for source extraction: ${originalItem.sourceUrl || originalItem.sourcePage || originalItem.url}`);
            // Fallback to article URL domain if sourceUrl is invalid
            try {
              const urlObj = new URL(originalItem.url);
              sourceDomain = urlObj.hostname.replace('www.', '');
            } catch (fallbackError) {
              this.addLog('WARNING', `Both source and article URLs invalid`);
            }
          }
          
          const article: ProcessedArticle = {
            ...originalItem,
            content: fullText, // Use the extracted full text instead of snippet
            articleTitle: result.title || originalItem.title || 'No title',
            articleSummary: result.summary || 'No summary available',
            articleDate: finalPublishedDate,
            articleCrawledDate: originalItem.crawledDate,
            published: finalPublishedDate,
            site: sourceDomain,
            keywords: result.key_findings || [],
            cybersecurityTopics: result.attack_vectors || [],
            cybersecurityRelevant: true,
            riskScore: Math.min(10, Math.max(0, parseInt(result.risk_score) || 5)),
            eventType: result.event_type as CyberEventType || CyberEventType.UNKNOWN,
            attacker: (result.threat_actors || ['Unknown'])[0] || 'Unknown',
            victim: (result.victims || ['Multiple Organizations'])[0] || 'Multiple Organizations',
            victimCountry: result.victim_country || 'Unknown',
            vulnerabilities: result.vulnerabilities || [],
            impact: (result.impact === 'high' || result.impact === 'medium' || result.impact === 'low') ? result.impact : 'medium',
            isKeppelVendor: false,
            isKeppelCustomer: false,
            keppelVulnerable: false,
            targetsKeppelSectors: false,
            confidenceScore: 0.8,
            relevanceScore: 0.7,
            summary: result.summary || 'No summary available'
          };
          
          cybersecurityItems.push(article);
        }
      }
      
      return cybersecurityItems;
    } catch (error) {
      this.addLog('ERROR', `AI batch processing failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  public cleanupOldScreenshots(maxAgeMinutes = 5): number {
    const currentTime = Date.now();
    const cutoffTime = currentTime - (maxAgeMinutes * 60 * 1000);
    
    const expiredIds = Object.keys(this.screenshots).filter(
      id => this.screenshots[id].timestamp < cutoffTime
    );
    
    for (const id of expiredIds) {
      delete this.screenshots[id];
      this.addLog('INFO', `Cleaned up expired screenshot: ${id}`);
    }
    
    return expiredIds.length;
  }

  public async crawlWebsite(urls: string[]): Promise<CrawlResult> {
    const startTime = Date.now();
    
    try {
      this.addLog('INFO', `Starting advanced crawl for ${urls.length} URLs: ${urls.join(', ')}`);
      
      // Reset for new crawl
      this.resetForNewCrawl();
      
      // Send initializing phase
      this.sendUpdate('progress', { phase: 'initializing' });
      
      // Initialize crawler
      this.crawler = new PlaywrightCrawler({
        headless: this.config.headless,
        maxRequestsPerCrawl: this.config.maxRequestsPerCrawl,
        maxConcurrency: this.config.maxConcurrency,
        maxRequestRetries: this.config.maxRequestRetries,
        requestHandlerTimeoutSecs: this.config.requestHandlerTimeoutSecs,
        launchContext: {
          useChrome: true,
          launchOptions: {
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
              '--window-size=1920,1080'
            ],
          },
        },
      });
      
      this.addLog('INFO', 'Crawler initialized successfully');
      
      // Send crawling phase
      this.sendUpdate('progress', { phase: 'crawling' });
      
      // Set up request handler
      this.crawler.router.addDefaultHandler(async (context) => {
        await this.handlePage(context);
      });
      
      // Start crawling
      await this.crawler.run(urls);
      
      this.addLog('INFO', 'Crawling phase completed, starting AI processing');
      
      // Send processing phase
      this.sendUpdate('progress', { phase: 'processing' });
      
      // Process with AI (includes quality filtering and deduplication)
      const cybersecurityArticles = await this.processWithAI(this.crawlData);
      
      this.addLog('INFO', 'AI processing completed, finalizing results');
      
      // Send saving phase
      this.sendUpdate('progress', { phase: 'saving' });
      
      // Save processed articles to database
      let databaseSaveResult: DatabaseSaveResult | undefined;
      try {
        if (cybersecurityArticles.length > 0) {
          this.addLog('INFO', `Saving ${cybersecurityArticles.length} cybersecurity articles to database...`);
          const dbService = getDatabaseService();
          databaseSaveResult = await dbService.saveProcessedArticles(cybersecurityArticles);
          
          // Send database save update
          this.sendUpdate('database-save', databaseSaveResult);
          
          if (databaseSaveResult.errors && databaseSaveResult.errors.length > 0) {
            this.addLog('WARNING', `Database save completed with ${databaseSaveResult.errors.length} errors`);
            databaseSaveResult.errors.forEach(error => this.addLog('ERROR', error));
          } else {
            this.addLog('SUCCESS', `Successfully saved ${databaseSaveResult.articlesSaved} articles to database`);
          }
        } else {
          this.addLog('INFO', 'No cybersecurity articles to save to database');
          databaseSaveResult = { articlesSaved: 0, analysesSaved: 0 };
        }
      } catch (error) {
        const errorMsg = `Failed to save articles to database: ${error instanceof Error ? error.message : String(error)}`;
        this.addLog('ERROR', errorMsg);
        databaseSaveResult = { 
          articlesSaved: 0, 
          analysesSaved: 0, 
          errors: [errorMsg] 
        };
      }
      
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      this.crawlStats.totalTime = totalTime;
      this.crawlStats.finalStatus = 'completed';
      
      const result: CrawlResult = {
        success: true,
        rawData: this.crawlData,
        filteredData: this.filterContentForQuality(this.crawlData), // Apply filtering here
        cybersecurityData: cybersecurityArticles,
        stats: this.crawlStats,
        logs: this.crawlLogs,
        screenshots: this.screenshots,
        databaseSaveResult
      };
      
      this.addLog('SUCCESS', `Crawl completed. Raw items: ${this.crawlData.length}, Cybersecurity articles: ${cybersecurityArticles.length}, Database saves: ${databaseSaveResult?.articlesSaved || 0}`);
      
      // Clean up shared browser
      await this.cleanupSharedBrowser();
      
      // Send completed phase
      this.sendUpdate('progress', { phase: 'completed' });
      this.sendUpdate('complete', result);
      
      return result;
      
    } catch (error) {
      const errorMsg = `Crawling failed: ${error instanceof Error ? error.message : String(error)}`;
      this.addLog('ERROR', errorMsg);
      
      // Clean up shared browser on error too
      await this.cleanupSharedBrowser();
      
      const result: CrawlResult = {
        success: false,
        error: errorMsg,
        rawData: this.crawlData,
        filteredData: [],
        cybersecurityData: [],
        stats: this.crawlStats,
        logs: this.crawlLogs,
        screenshots: this.screenshots,
        databaseSaveResult: { articlesSaved: 0, analysesSaved: 0, errors: [errorMsg] }
      };
      
      this.sendUpdate('error', result);
      return result;
    }
  }

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.addLog('INFO', 'Crawl aborted by user');
    }
    // Clean up shared browser on abort
    this.cleanupSharedBrowser();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parseAndFormatDate(dateString: string): string | null {
    if (!dateString || dateString === 'NOT_FOUND') {
      return null;
    }

    // If already in correct format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    try {
      // Handle various date formats
      let parsedDate: Date;

      // Try parsing common formats
      const formats = [
        // ISO formats
        /^\d{4}-\d{2}-\d{2}T/, // ISO with time
        /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
        /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
        /^\d{4}\.\d{2}\.\d{2}/, // YYYY.MM.DD
      ];

      // Month name formats (Jul 08, 2025, July 8, 2025, etc.)
      const monthNameRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i;
      const monthNameMatch = dateString.match(monthNameRegex);
      
      if (monthNameMatch) {
        const monthMap: { [key: string]: string } = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
          'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
          'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        
        const month = monthMap[monthNameMatch[1].toLowerCase().substring(0, 3)];
        const day = monthNameMatch[2].padStart(2, '0');
        const year = monthNameMatch[3];
        
        if (month && year) {
          return `${year}-${month}-${day}`;
        }
      }

      // Try JavaScript's Date parsing as fallback
      parsedDate = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(parsedDate.getTime())) {
        return null;
      }

      // Format to ISO date string (YYYY-MM-DD)
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      
      // Validate the parsed date is reasonable (not too far in future/past)
      const currentYear = new Date().getFullYear();
      if (year < 1990 || year > currentYear + 2) {
        return null;
      }

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}`, error);
      return null;
    }
  }
}

// Convenience functions
export async function crawlWithAdvancedFeatures(
  urls: string[], 
  config?: Partial<CrawlConfig>,
  updateCallback?: (update: CrawlUpdate) => void
): Promise<CrawlResult> {
  const crawler = new AdvancedCrawleeCrawler(config, updateCallback);
  return await crawler.crawlWebsite(urls);
}

export function getDefaultConfig(): CrawlConfig {
  return {
    maxConcurrency: 5,
    maxRequestsPerCrawl: 50,
    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 180,
    headless: true,
    maxSessionsPerCrawler: 1,
    useSessionPool: true,
    sessionPoolMaxPoolSize: 10,
    persistCookiesPerSession: true,
    maxCrawlingDepth: 3,
    sameDomainDelay: 1000,
    requestDelay: 500,
    enableJavaScript: true,
    enableImages: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewportWidth: 1920,
    viewportHeight: 1080,
    enableScreenshots: true,
    screenshotQuality: 80,
    enableAIProcessing: true,
    useAzureOpenAI: true
  };
}

export function getBloombergConfig(): CrawlConfig {
  return {
    ...getDefaultConfig(),
    headless: false,
    maxRequestsPerCrawl: 3,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 300,
    sameDomainDelay: 10000,
    requestDelay: 5000,
    enableScreenshots: false
  };
}

export function getFastConfig(): CrawlConfig {
  return {
    ...getDefaultConfig(),
    maxRequestsPerCrawl: 100,
    maxConcurrency: 10,
    requestHandlerTimeoutSecs: 60,
    sameDomainDelay: 500,
    requestDelay: 200,
    enableScreenshots: true
  };
} 