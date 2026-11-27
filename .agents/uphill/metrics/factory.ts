import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { syncMythicalHistory } from "../../../scripts/factory/mythical-history.mjs";
import { auditTrustBoundary } from "../../../scripts/factory/trust-boundary.mjs";
import { verifyCloudFactory, verifyHomeSchema } from "../../../scripts/factory/verify-cloud-workflows.mjs";
import { verifyWiki } from "../../../scripts/factory/verify-wiki.mjs";

const out = process.env.UPHILL_METRICS;
if (!out) {
  console.error("UPHILL_METRICS is not set");
  process.exit(1);
}

const root = process.cwd();
const outLines: string[] = [];

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// 1. Trust boundary & shared Smithers Cloud object store cache-poisoning audit
try {
  const trust = await auditTrustBoundary(root);
  if (trust.ok) {
    outLines.push(`trust-boundary "shared-cache-and-workflows" pass`);
  } else {
    outLines.push(`trust-boundary "shared-cache-and-workflows" fail note ${quote(trust.findings[0] ?? "trust boundary violation")}`);
  }
} catch (error) {
  outLines.push(`trust-boundary "shared-cache-and-workflows" fail note ${quote(String(error))}`);
}

// 2. QuickJS Realm cloud workflows & triggers audit
try {
  const cloud = await verifyCloudFactory(root);
  for (const wf of cloud.workflows) {
    outLines.push(`cloud-workflows ${quote(wf.name)} pass`);
  }
} catch (error) {
  outLines.push(`cloud-workflows "realm-check" fail note ${quote(error instanceof Error ? error.message : String(error))}`);
}

// 3. Personalized .smithers/home.json schema & audience audit
try {
  const homePath = join(root, ".smithers/home.json");
  const home = JSON.parse(readFileSync(homePath, "utf8")) as { sections?: Array<{ audience?: string }> };
  verifyHomeSchema(home);
  const audiences = new Set((home.sections ?? []).map((s) => s.audience ?? "everyone"));
  for (const required of ["maintainer", "contributor", "everyone"]) {
    if (audiences.has(required)) {
      outLines.push(`home-personalization ${quote(required)} pass`);
    } else {
      outLines.push(`home-personalization ${quote(required)} fail note ${quote(`missing ${required} audience section`)}`);
    }
  }
} catch (error) {
  outLines.push(`home-personalization "schema" fail note ${quote(error instanceof Error ? error.message : String(error))}`);
}

// 4. Obsidian engineering wiki & mythical history audit
try {
  await verifyWiki(root);
  outLines.push(`wiki-and-history "obsidian-wiki" pass`);
} catch (error) {
  outLines.push(`wiki-and-history "obsidian-wiki" fail note ${quote(error instanceof Error ? error.message : String(error))}`);
}

try {
  await syncMythicalHistory({ root, write: false });
  outLines.push(`wiki-and-history "mythical-history" pass`);
} catch (error) {
  outLines.push(`wiki-and-history "mythical-history" fail note ${quote(error instanceof Error ? error.message : String(error))}`);
}

// 5. Sandboxed EVM playground CSP SHA-256 hash integrity
try {
  const htmlPath = join(root, ".smithers/playground/index.html");
  if (!existsSync(htmlPath)) {
    outLines.push(`playground-csp "index.html" fail note "missing .smithers/playground/index.html"`);
  } else {
    const html = readFileSync(htmlPath, "utf8");
    const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
    const styleHash = createHash("sha256").update(style).digest("base64");
    const scriptHash = createHash("sha256").update(script).digest("base64");
    const ok = html.includes(`style-src 'sha256-${styleHash}'`) && html.includes(`script-src 'sha256-${scriptHash}'`);
    outLines.push(ok ? `playground-csp "index.html" pass` : `playground-csp "index.html" fail note "CSP SHA-256 hash drifted"`);
  }
} catch (error) {
  outLines.push(`playground-csp "index.html" fail note ${quote(String(error))}`);
}

appendFileSync(out, `${outLines.join("\n")}\n`);
