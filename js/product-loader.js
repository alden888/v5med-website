/**
 * V5 Medical Product Loader
 * Handles loading product data from local scripts with dynamic fallback
 * @version 2.0.0
 * @updated 2024-12-16
 */

// Prevent duplicate declaration
if (!window.ProductLoader) {
    class ProductLoader {
        constructor() {
            this.database = null;
            this.loadingPromise = null;
            // Use config if available, otherwise default
            this.config = window.V5Config?.PRODUCT_DB || {
                TIMEOUT: 5000,
                RETRY_ATTEMPTS: 2,
                FILE_PATH: 'js/complete-products.js',
                GLOBAL_VAR: 'completeProductDatabase'
            };
        }

        /**
         * Main method to get products
         * Returns a promise that resolves to the product database
         */
        async loadProducts() {
            // 1. Return existing data if available
            if (this.database) return this.database;

            // 2. Return existing promise if loading is already in progress (deduplication)
            if (this.loadingPromise) return this.loadingPromise;

            // 3. Start new load sequence
            this.loadingPromise = this._initLoadSequence();
            return this.loadingPromise;
        }

        async _initLoadSequence() {
            console.log('[ProductLoader] Starting product load sequence...');

            try {
                // Step 1: Check if global variable already exists (fastest)
                if (this._checkGlobalDatabase()) {
                    return this.database;
                }

                // Step 2: If not found, try to load the script dynamically
                // This handles cases where product-loader.js runs before complete-products.js
                await this._loadDatabaseScript();
                
                // Step 3: Check again after script load
                if (this._checkGlobalDatabase()) {
                    return this.database;
                }

                throw new Error('Database variable not found after script load');

            } catch (error) {
                console.error('[ProductLoader] Fatal error loading products:', error);
                this.loadingPromise = null; // Reset promise on failure so we can try again
                
                // Dispatch event for UI handling (e.g., show error message)
                window.dispatchEvent(new CustomEvent('productLoadError', { 
                    detail: { message: error.message } 
                }));
                
                throw error;
            }
        }

        /**
         * Checks window objects for product data
         */
        _checkGlobalDatabase() {
            // Check newly standardized database
            if (window.completeProductDatabase?.products?.length > 0) {
                this.database = window.completeProductDatabase;
                console.log('[ProductLoader] Loaded from completeProductDatabase');
                return true;
            }
            
            // Check legacy database support
            if (window.productDatabase?.products?.length > 0) {
                this.database = window.productDatabase;
                console.log('[ProductLoader] Loaded from legacy productDatabase');
                return true;
            }

            return false;
        }

        /**
         * Dynamically loads the product data script
         */
        _loadDatabaseScript() {
            return new Promise((resolve, reject) => {
                const src = this.config.FILE_PATH || 'js/complete-products.js';
                console.log(`[ProductLoader] Dynamically loading script: ${src}`);

                const script = document.createElement('script');
                script.src = src;
                script.async = true;

                const timeoutId = setTimeout(() => {
                    reject(new Error('Script load timeout'));
                }, this.config.TIMEOUT);

                script.onload = () => {
                    clearTimeout(timeoutId);
                    // Give a small buffer for script execution context
                    setTimeout(resolve, 50);
                };

                script.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load script: ${src}`));
                };

                document.body.appendChild(script);
            });
        }

        /**
         * Helper: Get a single product by ID
         */
        async getProductById(id) {
            const db = await this.loadProducts();
            return db.byId?.[id] || db.products?.find(p => p.id === id);
        }

        /**
         * Helper: Get products by category
         */
        async getProductsByCategory(category) {
            const db = await this.loadProducts();
            if (!category || category === 'all') return db.products;
            return db.products.filter(p => p.category === category);
        }
    }

    // Expose class to window
    window.ProductLoader = ProductLoader;
    
    // Create global instance for immediate use
    window.productLoader = new ProductLoader();
}
