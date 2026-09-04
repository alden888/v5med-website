/**
 * V5 Medical Performance Monitor
 * Tracks Core Web Vitals (FCP, LCP, CLS) and custom application metrics
 * @version 2.0.0
 * @updated 2024-12-16
 */

class PerformanceMonitor {
    constructor() {
        // Singleton pattern to prevent duplicate monitors
        if (window.performanceMonitor) return window.performanceMonitor;

        this.config = window.V5Config?.PERFORMANCE || {};
        this.metrics = {};
        this.observers = [];
        
        // Initialize immediately
        this.init();
    }

    init() {
        if (typeof window.performance === 'undefined') return;

        // 1. Basic Page Load Metrics (Navigation Timing API)
        this.trackNavigationTiming();

        // 2. Core Web Vitals (PerformanceObserver)
        this.trackWebVitals();
    }

    /**
     * Track standard page load events (TTFB, DOM Ready, Full Load)
     */
    trackNavigationTiming() {
        window.addEventListener('load', () => {
            // Wait a tick to ensure load event is finished
            setTimeout(() => {
                const nav = performance.getEntriesByType('navigation')[0];
                if (nav) {
                    this.record('ttfb', nav.responseStart - nav.startTime);
                    this.record('dom_ready', nav.domContentLoadedEventEnd - nav.startTime);
                    this.record('full_load', nav.loadEventEnd - nav.startTime);
                }
                
                // Report all collected metrics after load
                this.reportAll();
            }, 0);
        });
    }

    /**
     * Track modern Web Vitals: FCP, LCP, CLS
     */
    trackWebVitals() {
        if (typeof PerformanceObserver === 'undefined') return;

        // FCP (First Contentful Paint)
        this._observe('paint', (entries) => {
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.record('fcp', entry.startTime);
                }
            });
        });

        // LCP (Largest Contentful Paint)
        this._observe('largest-contentful-paint', (entries) => {
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                this.record('lcp', lastEntry.startTime);
            }
        });

        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        this._observe('layout-shift', (entries) => {
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            this.record('cls', clsValue);
        });
    }

    /**
     * Helper to create observers safely
     */
    _observe(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => callback(list.getEntries()));
            observer.observe({ type, buffered: true });
            this.observers.push(observer);
        } catch (e) {
            // Browser might not support this specific observer type
            // console.warn(`[Performance] ${type} observer not supported`);
        }
    }

    /**
     * Record a metric value locally
     */
    record(name, value) {
        if (typeof value !== 'number') return;
        
        this.metrics[name] = value;
        
        // Debug log in development
        if (window.V5Config?.ENV?.IS_LOCAL || this.config.LOG_LEVEL === 'debug') {
            console.log(`[Performance] ${name}:`, value.toFixed(2));
        }
    }

    /**
     * Start a custom timer (User Timing API)
     */
    mark(name) {
        performance.mark(`${name}_start`);
    }

    /**
     * Stop a custom timer and record duration
     */
    measure(name) {
        try {
            const startMark = `${name}_start`;
            const endMark = `${name}_end`;
            performance.mark(endMark);
            performance.measure(name, startMark, endMark);
            
            const entry = performance.getEntriesByName(name).pop();
            if (entry) {
                this.record(name, entry.duration);
            }
        } catch (e) {
            console.warn(`[Performance] Measure failed for: ${name}`);
        }
    }

    /**
     * Send all metrics to Google Analytics
     */
    reportAll() {
        if (!window.gtag) return;

        // Send Web Vitals as specific events
        const vitals = ['fcp', 'lcp', 'cls'];
        vitals.forEach(metric => {
            if (this.metrics[metric] !== undefined) {
                gtag('event', metric, {
                    event_category: 'Web Vitals',
                    value: Math.round(this.metrics[metric]), // GA prefers integers for value
                    metric_value: this.metrics[metric], // Custom parameter for precision
                    non_interaction: true
                });
            }
        });

        // Send Load Times
        const timings = ['ttfb', 'dom_ready', 'full_load'];
        timings.forEach(metric => {
            if (this.metrics[metric] !== undefined) {
                gtag('event', 'timing_complete', {
                    name: metric,
                    value: Math.round(this.metrics[metric]),
                    event_category: 'Page Load'
                });
            }
        });
    }
}

// Initialize and Expose Global Instance
window.performanceMonitor = new PerformanceMonitor();

// Export for module usage
if (typeof module !== 'undefined') {
    module.exports = window.performanceMonitor;
}
