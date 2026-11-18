/**
 * Cloudflare Worker example — collects survey submissions into Workers KV.
 * ---------------------------------------------------------------------------
 * 1. Install wrangler and log in:
 *      npm install -g wrangler
 *      wrangler login
 *
 * 2. Create a KV namespace:
 *      wrangler kv namespace create SURVEY_KV
 *    Copy the returned id into wrangler.toml:
 *
 *      name = "survey-collect"
 *      main = "worker.js"
 *      compatibility_date = "2025-01-01"
 *
 *      [[kv_namespaces]]
 *      binding = "SURVEY_KV"
 *      id = "<paste-the-id-here>"
 *
 * 3. Deploy:
 *      wrangler deploy
 *
 * 4. Put the printed URL (https://survey-collect.<you>.workers.dev) into the
 *    project's `.env` as VITE_SURVEY_ENDPOINT and restart `npm run dev`.
 *
 * 5. Read the data back:
 *      wrangler kv key list --binding SURVEY_KV --prefix "sub:"
 *      wrangler kv key get --binding SURVEY_KV --text "sub:<submissionId>"
 *
 * Optional: add CORS_ORIGIN below and set it to your deployed site origin
 * instead of "*" once you go live.
 * ---------------------------------------------------------------------------
 */

const CORS_ORIGIN = '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return json({ error: 'Use POST' }, 405)
    }

    let payload
    try {
      payload = await request.json()
    } catch {
      return json({ error: 'Body must be JSON' }, 400)
    }

    // Minimal validation — never trust the client.
    if (!payload || typeof payload.surveyId !== 'string' || !Array.isArray(payload.answers)) {
      return json({ error: 'Invalid payload shape' }, 422)
    }

    const id = typeof payload.submissionId === 'string' ? payload.submissionId : crypto.randomUUID()
    const receivedAt = new Date().toISOString()

    await env.SURVEY_KV.put(
      `sub:${id}`,
      JSON.stringify({ receivedAt, ip: request.headers.get('CF-Connecting-IP'), payload }),
    )

    // Optional: forward a copy to a webhook (Slack, Feishu, Google Sheets…).
    // await fetch('https://example.com/webhook', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: `New response ${id}` }),
    // })

    return json({ success: true, submissionId: id, receivedAt }, 200)
  },
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
