/**
 * Import products from data/products-export.json into THIS project's Supabase
 * (reads merge/.env.local).
 *
 * Usage (after you create a Supabase project and fill .env.local):
 *   node scripts/import-products-export.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");
const IN_FILE = resolve(ROOT, "data", "products-export.json");

function loadEnv(path) {
  const raw = readFileSync(path, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv(ENV_PATH);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.\n" +
      "Create a new Supabase project (e.g. named merge), then paste those keys."
  );
  process.exit(1);
}

const products = JSON.parse(readFileSync(IN_FILE, "utf8"));
if (!Array.isArray(products) || !products.length) {
  console.error("No products found in data/products-export.json");
  process.exit(1);
}

const supabase = createClient(url, key);
const chunkSize = 100;
let inserted = 0;

for (let i = 0; i < products.length; i += chunkSize) {
  const chunk = products.slice(i, i + chunkSize);
  const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
  if (error) {
    console.error(`Import failed at chunk ${i}:`, error.message);
    process.exit(1);
  }
  inserted += chunk.length;
  console.log(`Upserted ${inserted}/${products.length}`);
}

console.log(`Done — ${inserted} products in your merge Supabase project.`);
