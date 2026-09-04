# V5 Medical LTD - Official Website

![V5 Medical Logo](https://pub-224e4e74685e409e833e89d4ab5143fb.r2.dev/v5medlogo.png)

> **Professional Global Medical Consumables Supplier**  
> Factory Direct | ISO 13485 | CE | FDA Certified

[![Website](https://img.shields.io/badge/Website-v5med.net-blue)](https://v5med.net)
[![Version](https://img.shields.io/badge/Version-2.9.0-green)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=white)

---

## 🎯 Project Overview

This repository contains the **official website** for **V5 Medical LTD** ([v5med.net](https://v5med.net)), a China-based medical supply chain integrator specializing in surgical consumables, sterile packs, and medical devices for global distributors.

The site is built as a **high-performance static web application**, optimized for:
- ⚡ **Speed**: Cloudflare CDN with <1s LCP
- 🔍 **SEO**: Dynamic meta tags, JSON-LD structured data (via `seo-utils.js`)
- 🎨 **UX**: Mobile-first responsive design
- 🛡️ **Security**: CSP headers, XSS protection

---

## 🚀 Key Features

### 1. 🏗️ Dynamic Layout Engine
- **Unified Header & Footer**: `js/layout.js` renders navigation across all pages
- **Single Source of Truth**: Update menu/contact once, applies globally

### 2. ⚙️ Centralized Configuration
- **Config First**: All globals (contact, API URLs, CDN paths) in `js/config.js`
- **Environment Aware**: Auto-detects localhost vs production

### 3. 🖼️ Smart Image Loading
- **Triple Fallback System** via `js/image-utils.js`:
  1. Cloudflare R2 CDN (Primary)
  2. Local path (Development, aligned with `images/products/` structured catalog)
  3. GitHub Raw (Emergency)
  4. Default Placeholder (Final)
- Standardized product image directory structure for surgical sutures, protective equipment, dental products, etc.

### 4. 🛍️ Dynamic Product Database
- **No Backend Required**: Product catalog in `js/complete-products.js`
- **Features**: Category filtering, real-time search (debounced in `catalog.html`), dynamic detail pages
- **Dual Database Support**: `product-loader.js` supports legacy (`productDatabase`) and new (`completeProductDatabase`) schemas

### 5. 🔍 SEO Optimized
- **Dynamic Meta Tags**: `js/seo-utils.js` updates `<title>`, `<meta>`, JSON-LD per page
- **Performance**: LCP images use `fetchpriority="high"`, lazy loading for below-fold content
- **Analytics**: Built-in tracking for page views, WhatsApp clicks, product interactions (GDPR compliant)

### 6. 📝 Docsify-Powered Knowledge Hub
- **Blog & Technical Content**: `/blog/` runs Docsify for Markdown-based content
  - Medical packaging specs (Tyvek vs. Medical Paper)
  - CE Marking (MDR) compliance guides
  - Surgical pack sterilization standards (EN ISO 13408)
  - Payment strategy ("Two-Lane" system for fast delivery)
- **Categories**: Sourcing Strategy, Technical Specs, Compliance (MDR), Sterilization Standards

### 7. 📕 Product Catalog PDF
- **Online Viewing**: Direct PDF access from product catalog page
- **GitHub-hosted**: `pdf/Catalog.pdf` auto-deployed with site
- **No Backend Required**: Static file served via CDN

### 8. 💳 Payment Gateway Integration
- **Stripe**: Credit card payments for samples (<$500)
- **Bank Wire (T/T)**: For bulk orders (>$500)
- **Dual-lane system**: Fast lane (Credit Card) for trials, Commercial lane (T/T) for production

### 9. 🏭 Static SEO Page Generator
- **`build-static.py`**: One command regenerates all crawlable pages from the single data source
- **Outputs**: 56 static product pages (`products/<id>.html`), 8 category landing pages (`categories/<slug>.html`), static blog article pages (`blog/posts/<slug>.html`), and both sitemaps
- **Fail-fast validation**: Product count must match `metadata.totalProducts`; every product image must exist and be >1KB
- **Category-differentiated content**: Certifications, specs and descriptions per category (no blanket FDA/Sterile claims on packaging products)
- **Real `lastmod`**: Sitemap dates come from each file's last git commit, not the build date

### 10. 📊 Performance Monitoring
- **Core Web Vitals Tracking**: `performance-monitor.js` records TTFB, DOM Ready, Full Load metrics
- **Optimized Loading**: Non-critical JS deferred, explicit image dimensions (0 CLS)

---

## 📂 Project Structure

```
v5md/
├── index.html              # Homepage (Hero, Features, CTA)
├── about.html              # Company Profile, Team, Certifications
├── catalog.html            # Product Catalog (Search & Filter with WhatsApp CTA)
├── product-detail.html     # Dynamic Product Template
├── contact.html            # Multi-type Contact Form (Quote/QA/OEM)
├── payment.html            # Secure Payment Portal (Stripe + Bank Wire)
├── blog/                   # Docsify Knowledge Hub
│   ├── index.html          # Blog Entry Point
│   ├── README.md           # Blog Homepage (Technical Specs & Guides)
│   ├── _sidebar.md         # Navigation Sidebar
│   ├── sitemap.xml         # Blog Sitemap (static article pages)
│   └── posts/              # Markdown Articles + generated static HTML
│       ├── tyvek-vs-paper.md / .html
│       ├── payment-strategy-guide.md / .html
│       ├── ce-marking-process.md / .html
│       └── ...
├── products/               # 56 static product pages (generated, canonical)
├── categories/             # 8 category landing pages (generated)
├── build-static.py         # 🏭 Static SEO page generator (single data source → HTML + sitemaps)
├── js/                     # Core Logic
│   ├── config.js           # 🔧 [CRITICAL] Global Settings & Paths
│   ├── layout.js           # 🔧 [CRITICAL] Header/Footer Renderer (+ site-wide GA4 injection)
│   ├── main.js             # General UI Interactions (Mobile Menu, Scroll)
│   ├── complete-products.js# Product Database (56 SKUs, category-differentiated specs/certs)
│   ├── image-utils.js      # Smart Image Loader (Triple Fallback)
│   ├── seo-utils.js        # Dynamic SEO Manager (JSON-LD, Meta Tags)
│   ├── product-loader.js   # Async Product Data Loader (dual DB support)
│   ├── security-utils.js   # XSS Protection, Input Validation
│   ├── performance-monitor.js # Core Web Vitals tracking
│   └── ...
├── css/
│   └── style.css           # Custom Overrides for Tailwind
├── images/                 # Local Asset Fallbacks
│   ├── products/           # Standardized Product Images (per-SKU files)
│   │   ├── surgical-sutures/
│   │   ├── surgical-instruments/
│   │   ├── gauze-dressings/
│   │   ├── protective-equipment/
│   │   ├── injection-infusion/
│   │   ├── dental-products/
│   │   ├── pharmaceutical-packaging/
│   │   └── surgical-packs/
│   ├── 2026-Greeting-Card/ # Monthly greeting card artwork (optimized JPEG)
│   ├── logo/
│   │   └── v5logo.png
│   ├── hero-bg.jpg
│   └── ...
├── pdf/                    # Downloadable Catalogs
│   ├── Catalog.pdf
│   ├── price list.pdf
│   ├── V5_Medical_HighPurity_PriceList_EN.pdf
│   └── V5_Medical_Capability_Statement.pdf
├── _headers                # Cloudflare Pages Headers (CSP, HSTS, CORS)
├── _redirects              # Cloudflare Pages Redirects (SEO, UTM)
├── robots.txt              # SEO Crawler Instructions
├── sitemap.xml             # Main Site Sitemap
└── README.md               # This File
```

---

## 🛠️ How to Maintain

### 1️⃣ Updating Contact Info
Edit `js/config.js` → Change `CONTACT` object → Auto-updates Header, Footer, Contact Page.

### 2️⃣ Adding/Editing Products
Edit `js/complete-products.js` → Add/modify an entry in the `productData` array → Catalog updates automatically:
```javascript
{ name: "New Surgical Suture", id: "new-product", category: "surgical-sutures", img: "images/products/surgical-sutures/new-product.jpg" }
```
- `category` must match a key in `categories` (aligned with the image directory structure)
- Certifications / specs / descriptions come from `categoryProfiles` — edit them per category, not per product
- After editing, run `python build-static.py` to regenerate static pages & sitemaps (it validates image files and product count, failing fast on problems)

### 3️⃣ Modifying Layout (Header/Footer)
Edit `js/layout.js` → Update `renderHeader()` or `renderFooter()` → Changes apply site-wide.

### 4️⃣ Editing Page Content
Open specific HTML file → Edit content inside `<main>` tag → **Do not manually add `<nav>` or `<footer>`** (auto-injected).

### 5️⃣ Adding Blog Posts
1. Create Markdown file in `blog/posts/`
2. Add YAML frontmatter:
   ```markdown
   ---
   title: "Your Title"
   date: "2025-01-02"
   author: "V5 Team"
   category: "Compliance"
   ---
   ```
3. Update `blog/_sidebar.md` with link (e.g., technical specs for sterile barrier systems)
4. Run `python build-static.py` to generate the static article page (`blog/posts/<slug>.html`) — this is what Google indexes; the Docsify hash route is for interactive reading

### 6️⃣ Rebuilding Static SEO Pages
```bash
pip install markdown   # once (a venv is recommended)
python build-static.py
```
Regenerates `products/`, `categories/`, `blog/posts/*.html`, `sitemap.xml` and `blog/sitemap.xml` from `js/complete-products.js` + `blog/posts/*.md`. The build **fails fast** if a product image is missing/corrupt or the product count doesn't match `metadata.totalProducts`.

---

## 💻 Local Development

### Prerequisites
- Any static web server (e.g., Live Server, Python `http.server`, Node.js `http-server`)

### Clone & Run
```bash
git clone https://github.com/alden888/v5md.git
cd v5md

# Option 1: VS Code Live Server
# Install "Live Server" extension → Click "Go Live"

# Option 2: Python
python3 -m http.server 8000
# Visit http://localhost:8000

# Option 3: Node.js
npx http-server -p 8000
```

> ⚠️ **CORS Warning**: Opening HTML files directly (`file://`) may block JS features (e.g., product database loading) due to browser security policies.

---

## 🚀 Deployment

### Recommended: Cloudflare Pages
1. Connect GitHub repo to Cloudflare Pages
2. Pre-configured files:
   - `_headers`: CSP, HSTS, caching rules
   - `_redirects`: SEO-friendly redirects, WhatsApp shortcuts
3. **Build Command**: None (purely static)
4. **Output Directory**: `/` (root)

### Alternative: GitHub Pages
1. Enable GitHub Pages in repo settings
2. Set source to root directory
3. ⚠️ Note: Custom headers (`_headers`) won't work (no CSP/HSTS support)

---

## ⚡ Performance Optimization

### Core Web Vitals
- **LCP** (<2.5s): Critical images use `fetchpriority="high"`
- **FID** (<100ms): Non-critical JS deferred
- **CLS** (0): Explicit image dimensions (aligned with standardized product image structure)

### Caching Strategy
- **Static Assets**: 1 year cache (`immutable`)
- **HTML**: 1 hour cache (`must-revalidate`)
- **Cache Busting**: Version parameters (`main.js?v=2.2.0`)

### CDN Configuration
- **Cloudflare R2**: Primary image host (for product images, logo)
- **GitHub Raw**: Emergency fallback
- **Auto-failover**: Triple-layer error handling in `image-utils.js`

---

## 🔒 Security

- **Content Security Policy (CSP)**: Enforced via `_headers` (single-line format — Cloudflare Pages does not support multi-line header values)
- **HTTPS Only**: Cloudflare auto-redirect
- **XSS Protection**: `security-utils.js` sanitizes inputs
- **CSRF Protection**: Form nonces, SameSite cookies
- **Payment Page**: Bank account details are NOT published on `payment.html` — customers are directed to their sales representative / Proforma Invoice (anti-fraud)

---

## 📊 Analytics

Built-in tracking for:
- Page views (via `performance-monitor.js`)
- PDF downloads
- WhatsApp clicks (tracked in `catalog.html` WhatsApp button)
- Product interactions
- Core Web Vitals (TTFB, DOM Ready, Full Load)

Compliant with GDPR (anonymous data, no PII).

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Header/Footer render on all pages
- [ ] Product images load with fallback (test broken CDN paths)
- [ ] Contact form submission (test mode)
- [ ] Mobile responsiveness (375px → 1920px)
- [ ] Cross-browser (Chrome, Firefox, Safari, Edge)
- [ ] Product search in `catalog.html`
- [ ] Static pages in `products/` / `categories/` / `blog/posts/*.html` are up to date (`python build-static.py`)
- [ ] SEO meta tags update (verify via `seo-utils.js`)

### Performance Testing
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --config=lighthouserc.json
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **JS**: ES6+, no jQuery (consistent with existing utils like `seo-utils.js`, `performance-monitor.js`)
- **CSS**: Tailwind utility-first, minimal custom CSS (`css/style.css`)
- **HTML**: Semantic tags, ARIA labels for accessibility
- **File Naming**: Lowercase with hyphens (aligned with product image structure)

---

## 📄 License

© 2025 V5 Medical LTD. All Rights Reserved.

**Unauthorized copying, modification, distribution, or use of this software is prohibited** without prior written permission from V5 Medical LTD.

---

## 📞 Support

### Technical Support
- **Email**: tech@v5med.net
- **WhatsApp**: +44-078-9504-7944
- **Website**: [v5med.net](https://v5med.net)

### Business Inquiries
- **Sales**: sales@v5med.net
- **QA/Regulatory**: qa@v5med.net (CE Marking, sterilization standards)
- **Finance**: finance@v5med.net (payment strategy, T/T/Credit Card lanes)

---

## 🎓 Documentation References
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Docsify Docs](https://docsify.js.org/)
- [Stripe Payment Links](https://stripe.com/docs/payment-links)
- [EN ISO 13408 - Sterilization Standards](https://www.iso.org/standard/74439.html)
- [MDR (EU 2017/745)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32017R0745)

---

## 🗓️ Changelog

### [2.9.0] - 2026-08-22
#### Added
- Static SEO page generator `build-static.py` with fail-fast validation (product count + image integrity)
- 56 static product pages, 8 category landing pages, static blog article pages (crawlable without JS)
- Site-wide GA4 injection via `layout.js`; blog sitemap (`blog/sitemap.xml`)
- `pharmaceutical-packaging` category (5 SKUs) with category-differentiated specs/certifications
- Per-SKU branded placeholder images; compressed greeting-card artwork (5.8MB → 306KB, served locally)

#### Changed
- Catalog & related-product links now point to canonical static pages (`/products/<id>.html`)
- Product schema no longer carries placeholder `price: "0"` offers; FAQ schema matches visible content only
- Sitemap `lastmod` uses real git commit dates; `noindex` payment page removed from sitemap
- Blanket "FDA"/"Sterile" badges removed from non-sterile packaging products
- Bank account details removed from `payment.html` (anti-fraud: via sales rep / PI only)

#### Fixed
- Broken `default-product.jpg` (5-byte text file) and 4 corrupt/missing product images
- Greeting card image blocked by CSP (was hotlinked from `raw.githubusercontent.com`)
- Category CTA text swallowed by implicit string concatenation in generator
- `og:type` hardcoded to `article` on all generated pages
- Dead `/work` redirect to the removed workbench

#### Removed
- Internal workbench (`/workbench/`) — removed from repository

---

### [2.8.0] - 2025-03-22
#### Added
- Product Catalog PDF online viewer (`catalog.html` sidebar)
- QA Team on-site photo in homepage hero section

#### Changed
- Updated all JS file versions across site for cache busting
- Migrated `layout.js` V5Layout to `window` object for better module detection

#### Fixed
- Privacy Policy footer link now correctly points to `privacy.html`
- ON-SITE PROTOCOL label repositioned to top-left of image
- Fixed layout.js loading failure on Cloudflare Pages (delayed config access)
- PDF links now use relative paths (hide GitHub repo from customers)

---

### [2.7.0] - 2025-01-02
#### Added
- Payment portal (`payment.html`) with Stripe integration (Two-Lane payment system)
- Internal workbench (`/workbench/`) with authentication & order management
- Blog knowledge hub (`/blog/`) powered by Docsify (CE Marking, sterilization, packaging specs)
- Enhanced SEO utilities (`seo-utils.js`) with JSON-LD injection
- Product loader system (`product-loader.js`) with dual database support
- Standardized product image directory structure (`images/products/`)

#### Changed
- Migrated to complete product database (51 SKUs)
- Updated image loading with triple fallback (aligned with new image structure)
- Improved mobile responsiveness for `catalog.html` search & WhatsApp CTA
- Refactored performance monitoring (`performance-monitor.js`) for Core Web Vitals

#### Fixed
- Image path resolution in product catalog (matching `images/products/` structure)
- Mobile menu z-index conflicts
- Google Translate positioning
- Workbench login error handling

### [2.0.0] - 2024-12-15
- Initial public release

---

**Last Updated**: August 22, 2026  
**Maintained by**: V5 Medical Development Team  
**Build Status**: ✅ Stable (Production-Ready)