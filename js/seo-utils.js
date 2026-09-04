/**
 * V5 Medical Enhanced SEO Utilities
 * Generates dynamic JSON-LD structured data for Google Rich Snippets.
 * @version 3.1.0
 * @updated 2026-07-18
 *
 * [CHANGELOG 3.1.0]
 * - [FIX] Product schema 移除 price: "0" 的占位 offers。
 *   Google 要求 price 必须真实，占位价格会被判定为误导性结构化数据，
 *   可能导致富媒体结果被取消资格。B2B "Contact for Price" 模式
 *   正确做法是省略 offers 字段。
 * - [FIX] 移除 injectAllSchemas 中的 FAQ 自动注入。
 *   Google 指南要求 FAQ 结构化数据必须与页面可见内容一一对应，
 *   JS 注入无可见内容的 FAQ 属于违规。首页现已有真实可见的
 *   FAQ 板块和与之匹配的静态 FAQPage schema。
 */

class EnhancedSEOUtils {
    constructor() {
        this.config = window.V5Config?.SEO || {};
        this.baseUrl = window.V5Config?.BASE_URL || window.location.origin;
    }

    /**
     * 1. 基础页面 SEO 更新 (Title & Meta)
     */
    updatePage(data) {
        if (data.title) document.title = data.title;
        if (data.description) {
            document.querySelector('meta[name="description"]')?.setAttribute('content', data.description);
            document.querySelector('meta[property="og:description"]')?.setAttribute('content', data.description);
        }
        if (data.image) {
            document.querySelector('meta[property="og:image"]')?.setAttribute('content', this._resolveUrl(data.image));
        }

        // 自动注入 Schema
        this.injectAllSchemas(data);
    }

    /**
     * 2. 生成产品结构化数据 (Product Schema)
     * [FIX] B2B 询盘模式不包含 offers/price 字段（合规）
     */
    generateProductSchema(product) {
        // 防御性检查：确保 images 是数组
        const images = Array.isArray(product.images) ? product.images : [product.images || ''];

        const schema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "description": product.short || product.description,
            "sku": product.id,
            "mpn": String(product.id).toUpperCase(),
            "image": images.map(img => this._resolveUrl(img)),
            "brand": {
                "@type": "Brand",
                "name": "V5 Medical",
                "logo": "https://pub-224e4e74685e409e833e89d4ab5143fb.r2.dev/v5medlogo.png"
            },
            "manufacturer": {
                "@type": "Organization",
                "name": "V5 Medical LTD",
                "url": "https://v5med.net"
            }
        };

        // 认证信息作为附加属性输出（增强 E-E-A-T 信号，不影响富媒体资格）
        if (Array.isArray(product.certifications) && product.certifications.length > 0) {
            schema.additionalProperty = product.certifications.map(cert => ({
                "@type": "PropertyValue",
                "name": "Certification",
                "value": cert
            }));
        }

        return schema;
    }

    /**
     * 3. [DEPRECATED] FAQ 结构化数据
     * 不再自动注入。FAQ schema 必须对应页面可见内容，
     * 请在 HTML 中静态编写匹配的 <script type="application/ld+json">。
     */
    generateFAQSchema() {
        console.warn('[SEO] generateFAQSchema() is deprecated. Use static FAQPage JSON-LD matching visible content.');
        return null;
    }

    /**
     * 4. 生成面包屑导航
     */
    generateBreadcrumbSchema(items) {
        if (!items || items.length === 0) return null;
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": this._resolveUrl(item.url)
            }))
        };
    }

    /**
     * 5. 生成本地商家信息 (用于 Contact 页)
     */
    generateLocalBusinessSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "MedicalBusiness",
            "name": "V5 Medical LTD",
            "image": "https://pub-224e4e74685e409e833e89d4ab5143fb.r2.dev/v5medlogo.png",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "No. 168, Luying Road, Kunshan Development Zone",
                "addressLocality": "Kunshan",
                "addressRegion": "Jiangsu",
                "postalCode": "215300",
                "addressCountry": "CN"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "31.3884",
                "longitude": "120.9820"
            },
            "telephone": "+86-0512-8781-1988",
            "priceRange": "$$",
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "08:30",
                    "closes": "17:30"
                }
            ]
        };
    }

    /**
     * 💉 核心：注入所有 Schema
     */
    injectAllSchemas(data = {}) {
        const schemas = [];

        // Product
        if (data.product) schemas.push(this.generateProductSchema(data.product));

        // Breadcrumb
        if (data.breadcrumb) {
            const breadcrumbSchema = this.generateBreadcrumbSchema(data.breadcrumb);
            if (breadcrumbSchema) schemas.push(breadcrumbSchema);
        }

        // [REMOVED] includeFAQ 分支已移除 —— FAQ 必须与可见内容匹配（见文件头说明）

        // Local Business (手动开启)
        if (data.includeLocalBusiness) schemas.push(this.generateLocalBusinessSchema());

        // 移除旧的 Script
        const oldScript = document.getElementById('v5-dynamic-schema');
        if (oldScript) oldScript.remove();

        // 注入新的 Script
        if (schemas.length > 0) {
            const script = document.createElement('script');
            script.id = 'v5-dynamic-schema';
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(schemas);
            document.head.appendChild(script);
            console.log(`[SEO] Injected ${schemas.length} schema(s)`);
        }
    }

    // Helpers
    _resolveUrl(path) {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        // 使用 window.imageUtils 的逻辑（如果有）或简单拼接
        if (window.imageUtils) return window.imageUtils.getImageUrl(path);
        return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    }
}

// 初始化
window.seoUtils = new EnhancedSEOUtils();
