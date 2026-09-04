# V5 Medical SEO 优化包 — 交付说明
**生成日期：2026-07-18**

本包按优先级完成了审计报告中的 P0/P1 项。所有改动都在原文件基础上完成，可直接覆盖上传。

---

## 一、改动清单

### 🔴 P0（收录与合规）

| 文件 | 改动 |
|---|---|
| `robots.txt` | 合并冲突的爬虫分组（原独立 Googlebot 组导致全局 Disallow 对 Google 失效）；屏蔽 `/workbench/`；保留 PDF 策略（仅放行 Catalog.pdf） |
| `_headers` | ① 新增 `/workbench/*` → `X-Robots-Tag: noindex, nofollow`；② **CSP 改为单行**（Cloudflare Pages 不支持多行 header，原 CSP 实际未生效）；③ CSP 补充 `googletagmanager.com`（原配置拦截了博客 GA4）和 GA/Translate 域名 |
| `sitemap.xml` | 重新生成：去掉重复的 `/index.html`、去掉被 robots 屏蔽的 PDF、去掉不存在的 `/blog.html`；收录全部 51 个产品页 + 7 个分类页；lastmod 全部更新 |
| `blog/sitemap.xml` | **新增**，8 篇文章独立 sitemap（robots.txt 早已声明但它不存在） |
| `js/seo-utils.js` | 移除 Product schema 中违规的 `price: "0"` 占位 offers（B2B 询盘模式正确做法是省略）；移除无可见内容的 FAQ 自动注入 |
| `blog/posts/*.html` | **新增 8 个静态文章页**：独立 title/description/canonical/OG/Article+面包屑 schema。原 Docsify hash 路由（`/blog/#/posts/x`）Google 无法索引，这是本次最重要的修复 |

### 🟡 P1（关键词与结构）

| 文件 | 改动 |
|---|---|
| `index.html` | ① title 改为 `Surgical Sutures & Medical Consumables Supplier \| V5 Medical`；② description 加入 ISO 13485/CE/FDA/OEM 关键词；③ H1 加入 "Certified Medical Consumables"；④ 新增**可见 FAQ 板块**（4 条）+ 匹配的静态 FAQPage schema；⑤ 博客卡片链接改为静态文章页；⑥ 5 个核心 JS 加 `defer`；⑦ 分类卡片链接指向新分类页 |
| `products/*.html` | **新增 51 个静态产品页**：Product schema（无 price 违规）、面包屑、规格表、询盘 CTA |
| `categories/*.html` | **新增 7 个分类落地页**：每个分类独立关键词 title（如 "Surgical Sutures Manufacturer & Supplier"）、SEO 文案、ItemList schema |
| `product-detail.html` | 动态页 canonical 指向对应静态页（避免重复内容分散权重）；内链博客 hash 链接全部改为静态页 |
| `js/layout.js` | 新增全站 GA4 自动注入（`G-JE15YSMC2W`，幂等）——**原主站所有页面没有 GA 统计**，只有博客有且被 CSP 拦截 |
| `build-static.py` | **新增**，静态页面生成器。以后改完 `blog/posts/*.md` 或 `js/complete-products.js` 后运行 `python build-static.py` 即可重新生成全部静态页 + sitemap |

---

## 二、上传方式

**方式 A（推荐）：整体覆盖**
将本包内以下路径上传到仓库对应位置（保持目录结构）：
- 覆盖：`robots.txt`、`_headers`、`sitemap.xml`、`index.html`、`product-detail.html`、`js/seo-utils.js`、`js/layout.js`
- 新增：`build-static.py`、`blog/sitemap.xml`、`blog/posts/*.html`、`products/`（整个目录）、`categories/`（整个目录）
- 不用动：`blog/posts/*.md`、`js/complete-products.js`（与仓库一致，仅作构建数据源）

**方式 B：Git**
```bash
# 在本包目录内（已是完整文件树）
git init && git remote add origin https://github.com/alden888/v5md.git
git fetch && git checkout main
git add -A && git commit -m "SEO: static blog/product pages, fix robots/sitemap/schema, GA4, FAQ"
git push origin main
```

---

## 三、上传后立即执行

1. **Google Search Console**：重新提交 `sitemap.xml` 和 `blog/sitemap.xml`；对几个关键新 URL（首页、1 个分类页、1 个产品页、1 篇文章）用"网址检查 → 请求编入索引"。
2. **Bing Webmaster Tools**：同样提交 sitemap。
3. **Rich Results Test**（search.google.com/test/rich-results）：抽查 1 个产品页 + 首页，确认无结构化数据报错。
4. 部署后确认 Cloudflare Pages 构建日志无报错（纯静态，无构建命令）。

## 四、后续待办（本次未做，按 ROI 排序）

1. **Tailwind 生产构建**：把 `cdn.tailwindcss.com` 换成构建时生成的 CSS（省 ~300KB，提升 LCP/INP）。
2. **图片 CDN 自定义域**：R2 绑 `cdn.v5med.net`，替换 `pub-xxx.r2.dev`，并转 WebP。
3. **关键词扩写**：51 个产品页目前是模板化描述，建议先人工精修 Top 10 SKU（独特规格、应用场景、FAQ）。
4. **E-E-A-T**：博客署名改为真实专家 + 作者简介页；增加证书展示页。
5. **多语言**：Google Translate 不产生可索引页面，建议为西语/阿语市场做 2-3 个静态落地页 + hreflang。
6. **旧 URL 兼容**：`product-detail.html?id=xxx` 已加 canonical；若 GSC 显示旧 URL 已被索引，保持现状即可（Cloudflare `_redirects` 不支持按 query 跳转）。
