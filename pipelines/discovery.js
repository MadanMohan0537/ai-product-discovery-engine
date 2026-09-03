const STOPWORDS = new Set(`a an and are as at be been but by can could did do for from had has have how i if in into is it its may me more most my no not of on or our so than that the their them then there these they this those to too us was we were what when where which who will with would you your`.split(" "));
const PAIN = /\b(?:cannot|can't|confusing|crash|difficult|error|fails?|frustrating|hard|missing|problem|slow|stuck|takes too long|unable|unusable)\b/i;
const REQUEST = /\b(?:add|allow|ability|could you|feature|need|please|should|support|want|wish|would like)\b/i;

export function tokenize(text) {
  return String(text || "").toLowerCase().match(/[a-z0-9][a-z0-9'-]{1,}/g)?.filter(token => !STOPWORDS.has(token)) || [];
}

export function normalizeRecord(record, index = 0) {
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new TypeError(`Record ${index + 1} must be an object`);
  const text = String(record.text || "").replace(/\s+/g, " ").trim();
  if (!text) throw new TypeError(`Record ${index + 1} requires text`);
  if (text.length > 20_000) throw new RangeError(`Record ${index + 1} exceeds 20,000 characters`);
  const timestamp = new Date(record.timestamp || Date.now());
  if (Number.isNaN(timestamp.getTime())) throw new TypeError(`Record ${index + 1} has an invalid timestamp`);
  return { id: String(record.id || `feedback-${index + 1}`), text, source: String(record.source || "unknown"), segment: String(record.segment || "unknown"), customerId: record.customerId ? String(record.customerId) : null, timestamp: timestamp.toISOString(), metadata: record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata) ? record.metadata : {} };
}

export function embed(text, dimensions = 128) {
  const vector = Array(dimensions).fill(0);
  for (const token of tokenize(text)) {
    let hash = 2166136261;
    for (const character of token) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    vector[Math.abs(hash) % dimensions] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map(value => value / norm);
}

export function cosine(left, right) {
  return left.reduce((sum, value, index) => sum + value * (right[index] || 0), 0);
}

function mergeCentroid(cluster, vector) {
  const count = cluster.records.length;
  cluster.centroid = cluster.centroid.map((value, index) => (value * (count - 1) + vector[index]) / count);
}

export function clusterRecords(records, threshold = 0.28) {
  const clusters = [];
  for (const record of records) {
    const vector = embed(record.text);
    let bestIndex = -1, bestScore = -1;
    clusters.forEach((cluster, index) => { const score = cosine(vector, cluster.centroid); if (score > bestScore) { bestIndex = index; bestScore = score; } });
    if (bestIndex < 0 || bestScore < threshold) clusters.push({ records: [record], centroid: vector });
    else { clusters[bestIndex].records.push(record); mergeCentroid(clusters[bestIndex], vector); }
  }
  return clusters;
}

function topTerms(records, limit = 5) {
  const counts = new Map();
  records.forEach(record => new Set(tokenize(record.text)).forEach(token => counts.set(token, (counts.get(token) || 0) + 1)));
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([term]) => term);
}

function recency(records, now) {
  const averageAge = records.reduce((sum, record) => sum + Math.max(0, now - new Date(record.timestamp)) / 86_400_000, 0) / records.length;
  return Math.pow(0.5, averageAge / 45);
}

export function scoreOpportunity(records, corpusSize, now = new Date()) {
  const sources = new Set(records.map(record => record.source)).size;
  const customers = new Set(records.map(record => record.customerId).filter(Boolean)).size;
  const segments = new Set(records.map(record => record.segment)).size;
  const frequency = Math.min(1, records.length / Math.max(3, corpusSize * 0.2));
  const breadth = Math.min(1, sources / 3);
  const customerBreadth = Math.min(1, (customers || records.length) / 5);
  const segmentBreadth = Math.min(1, segments / 3);
  const freshness = recency(records, now);
  const score = 100 * (0.32 * frequency + 0.2 * breadth + 0.18 * customerBreadth + 0.15 * segmentBreadth + 0.15 * freshness);
  return { score: Math.round(score), components: { frequency: Number(frequency.toFixed(3)), sourceBreadth: Number(breadth.toFixed(3)), customerBreadth: Number(customerBreadth.toFixed(3)), segmentBreadth: Number(segmentBreadth.toFixed(3)), recency: Number(freshness.toFixed(3)) } };
}

export function runDiscovery(input, options = {}) {
  if (!Array.isArray(input) || !input.length) throw new TypeError("At least one feedback record is required");
  if (input.length > 1_000) throw new RangeError("Maximum batch size is 1,000 records");
  const records = input.map(normalizeRecord);
  const clusters = clusterRecords(records, Number(options.similarityThreshold ?? 0.28));
  const now = new Date(Math.max(...records.map(record => new Date(record.timestamp).getTime())));
  const opportunities = clusters.map((cluster, index) => {
    const terms = topTerms(cluster.records);
    const painCount = cluster.records.filter(record => PAIN.test(record.text)).length;
    const requestCount = cluster.records.filter(record => REQUEST.test(record.text)).length;
    const scored = scoreOpportunity(cluster.records, records.length, now);
    const segments = [...new Set(cluster.records.map(record => record.segment))];
    return {
      id: `opportunity-${index + 1}`,
      title: terms.length ? `Improve ${terms.slice(0, 3).join(" / ")}` : "Review uncategorized feedback",
      problem: `${painCount} pain signal${painCount === 1 ? "" : "s"} and ${requestCount} request signal${requestCount === 1 ? "" : "s"} across ${cluster.records.length} record${cluster.records.length === 1 ? "" : "s"}.`,
      score: scored.score,
      scoreComponents: scored.components,
      confidence: Number(Math.min(0.95, 0.42 + cluster.records.length * 0.08 + new Set(cluster.records.map(record => record.source)).size * 0.05).toFixed(3)),
      evidenceCount: cluster.records.length,
      sourceCounts: Object.fromEntries([...new Set(cluster.records.map(record => record.source))].map(source => [source, cluster.records.filter(record => record.source === source).length])),
      affectedSegments: segments,
      keywords: terms,
      recommendedExperiment: requestCount ? `Prototype a focused ${terms[0] || "workflow"} improvement and test task completion.` : `Interview affected ${segments[0] || "users"} to validate the problem and desired outcome.`,
      evidence: cluster.records.map(record => ({ id: record.id, text: record.text, source: record.source, segment: record.segment, timestamp: record.timestamp }))
    };
  }).sort((a, b) => b.score - a.score);
  return { schemaVersion: "1.0.0", model: "local-hashed-semantic-baseline-v1", generatedAt: new Date().toISOString(), recordCount: records.length, opportunityCount: opportunities.length, opportunities };
}
