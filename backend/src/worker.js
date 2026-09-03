import { runDiscovery } from "../../pipelines/discovery.js";

function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  return !origin || (env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean).includes(origin);
}

function responseHeaders(request, env) {
  const origin = request.headers.get("Origin");
  return { ...(origin && originAllowed(request, env) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}), "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
}

function json(request, env, body, status = 200) {
  return Response.json(body, { status, headers: responseHeaders(request, env) });
}

async function authorized(request, env) {
  if (!env.API_TOKEN) return false;
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([token, env.API_TOKEN].map(value => crypto.subtle.digest("SHA-256", encoder.encode(value))));
  return [...new Uint8Array(left)].every((value, index) => value === new Uint8Array(right)[index]);
}

async function persist(result, env) {
  if (!env.DB) return result;
  const runId = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO discovery_runs (id, record_count, opportunity_count, model) VALUES (?, ?, ?, ?)").bind(runId, result.recordCount, result.opportunityCount, result.model).run();
  const statements = result.opportunities.map(opportunity => env.DB.prepare(`INSERT INTO opportunities
    (id, run_id, title, problem, score, confidence, evidence_count, affected_segments, keywords, experiment, evidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(`${runId}:${opportunity.id}`, runId, opportunity.title, opportunity.problem, opportunity.score, opportunity.confidence, opportunity.evidenceCount, JSON.stringify(opportunity.affectedSegments), JSON.stringify(opportunity.keywords), opportunity.recommendedExperiment, JSON.stringify(opportunity.evidence)));
  for (let index = 0; index < statements.length; index += 50) await env.DB.batch(statements.slice(index, index + 50));
  return { runId, ...result };
}

async function handleDiscover(request, env) {
  let body;
  try { body = await request.json(); } catch { return json(request, env, { error: "Request must contain valid JSON" }, 400); }
  try { return json(request, env, await persist(runDiscovery(Array.isArray(body) ? body : body.records, body.options || {}), env), 201); }
  catch (error) { return json(request, env, { error: error.message }, error instanceof RangeError ? 413 : 422); }
}

async function handleOpportunities(request, env, url) {
  if (!env.DB) return json(request, env, { error: "Opportunity history requires D1" }, 503);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 25));
  const result = await env.DB.prepare("SELECT id, run_id, title, problem, score, confidence, evidence_count, affected_segments, keywords, experiment, created_at FROM opportunities ORDER BY score DESC, created_at DESC LIMIT ?").bind(limit).all();
  return json(request, env, { opportunities: result.results.map(row => ({ ...row, affected_segments: JSON.parse(row.affected_segments), keywords: JSON.parse(row.keywords) })) });
}

export async function route(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return originAllowed(request, env) ? new Response(null, { headers: responseHeaders(request, env) }) : json(request, env, { error: "Origin not allowed" }, 403);
  if (url.pathname === "/api/health") return json(request, env, { status: "ok", service: "ai-product-discovery-engine", persistence: Boolean(env.DB), mode: "deterministic-baseline" });
  if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
  if (!originAllowed(request, env)) return json(request, env, { error: "Origin not allowed" }, 403);
  if (!await authorized(request, env)) return json(request, env, { error: "Unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });
  if (url.pathname === "/api/discover" && request.method === "POST") return handleDiscover(request, env);
  if (url.pathname === "/api/opportunities" && request.method === "GET") return handleOpportunities(request, env, url);
  return json(request, env, { error: "Not found" }, 404);
}

export default { fetch: (request, env) => route(request, env).catch(() => json(request, env, { error: "Discovery failed", requestId: crypto.randomUUID() }, 500)) };
