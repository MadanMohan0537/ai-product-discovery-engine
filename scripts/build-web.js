import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
copyFileSync(resolve(root, "pipelines/discovery.js"), resolve(root, "apps/web/discovery.js"));
console.log("Copied the shared discovery pipeline into the web asset bundle.");
