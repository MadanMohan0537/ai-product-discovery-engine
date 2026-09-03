import fs from "node:fs";
import { runDiscovery } from "../pipelines/discovery.js";

export function evaluate(rows) {
  const result = runDiscovery(rows, { similarityThreshold: 0.15 });
  const supported = result.opportunities.filter(item => item.evidenceCount > 0).length;
  const traceability = supported / (result.opportunityCount || 1);
  const coverage = new Set(result.opportunities.flatMap(item => item.evidence.map(evidence => evidence.id))).size / rows.length;
  return { datasetSize: rows.length, opportunityCount: result.opportunityCount, evidenceTraceability: Number(traceability.toFixed(3)), evidenceCoverage: Number(coverage.toFixed(3)), warning: "Seed metrics validate plumbing, not production insight precision." };
}

if (process.argv[1] === new URL(import.meta.url).pathname) console.log(JSON.stringify(evaluate(JSON.parse(fs.readFileSync("evaluation/seed.json", "utf8"))), null, 2));
