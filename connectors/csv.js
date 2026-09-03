export function parseCsv(input) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"' && quoted && input[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += character;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  if (rows.length < 2) return [];
  const headers = rows.shift().map(header => header.toLowerCase());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

export function mapCsvRecord(record, index = 0) {
  return {
    id: record.id || `csv-${index + 1}`,
    text: record.text || record.feedback || record.comment || record.review || record.notes,
    source: record.source || "csv",
    segment: record.segment || "unknown",
    customerId: record.customer_id || record.customerid || null,
    timestamp: record.timestamp || record.created_at || record.createdat || new Date().toISOString(),
    metadata: {}
  };
}
