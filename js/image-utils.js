/**
 * V5 Medical Image Utilities - OPTIMIZED
 * Handles smart path resolution, CDN switching, and robust error fallbacks.
 * @version 3.0.0
 * @updated 2024-12-16
 */

class ImageUtils {
    constructor() {
        this.config = window.V5Config || { BASE_URL: '', IMAGES: {} };
        // 默认占位图
        this.placeholder = this.config.IMAGES.PLACEHOLDER || 'images/products/default-product.jpg';
        
        // 定义图床基准地址
        // 1. Cloudflare R2 (生产环境首选)
        this.cdnBase = 'https://pub-224e4e74685e409e833e89d4ab5143fb.r2.dev/';
        // 2. GitHub Raw (回退备选)
        this.githubBase = 'https://raw.githubusercontent.com/alden888/v5md/main/';
    }

    /**
     * 🔧 核心功能：获取图片 URL
     * 根据环境自动决定使用 CDN 还是本地路径
     */
    getImageUrl(path) {
        if (!path) return this.placeholder;
        if (path.startsWith('http')) return path;
        
        // 1. 清理路径：移除开头的斜杠 (防止拼接时出现 //)
        const cleanPath = path.replace(/^\/+/, '');
        
        // 2. 生产环境：优先使用 Cloudflare R2 CDN
        if (this.config.ENV && this.config.ENV.IS_PRODUCTION) {
            return `${this.cdnBase}${cleanPath}`;
        }

        // 3. 开发环境：使用本地相对路径
        return cleanPath; 
    }

    /**
     * 🚀 错误处理：三级智能回退机制
     * Local/CDN -> GitHub Raw -> Placeholder
     */
    handleError(img) {
        // 1. 防止事件重复触发导致死循环
        img.onerror = null; 
        
        const currentSrc = img.src;
        // 获取原始路径 (这是关键，必须确保 HTML 中 img 标签有 data-original-src 属性)
        const originalPath = img.getAttribute('data-original-src');

        // 2. 如果已经是占位图了，停止尝试，避免死循环
        if (currentSrc.includes('default-product.jpg') || currentSrc.includes(this.placeholder)) {
            console.warn('[ImageUtils] Fallback to placeholder complete.');
            return;
        }

        // 3. 第一次回退：尝试从 GitHub Raw 加载
        // 条件：当前不是 GitHub 链接，且存在原始路径
        if (!currentSrc.includes('raw.githubusercontent.com') && originalPath) {
            const cleanPath = originalPath.replace(/^\/+/, '');
            const githubUrl = `${this.githubBase}${cleanPath}`;
            
            console.warn(`[ImageUtils] Load failed. Retrying with GitHub: ${githubUrl}`);
            img.src = githubUrl;
            return;
        }

        // 4. 第二次回退：GitHub 也挂了，显示默认占位图
        console.error(`[ImageUtils] All sources failed for: ${originalPath || currentSrc}. Showing placeholder.`);
        img.src = this.placeholder;
        // 可选：添加样式表明图片失效
        img.classList.add('img-load-error'); 
    }

    /**
     * 🆕 工具：批量预加载图片
     * 用于幻灯片或关键区域
     */
    preloadImages(urls) {
        if (!Array.isArray(urls)) return;
        urls.forEach(url => {
            const img = new Image();
            img.src = this.getImageUrl(url);
        });
    }
}

// 初始化并挂载到全局对象
window.imageUtils = new ImageUtils();
