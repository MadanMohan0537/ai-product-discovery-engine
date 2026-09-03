import test from "node:test";
import assert from "node:assert/strict";
import { createOpportunityBrief } from "../agents/opportunity-agent.js";

test("briefs stay grounded in evidence IDs",()=>{const brief=createOpportunityBrief({title:"Improve setup",problem:"Users are stuck",affectedSegments:["SMB"],evidenceCount:1,sourceCounts:{support:1},score:70,confidence:.8,recommendedExperiment:"Test checklist",evidence:[{id:"1"}]});assert.deepEqual(brief.evidenceIds,["1"]);assert.equal(brief.potentialImpact,"high");});
