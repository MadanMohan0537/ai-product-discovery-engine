export function mapJsonRecords(payload) {
  const records = Array.isArray(payload) ? payload : payload.records || payload.items || payload.data;
  if (!Array.isArray(records)) throw new Error("JSON must contain an array or a records/items/data array");
  return records.map((record, index) => ({
    id: record.id || `json-${index + 1}`,
    text: record.text || record.feedback || record.comment || record.review || record.notes,
    source: record.source || "json",
    segment: record.segment || "unknown",
    customerId: record.customerId || record.customer_id || null,
    timestamp: record.timestamp || record.createdAt || record.created_at || new Date().toISOString(),
    metadata: record.metadata || {}
  }));
}
