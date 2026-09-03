import test from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../evaluation/evaluate.js";

test("evaluation measures evidence traceability and coverage",()=>{const report=evaluate([{id:"1",text:"Need SSO",source:"sales",segment:"Enterprise"}]);assert.equal(report.evidenceTraceability,1);assert.equal(report.evidenceCoverage,1);});
