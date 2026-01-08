/**
 * Frontend Performance Tests
 * Target: FCP (First Contentful Paint) < 2 seconds
 * Uses Web Vitals and Lighthouse metrics
 */

import { test, expect } from '@playwright/test';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
}

test.describe('Frontend Performance Metrics', () => {
  test('FCP should be < 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    const metrics = await page.evaluate(() => {
      return new Promise<PerformanceMetrics>((resolve) => {
        const perfData: Partial<PerformanceMetrics> = {};

        // Get navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          perfData.ttfb = navigation.responseStart - navigation.requestStart;
        }

        // Get paint timing
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          perfData.fcp = fcpEntry.startTime;
        }

        // Use PerformanceObserver for other metrics
        let lcpValue = 0;
        let fidValue = 0;
        let clsValue = 0;

        // Observe LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcpValue = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe FID
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            fidValue = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Observe CLS
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Get TTI (approximation)
        const ttiEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const tti = ttiEntry ? ttiEntry.domInteractive - ttiEntry.fetchStart : 0;

        setTimeout(() => {
          resolve({
            fcp: perfData.fcp || 0,
            lcp: lcpValue,
            fid: fidValue,
            cls: clsValue,
            ttfb: perfData.ttfb || 0,
            tti,
          });
        }, 3000); // Wait for metrics to settle
      });
    });

    const loadTime = Date.now() - startTime;

    console.log('\n=== Frontend Performance Metrics ===');
    console.log(`FCP (First Contentful Paint): ${metrics.fcp.toFixed(2)}ms`);
    console.log(`LCP (Largest Contentful Paint): ${metrics.lcp.toFixed(2)}ms`);
    console.log(`FID (First Input Delay): ${metrics.fid.toFixed(2)}ms`);
    console.log(`CLS (Cumulative Layout Shift): ${metrics.cls.toFixed(4)}`);
    console.log(`TTFB (Time to First Byte): ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`TTI (Time to Interactive): ${metrics.tti.toFixed(2)}ms`);
    console.log(`Total Load Time: ${loadTime}ms`);
    console.log('===================================\n');

    // Assert performance targets
    expect(metrics.fcp, 'FCP should be < 2000ms').toBeLessThan(2000);
    expect(metrics.lcp, 'LCP should be < 2500ms').toBeLessThan(2500);
    expect(metrics.fid, 'FID should be < 100ms').toBeLessThan(100);
    expect(metrics.cls, 'CLS should be < 0.1').toBeLessThan(0.1);
    expect(metrics.ttfb, 'TTFB should be < 600ms').toBeLessThan(600);
  });

  test('Initial bundle size should be reasonable', async ({ page }) => {
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      const jsResources = entries.filter((entry: any) =>
        entry.name.endsWith('.js')
      );
      const cssResources = entries.filter((entry: any) =>
        entry.name.endsWith('.css')
      );

      const totalJsSize = jsResources.reduce((sum: number, entry: any) =>
        sum + (entry.transferSize || 0), 0
      );
      const totalCssSize = cssResources.reduce((sum: number, entry: any) =>
        sum + (entry.transferSize || 0), 0
      );

      return {
        jsCount: jsResources.length,
        cssCount: cssResources.length,
        totalJsSize,
        totalCssSize,
        totalSize: totalJsSize + totalCssSize,
      };
    });

    console.log('\n=== Bundle Size Analysis ===');
    console.log(`JavaScript files: ${resources.jsCount}`);
    console.log(`CSS files: ${resources.cssCount}`);
    console.log(`Total JS size: ${(resources.totalJsSize / 1024).toFixed(2)} KB`);
    console.log(`Total CSS size: ${(resources.totalCssSize / 1024).toFixed(2)} KB`);
    console.log(`Total size: ${(resources.totalSize / 1024).toFixed(2)} KB`);
    console.log('============================\n');

    // Target: Initial bundle < 500KB
    expect(resources.totalSize, 'Total bundle should be < 500KB').toBeLessThan(500 * 1024);
  });

  test('Page should be interactive quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Wait for main content to be visible
    await page.waitForSelector('main, [role="main"], #root', {
      state: 'visible',
      timeout: 3000,
    });

    const timeToInteractive = Date.now() - startTime;

    console.log(`\nTime to Interactive: ${timeToInteractive}ms`);

    // Should be interactive within 3 seconds
    expect(timeToInteractive, 'Page should be interactive within 3s').toBeLessThan(3000);
  });

  test('Images should load efficiently', async ({ page }) => {
    await page.goto('/');

    // Wait for images to load
    await page.waitForLoadState('networkidle');

    const imageMetrics = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const metrics = images.map((img) => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: img.loading,
        decoded: img.complete,
      }));

      return {
        totalImages: images.length,
        lazyImages: images.filter((img) => img.loading === 'lazy').length,
        images: metrics,
      };
    });

    console.log('\n=== Image Loading Analysis ===');
    console.log(`Total images: ${imageMetrics.totalImages}`);
    console.log(`Lazy-loaded images: ${imageMetrics.lazyImages}`);
    console.log('===============================\n');

    // At least 50% of images should use lazy loading
    if (imageMetrics.totalImages > 0) {
      const lazyLoadPercentage = (imageMetrics.lazyImages / imageMetrics.totalImages) * 100;
      expect(lazyLoadPercentage, 'At least 50% images should lazy load').toBeGreaterThanOrEqual(50);
    }
  });

  test('CSS should not block rendering', async ({ page }) => {
    await page.goto('/');

    const cssBlocking = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

      const blockingStyles = linkElements.filter((link: any) => {
        return !link.media || link.media === 'all';
      });

      return {
        totalStyles: linkElements.length,
        blockingStyles: blockingStyles.length,
        nonBlockingStyles: linkElements.length - blockingStyles.length,
      };
    });

    console.log('\n=== CSS Loading Analysis ===');
    console.log(`Total stylesheets: ${cssBlocking.totalStyles}`);
    console.log(`Blocking: ${cssBlocking.blockingStyles}`);
    console.log(`Non-blocking: ${cssBlocking.nonBlockingStyles}`);
    console.log('=============================\n');

    // Should minimize blocking CSS
    expect(cssBlocking.blockingStyles, 'Blocking CSS should be minimal').toBeLessThanOrEqual(2);
  });

  test('JavaScript should be optimized', async ({ page }) => {
    await page.goto('/');

    const jsMetrics = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));

      const asyncScripts = scripts.filter((script) => script.async).length;
      const deferScripts = scripts.filter((script) => script.defer).length;
      const blockingScripts = scripts.filter(
        (script) => !script.async && !script.defer && script.src
      ).length;

      return {
        totalScripts: scripts.length,
        asyncScripts,
        deferScripts,
        blockingScripts,
      };
    });

    console.log('\n=== JavaScript Loading Analysis ===');
    console.log(`Total scripts: ${jsMetrics.totalScripts}`);
    console.log(`Async scripts: ${jsMetrics.asyncScripts}`);
    console.log(`Defer scripts: ${jsMetrics.deferScripts}`);
    console.log(`Blocking scripts: ${jsMetrics.blockingScripts}`);
    console.log('====================================\n');

    // Should minimize blocking scripts
    expect(jsMetrics.blockingScripts, 'Blocking scripts should be minimal').toBeLessThanOrEqual(1);
  });

  test('Service Worker should be registered', async ({ page }) => {
    await page.goto('/');

    // Wait for service worker registration
    await page.waitForTimeout(2000);

    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
    });

    console.log(`\nService Worker registered: ${swRegistered}`);

    // In production, service worker should be active
    // In development, this might be false
    if (process.env.NODE_ENV === 'production') {
      expect(swRegistered, 'Service Worker should be registered in production').toBe(true);
    }
  });
});

test.describe('Mobile Performance', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('Mobile FCP should be < 2.5 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    const fcp = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : 0;
    });

    console.log(`\nMobile FCP: ${fcp.toFixed(2)}ms`);

    // Mobile target is slightly relaxed
    expect(fcp, 'Mobile FCP should be < 2500ms').toBeLessThan(2500);
  });
});
