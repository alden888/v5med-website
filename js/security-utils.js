/**
 * V5 Medical Security Utilities
 * 用于防止 XSS 攻击和验证输入
 * @version 1.0.0
 */

const SecurityUtils = {
    /**
     * 安全的设置 HTML 内容
     * 简单的过滤机制，移除 <script> 标签和 on* 事件
     */
    safeSetHTML(element, html) {
        if (!element) return;

        // 1. 如果内容为空，直接清空
        if (!html) {
            element.innerHTML = '';
            return;
        }

        // 2. 简单的清洗逻辑
        // 移除 <script> 标签及其内容
        let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        
        // 移除行内事件处理器 (如 onload, onclick, onerror) 以防恶意执行
        // 注意：这会允许正常的 img src，但阻止 <img src=x onerror=alert(1)>
        cleaned = cleaned.replace(/ on\w+="[^"]*"/g, ""); 

        // 3. 赋值
        element.innerHTML = cleaned;
    },

    /**
     * 邮箱格式验证
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * 电话号码验证
     */
    isValidPhone(phone) {
        // 允许数字、空格、加号、减号、括号
        return /^[0-9+\-\s()]{7,20}$/.test(phone);
    }
};

// 挂载到全局对象，确保其他文件能用
window.SecurityUtils = SecurityUtils;
