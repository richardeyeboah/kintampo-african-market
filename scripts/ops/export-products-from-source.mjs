/**
 * Export all products from Chuck and Rich Supabase into data/products-export.json
 * Usage: node scripts/export-products-from-source.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE_ENV = resolve(ROOT, "..", "chuck-and-rich", ".env.local");
const OUT_DIR = resolve(ROOT, "data");
const OUT_FILE = resolve(OUT_DIR, "products-export.json");

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

const env = loadEnv(SOURCE_ENV);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or key in chuck-and-rich/.env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const pageSize = 1000;
let from = 0;
let all = [];

while (true) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("Export failed:", error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  all = all.concat(data);
  if (data.length < pageSize) break;
  from += pageSize;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(all, null, 2));
console.log(`Exported ${all.length} products → data/products-export.json`);
