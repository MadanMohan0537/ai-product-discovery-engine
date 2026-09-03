import test from "node:test";
import assert from "node:assert/strict";
import { mapCsvRecord, parseCsv } from "../connectors/csv.js";
import { mapJsonRecords } from "../connectors/json.js";

test("CSV parser supports quoted multiline fields",()=>{const rows=parseCsv('text,source\n"Slow, and\nconfusing",review');assert.equal(rows[0].text,"Slow, and\nconfusing");});
test("CSV parser rejects unclosed quotes",()=>assert.throws(()=>parseCsv('text\n"broken'),/unclosed/));
test("CSV mapper accepts common feedback columns",()=>assert.equal(mapCsvRecord({review:"Great app"}).text,"Great app"));
test("JSON mapper accepts nested record arrays",()=>assert.equal(mapJsonRecords({records:[{comment:"Need export"}]})[0].text,"Need export"));
test("JSON mapper rejects unknown shapes",()=>assert.throws(()=>mapJsonRecords({value:1}),/array/));
