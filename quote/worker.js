/**
 * Cloudflare Worker — Quote Form Proxy
 * Handles form submissions from quote.12888.de → ERP API (erp.12888.de)
 *
 * Route: quote.12888.de/api/submit-quote
 * Purpose: Avoid CORS issues when submitting from browser to ERP
 *
 * Environment Variables (set in Cloudflare dashboard):
 *   ERP_URL      = https://erp.12888.de
 *   ERP_USER     = go@v5medical.ai
 *   ERP_PWD      = <secret>
 */

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only accept POST to /api/submit-quote
        if (request.method !== 'POST' || url.pathname !== '/api/submit-quote') {
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        try {
            const body = await request.json();
            const { company, contact, email, phone, category, description } = body;

            // Validate required fields
            if (!company || !contact || !email || !category) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return new Response(JSON.stringify({ error: 'Invalid email' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const ERP_URL = env.ERP_URL || 'https://erp.12888.de';

            // Step 1: Login to ERP
            const loginResp = await fetch(`${ERP_URL}/api/method/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usr: env.ERP_USER || 'go@v5medical.ai',
                    pwd: env.ERP_PWD,
                }),
            });

            if (!loginResp.ok) {
                console.error('ERP login failed:', loginResp.status);
                return new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // Extract session cookie
            const setCookie = loginResp.headers.get('set-cookie') || '';
            const sid = setCookie.match(/sid=([^;]+)/)?.[1] || '';

            // Step 2: Create Lead
            const leadData = {
                doctype: 'Lead',
                lead_name: contact,
                company_name: company,
                email_id: email,
                phone: phone || '',
                status: 'Lead',
                source: 'Website',
                v5_agent_owner: 'go@v5medical.ai',
                v5_outreach_channel: 'Website Inquiry',
                v5_target_products: category,
                v5_response_status: '🆕 New',
                v5_source_detail: 'quote.12888.de landing page',
                v5_campaign_name: 'Cold Email CTA 2026-Q3',
                notes: `Product: ${category}\nDetails: ${description || 'N/A'}`,
            };

            const createResp = await fetch(`${ERP_URL}/api/resource/Lead`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `sid=${sid}`,
                },
                body: JSON.stringify(leadData),
            });

            if (!createResp.ok) {
                const errText = await createResp.text();
                console.error('Lead creation failed:', errText);
                return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const result = await createResp.json();
            const leadName = result.data?.name || 'unknown';

            return new Response(JSON.stringify({
                success: true,
                lead_id: leadName,
                message: 'Inquiry submitted successfully',
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } catch (err) {
            console.error('Worker error:', err);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    },
};
