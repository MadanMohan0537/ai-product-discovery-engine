import test from "node:test";
import assert from "node:assert/strict";
import { clusterRecords, cosine, embed, normalizeRecord, runDiscovery, scoreOpportunity, tokenize } from "../pipelines/discovery.js";

test("tokenization removes common stop words", () => assert.deepEqual(tokenize("The slow onboarding flow"), ["slow","onboarding","flow"]));
test("normalized records preserve discovery dimensions", () => { const value=normalizeRecord({text:" Setup is hard ",source:"support",segment:"SMB",customerId:"c1"}); assert.equal(value.segment,"SMB"); assert.equal(value.text,"Setup is hard"); });
test("hashed embeddings are normalized", () => { const vector=embed("onboarding setup"); const norm=Math.sqrt(vector.reduce((sum,value)=>sum+value*value,0)); assert.ok(Math.abs(norm-1)<1e-9); });
test("cosine distinguishes matching and unrelated vectors", () => { assert.ok(cosine(embed("sso login"),embed("sso login"))>.99); assert.ok(cosine(embed("sso"),embed("export"))<.2); });
test("similar records form a cluster", () => { const records=[normalizeRecord({text:"sso login support"}),normalizeRecord({text:"add sso login"})]; assert.equal(clusterRecords(records,.2).length,1); });
test("scoring returns transparent bounded components", () => { const record=normalizeRecord({text:"slow setup",source:"support",segment:"SMB",customerId:"c1"}); const result=scoreOpportunity([record],1,new Date(record.timestamp)); assert.ok(result.score>=0&&result.score<=100); assert.ok(result.components.frequency); });
test("discovery returns ranked evidence-backed opportunities", () => { const result=runDiscovery([{id:"1",text:"setup is confusing",source:"support",segment:"SMB"},{id:"2",text:"need guided setup",source:"interview",segment:"SMB"}],{similarityThreshold:.1}); assert.equal(result.recordCount,2); assert.ok(result.opportunities[0].evidenceCount); assert.ok(result.opportunities[0].recommendedExperiment); });
test("discovery rejects empty and oversized corpora", () => { assert.throws(()=>runDiscovery([]),/At least one/); assert.throws(()=>runDiscovery(Array(1001).fill({text:"valid"})),/Maximum batch/); });
test("record validation rejects invalid timestamps", () => assert.throws(()=>normalizeRecord({text:"valid",timestamp:"bad"}),/invalid timestamp/));
