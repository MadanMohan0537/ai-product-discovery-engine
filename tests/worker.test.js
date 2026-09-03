import test from "node:test";
import assert from "node:assert/strict";
import { route } from "../backend/src/worker.js";

const env={API_TOKEN:"secret",ALLOWED_ORIGINS:"https://app.example",ASSETS:{fetch:()=>new Response("asset")}};
test("health is public",async()=>assert.equal((await route(new Request("https://x/api/health"),env)).status,200));
test("discovery requires authentication",async()=>assert.equal((await route(new Request("https://x/api/discover",{method:"POST",body:"{}"}),env)).status,401));
test("discovery rejects disallowed origins",async()=>{const request=new Request("https://x/api/discover",{method:"POST",headers:{Origin:"https://evil.example",Authorization:"Bearer secret","Content-Type":"application/json"},body:JSON.stringify({records:[{text:"valid"}]})});assert.equal((await route(request,env)).status,403);});
test("authenticated discovery returns opportunities",async()=>{const request=new Request("https://x/api/discover",{method:"POST",headers:{Authorization:"Bearer secret","Content-Type":"application/json"},body:JSON.stringify({records:[{text:"Please add SSO",source:"sales"}]})});const response=await route(request,env);const body=await response.json();assert.equal(response.status,201);assert.equal(body.opportunityCount,1);});
test("invalid JSON returns 400",async()=>{const request=new Request("https://x/api/discover",{method:"POST",headers:{Authorization:"Bearer secret"},body:"{"});assert.equal((await route(request,env)).status,400);});
test("history requires D1",async()=>{const request=new Request("https://x/api/opportunities",{headers:{Authorization:"Bearer secret"}});assert.equal((await route(request,env)).status,503);});
