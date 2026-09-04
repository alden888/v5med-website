/**
 * V5 Medical Website Configuration (v5med.net)
 * @version 1.0.1
 * @updated 2026-09-04
 * 
 * 建站令 CEO-ORD-20260904-020 强制要求：
 * - 所有域名/品牌/GA4 ID/联系方式必须从此文件注入
 * - 严禁硬编码v5med.net的任何值
 */

const V5Config = (() => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isProduction = hostname === 'v5med.net' || hostname === 'www.v5med.net';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    return {
        ENV: { IS_PRODUCTION: isProduction, IS_LOCAL: isLocal },
        
        // 品牌域名
        DOMAIN: 'v5med.net',
        BASE_URL: '', 
        
        PATHS: { 
            IMAGES: 'images', 
            PRODUCTS: 'images/products' 
        },
        
        IMAGES: {
            PLACEHOLDER: 'images/products/default-product.jpg',
            LOGO: 'https://pub-224e4e74685e409e833e89d4ab5143fb.r2.dev/v5logo.png',
            LOGO_LOCAL: 'images/v5logo.png',
            FALLBACK_BASE: 'https://raw.githubusercontent.com/alden888/v5med-website/main/'
        },
        
        SEO: {
            SITE_NAME: 'V5 Medical',
            DEFAULT_TITLE: 'V5 Medical - Global Medical Consumables & Pharmaceutical Packaging Supplier',
            DESCRIPTION: 'Trusted B2B supplier of surgical consumables, medical devices, peptide raw materials, and pharmaceutical packaging. CE/ISO certified, serving Southeast Asia, Middle East, and global markets.'
        },
        
        CONTACT: {
            WHATSAPP: { 
                DISPLAY: '+86 151 3300 8348', 
                NUMBER: '8615133008348', 
                API_URL: 'https://wa.me/8615133008348' 
            },
            EMAIL: { 
                SALES: 'sales@v5med.net',
                SUPPORT: 'support@v5med.net'
            },
            ADDRESS: 'Suzhou, Jiangsu, China'
        },
        
        // GA4 Property - v5med.net独立账号（CEO确认 2026-09-04）
        ANALYTICS: {
            GA4_ID: 'G-HVN50TM5EK'  // v5med.net独立GA4 Property
        },
        
        // JSON-LD 结构化数据
        JSON_LD: {
            URL: 'https://v5med.net',
            LOGO: 'https://v5med.net/images/v5logo.png',
            SAME_AS: [
                'https://v5med.net',
                'https://www.linkedin.com/company/v5medical'
            ]
        }
    };
})();

if (typeof window !== 'undefined') window.V5Config = V5Config;
if (typeof module !== 'undefined') module.exports = V5Config;
