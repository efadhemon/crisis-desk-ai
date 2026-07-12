import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

interface IQueueItem {
  id: string;
  htmlContent: string;
  options: puppeteer.PDFOptions;
  resolve: (value: Buffer) => void;
  reject: (error: any) => void;
  retryCount: number;
  createdAt: number;
}

@Injectable()
export class PdfGeneratorHelper implements OnModuleDestroy {
  private readonly logger = new Logger(PdfGeneratorHelper.name);

  // Browser management
  private browser: puppeteer.Browser | null = null;
  private isLaunching = false;
  private isClosingBrowser = false;
  private isShuttingDown = false;
  private browserProcessPids: number[] = [];

  // Queue management
  private readonly pageQueue: IQueueItem[] = [];
  private queueProcessingPromise: Promise<void> | null = null;

  // Timing and limits
  private idleTimeout: NodeJS.Timeout | null = null;
  private readonly idleTime = 60000; // 1 minute — release Chromium memory faster
  private lastUsedTime = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  private readonly maxConcurrentPages = 2;
  private readonly browserLaunchTimeout = 30000;
  private readonly pageTimeout = 30000;

  // Active page tracking
  private activePagesMap = new Map<string, { page: puppeteer.Page; createdAt: number }>();
  private totalRunningPages = 0;

  async onModuleDestroy(): Promise<void> {
    await this.forceCleanup();
  }

  // Status monitoring
  public async getBrowserStatus(): Promise<{
    isLaunched: boolean;
    isConnected: boolean;
    runningPages: number;
    queueLength: number;
    lastUsed: number;
    isLaunching: boolean;
    isClosing: boolean;
    isProcessingQueue: boolean;
  }> {
    return {
      isLaunched: !!this.browser,
      isConnected: await this.isBrowserConnected(),
      runningPages: this.totalRunningPages,
      queueLength: this.pageQueue.length,
      lastUsed: this.lastUsedTime,
      isLaunching: this.isLaunching,
      isClosing: this.isClosingBrowser,
      isProcessingQueue: !!this.queueProcessingPromise,
    };
  }

  public async forceCleanup(): Promise<void> {
    this.isShuttingDown = true;
    this.isClosingBrowser = true;
    this.clearIdleTimeout();

    // Reject all queued items
    this.rejectAllQueuedItems(new Error('Service is shutting down'));

    this.activePagesMap.clear();
    this.totalRunningPages = 0;
    await this.closeBrowser();
  }

  /**
   * Main entry point - always queues request first, regardless of browser state
   */
  async createPDF(
    htmlContent: string,
    options: puppeteer.PDFOptions = { format: 'A4' },
  ): Promise<Buffer> {
    const callerLine = (new Error().stack?.split('\n')[2] || '').trim();
    console.error(
      '🚀😬 ~ PDF generator called from=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
      callerLine,
    );
    const requestId = this.generateRequestId();

    return new Promise<Buffer>((resolve, reject) => {
      // Always queue first - this is the key principle
      const queueItem: IQueueItem = {
        id: requestId,
        htmlContent,
        options,
        resolve,
        reject,
        retryCount: 0,
        createdAt: Date.now(),
      };

      this.pageQueue.push(queueItem);
      this.logger.debug(`Request ${requestId} queued. Queue length: ${this.pageQueue.length}`);

      // Trigger queue processing (non-blocking)
      this.triggerQueueProcessing();
    });
  }

  /**
   * Trigger queue processing if not already running
   */
  private triggerQueueProcessing(): void {
    if (this.queueProcessingPromise) {
      return; // Already processing
    }

    this.queueProcessingPromise = this.processQueue()
      .catch((error) => {
        this.logger.error('Queue processing failed:', error);
      })
      .finally(() => {
        this.queueProcessingPromise = null;

        // If there are still items in queue, continue processing
        if (this.pageQueue.length > 0 && !this.isShuttingDown) {
          setTimeout(() => this.triggerQueueProcessing(), 100);
        }
      });
  }

  /**
   * Main queue processing logic
   */
  private async processQueue(): Promise<void> {
    if (this.pageQueue.length === 0 || this.isShuttingDown) {
      return;
    }

    this.logger.debug(`Processing queue with ${this.pageQueue.length} items`);

    try {
      // Ensure browser is ready before processing any jobs
      await this.ensureBrowserReady();

      // Process items in batches
      while (this.pageQueue.length > 0 && !this.isShuttingDown) {
        const batchSize = Math.min(this.maxConcurrentPages, this.pageQueue.length);
        const batch: IQueueItem[] = [];

        // Extract batch from queue
        for (let i = 0; i < batchSize; i++) {
          const item = this.pageQueue.shift();
          if (item) batch.push(item);
        }

        if (batch.length === 0) break;

        // Process batch concurrently
        const batchPromises = batch.map((item) => this.processQueueItem(item));
        await Promise.allSettled(batchPromises);

        // Small delay between batches to prevent overwhelming
        if (this.pageQueue.length > 0) {
          await this.delay(10);
        }
      }
    } catch (error) {
      this.logger.error('Error in processQueue:', error);

      // Reject all remaining items if browser failed
      this.rejectAllQueuedItems(error);
      throw error;
    } finally {
      // Start idle timeout if queue is empty and no active pages
      if (this.pageQueue.length === 0 && this.totalRunningPages === 0) {
        this.resetIdleTimeout();
      }
    }
  }

  /**
   * Process individual queue item with retry logic
   */
  private async processQueueItem(item: IQueueItem): Promise<void> {
    try {
      this.logger.debug(`Processing item ${item.id} (attempt ${item.retryCount + 1})`);
      const result = await this.generatePDF(item.htmlContent, item.options);
      item.resolve(result);
      this.logger.debug(`Item ${item.id} completed successfully`);
    } catch (error) {
      this.logger.warn(`Item ${item.id} failed:`, error);

      // Retry logic
      if (item.retryCount < this.maxRetries && !this.isShuttingDown) {
        item.retryCount++;
        this.logger.warn(
          `Retrying item ${item.id} (attempt ${item.retryCount}/${this.maxRetries})`,
        );

        // Add back to front of queue for immediate retry
        this.pageQueue.unshift(item);

        // Wait before retry
        await this.delay(this.retryDelay * item.retryCount);
      } else {
        // Max retries reached or shutting down
        const finalError = new Error(
          `PDF generation failed after ${item.retryCount} retries: ${error.message}`,
        );
        item.reject(finalError);
        this.logger.error(`Item ${item.id} rejected after ${item.retryCount} retries`);
      }
    }
  }

  /**
   * Ensure browser is ready - handles all browser states
   */
  private async ensureBrowserReady(): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Service is shutting down');
    }

    // Case 1: Browser is ready and connected
    if (this.browser && (await this.isBrowserConnected())) {
      return;
    }

    // Case 2: Browser is currently launching - wait for it
    if (this.isLaunching) {
      await this.waitForBrowserLaunch();
      return;
    }

    // Case 3: Browser is currently closing - wait then launch
    if (this.isClosingBrowser) {
      await this.waitForBrowserClose();
    }

    // Case 4: No browser or disconnected - launch new one
    await this.launchBrowserWithRetry();
  }

  /**
   * Launch browser with retry logic
   */
  private async launchBrowserWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      if (this.isShuttingDown) {
        throw new Error('Service is shutting down');
      }

      try {
        await this.launchBrowser();

        if (this.browser && (await this.isBrowserConnected())) {
          this.logger.log(`Browser launched successfully on attempt ${attempt}`);
          return;
        }
      } catch (error) {
        this.logger.warn(`Browser launch attempt ${attempt} failed:`, error);

        if (attempt < this.maxRetries && !this.isShuttingDown) {
          await this.delay(this.retryDelay * attempt);
        }

        if (attempt === this.maxRetries) {
          this.rejectAllQueuedItems({ message: 'Browser not opening!' });
        }
      }
    }

    throw new Error(`Failed to launch browser after ${this.maxRetries} attempts`);
  }

  /**
   * Launch browser process
   */
  private async launchBrowser(): Promise<void> {
    if (this.browser || this.isLaunching || this.isShuttingDown) {
      return;
    }

    this.isLaunching = true;
    this.clearIdleTimeout();

    try {
      // Ensure clean state
      await this.closeBrowser();

      this.logger.log('Launching browser...');

      this.browser = await puppeteer.launch({
        headless: true,
        timeout: this.browserLaunchTimeout,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-translate',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-ipc-flooding-protection',
          '--js-flags=--max-old-space-size=256', // Cap Chromium's V8 heap to 256MB
          '--disable-background-networking',
        ],
      });

      // Track browser process
      const browserProcess = this.browser.process();
      if (browserProcess?.pid) {
        this.browserProcessPids.push(browserProcess.pid);
      }

      this.setupBrowserEventHandlers();
      this.logger.log('Browser launched and ready');
    } catch (error) {
      this.browser = null;
      this.logger.error('Failed to launch browser:', error);
      throw error;
    } finally {
      this.isLaunching = false;
    }
  }

  /**
   * Generate PDF from HTML content
   */
  private async generatePDF(htmlContent: string, options: puppeteer.PDFOptions): Promise<Buffer> {
    if (this.isShuttingDown || !this.browser) {
      throw new Error('PDF service is not available');
    }

    this.updateLastUsedTime();

    // Don't set default format if width/height are specified
    const mergedOptions: puppeteer.PDFOptions = {
      printBackground: true,
      ...options,
    };

    // Only set default format if no custom dimensions are provided
    if (!options.width && !options.height && !options.format) {
      mergedOptions.format = 'A4';
    }

    const pageId = this.generatePageId();
    let page: puppeteer.Page | null = null;

    try {
      page = await this.browser.newPage();

      // Configure page
      await page.setDefaultTimeout(this.pageTimeout);
      await page.setDefaultNavigationTimeout(this.pageTimeout);

      // Track the page
      this.activePagesMap.set(pageId, { page, createdAt: Date.now() });
      this.totalRunningPages++;

      // Set content and wait for load
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded', // Much faster & less memory than 'networkidle0'
        timeout: this.pageTimeout - 5000,
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF
      const pdfBuffer = await page.pdf(mergedOptions);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`PDF generation failed for page ${pageId}:`, error);
      throw error;
    } finally {
      await this.cleanupPage(pageId);
    }
  }

  // ... (Other helper methods remain the same but with improved logging)

  private async waitForBrowserLaunch(): Promise<void> {
    const maxWaitTime = this.browserLaunchTimeout + 10000;
    const startTime = Date.now();

    while (this.isLaunching && Date.now() - startTime < maxWaitTime && !this.isShuttingDown) {
      await this.delay(100);
    }

    if (this.isLaunching) {
      throw new Error('Browser launch timeout');
    }

    if (!this.browser || !(await this.isBrowserConnected())) {
      throw new Error('Browser failed to launch');
    }
  }

  private async waitForBrowserClose(): Promise<void> {
    const maxWaitTime = 10000;
    const startTime = Date.now();

    while (this.isClosingBrowser && Date.now() - startTime < maxWaitTime) {
      await this.delay(100);
    }
  }

  private rejectAllQueuedItems(error: any): void {
    while (this.pageQueue.length > 0) {
      const item = this.pageQueue.shift();
      if (item) {
        item.reject(new Error(`PDF processing failed: ${error.message}`));
      }
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generatePageId(): string {
    return `page_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // ... (Rest of the helper methods - cleanupPage, closeBrowser, etc. remain similar)

  private async cleanupPage(pageId: string): Promise<void> {
    if (!this.activePagesMap.has(pageId)) return;

    const pageInfo = this.activePagesMap.get(pageId)!;
    this.activePagesMap.delete(pageId);
    this.totalRunningPages = Math.max(0, this.totalRunningPages - 1);

    if (this.isClosingBrowser || this.isShuttingDown) return;

    try {
      if (pageInfo.page && !pageInfo.page.isClosed()) {
        await pageInfo.page.close();
      }
    } catch (error: any) {
      if (!this.isExpectedCloseError(error)) {
        this.logger.error(`Error closing page ${pageId}:`, error);
      }
    }
  }

  // ... (Other utility methods like delay, isBrowserConnected, etc.)

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async isBrowserConnected(): Promise<boolean> {
    if (!this.browser) return false;
    try {
      await Promise.race([
        this.browser.version(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000)),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  private updateLastUsedTime(): void {
    this.lastUsedTime = Date.now();
  }

  private resetIdleTimeout(): void {
    this.clearIdleTimeout();
    if (this.isShuttingDown || this.isClosingBrowser) return;

    this.idleTimeout = setTimeout(async () => {
      const timeSinceLastUse = Date.now() - this.lastUsedTime;
      const hasActiveTasks =
        this.totalRunningPages > 0 || this.pageQueue.length > 0 || !!this.queueProcessingPromise;

      if (timeSinceLastUse >= this.idleTime && !hasActiveTasks) {
        this.logger.log('Closing browser due to idle timeout');
        await this.closeBrowser().catch((error) => {
          this.logger.error('Error during idle browser close:', error);
        });
      } else {
        this.resetIdleTimeout();
      }
    }, this.idleTime);
  }

  private clearIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  private setupBrowserEventHandlers(): void {
    if (!this.browser) return;

    this.browser.on('disconnected', () => {
      if (!this.isClosingBrowser && !this.isShuttingDown) {
        this.logger.warn('Browser disconnected unexpectedly');
      }
      this.activePagesMap.clear();
      this.totalRunningPages = 0;
      this.browser = null;

      // Restart processing if there are queued items
      if (this.pageQueue.length > 0 && !this.isShuttingDown) {
        setTimeout(() => this.triggerQueueProcessing(), 2000);
      }
    });
  }

  private async closeBrowser(): Promise<void> {
    this.clearIdleTimeout();
    if (!this.browser) {
      this.isClosingBrowser = false;
      return;
    }

    this.isClosingBrowser = true;
    try {
      this.activePagesMap.clear();
      this.totalRunningPages = 0;

      const isResponsive = await this.isBrowserConnected();
      if (isResponsive && !this.browser.process()?.killed) {
        await Promise.race([
          this.browser.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Close timeout')), 10000)),
        ]);
      }
      this.logger.log('Browser closed successfully');
    } catch (error) {
      this.logger.warn('Error closing browser gracefully:', error);
    } finally {
      this.browser = null;
      this.forceKillBrowserProcesses();
      this.isClosingBrowser = false;
    }
  }

  private forceKillBrowserProcesses(): void {
    this.browserProcessPids.forEach((pid) => {
      try {
        if (this.isProcessRunning(pid)) {
          process.kill(pid, 'SIGTERM');
          setTimeout(() => {
            if (this.isProcessRunning(pid)) {
              process.kill(pid, 'SIGKILL');
            }
          }, 3000);
        }
      } catch {
        // Process might already be dead
      }
    });
    this.browserProcessPids = [];
  }

  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error: any) {
      return error.code !== 'ESRCH';
    }
  }

  private isExpectedCloseError(error: any): boolean {
    const expectedErrors = [
      'Protocol error: Connection closed',
      'Target closed',
      'No target with given id found',
      'Target.closeTarget',
      'Session closed',
      'Connection closed',
      'WebSocket is not open',
    ];
    return expectedErrors.some((expectedError) => error?.message?.includes(expectedError));
  }
}
