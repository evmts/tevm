import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

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

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "types", ".git", ".jj", "coverage", ".nx", "out"].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result.sort();
}

function discoverPackages(): string[] {
  const dirs: string[] = [];
  for (const parent of ["packages", "extensions"]) {
    const base = join(root, parent);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = `${parent}/${entry.name}`;
      if (existsSync(join(root, rel, "package.json")) && existsSync(join(root, rel, "src"))) {
        dirs.push(rel);
      }
    }
  }
  if (existsSync(join(root, "cli", "package.json")) && existsSync(join(root, "cli", "src"))) {
    dirs.push("cli");
  }
  return dirs.sort();
}

for (const pkgDir of discoverPackages()) {
  const pkgJson = JSON.parse(readFileSync(join(root, pkgDir, "package.json"), "utf8")) as { name?: string };
  const pkgName = pkgJson.name ?? pkgDir;
  const all = walk(join(root, pkgDir, "src")).filter((f) => /\.(ts|tsx|js|mjs)$/.test(f) && !f.endsWith(".d.ts"));
  const prod = all.filter((f) => !/\.(spec|test)\./.test(f));
  const tests = all.filter((f) => /\.(spec|test)\./.test(f));
  const prodLines = prod.reduce((s, f) => s + readFileSync(f, "utf8").split("\n").length, 0);
  const testLines = tests.reduce((s, f) => s + readFileSync(f, "utf8").split("\n").length, 0);
  const ratio = prodLines > 0 ? Math.round((testLines / prodLines) * 100) : 100;
  outLines.push(`test-ratio ${quote(pkgName)} ${ratio}`);
}

function resolveExportTarget(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry === "object") {
    const rec = entry as Record<string, unknown>;
    for (const key of ["import", "default", "types", "require"]) {
      if (key in rec) {
        const hit = resolveExportTarget(rec[key]);
        if (hit) return hit;
      }
    }
    for (const val of Object.values(rec)) {
      const hit = resolveExportTarget(val);
      if (hit) return hit;
    }
  }
  return null;
}

// Verify tevm facade exports resolve to files or directories in tevm/
const tevmPkgPath = join(root, "tevm", "package.json");
if (existsSync(tevmPkgPath)) {
  const tevmPkg = JSON.parse(readFileSync(tevmPkgPath, "utf8")) as {
    exports?: Record<string, unknown>;
  };
  for (const [subpath, entry] of Object.entries(tevmPkg.exports ?? {})) {
    if (subpath === "./package.json") continue;
    const candidate = resolveExportTarget(entry);
    if (!candidate) continue;
    const targetPath = join(root, "tevm", candidate);
    // Also check corresponding source file if export points to dist/
    const subDir = subpath === "." ? "index.js" : `${subpath.replace(/^\.\//, "")}/index.js`;
    const sourceFallback = join(root, "tevm", subDir);
    if (existsSync(targetPath) || existsSync(sourceFallback)) {
      outLines.push(`tevm-facade-exports ${quote(subpath)} pass`);
    } else {
      outLines.push(`tevm-facade-exports ${quote(subpath)} fail note ${quote(`missing ${candidate}`)}`);
    }
  }
}

// Verify relative Markdown links in top-level contributor docs
for (const docFile of ["README.md", "AGENTS.md", "CONTRIBUTING.md", "CLAUDE.md"]) {
  const full = join(root, docFile);
  if (!existsSync(full)) continue;
  const content = readFileSync(full, "utf8");
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  let broken: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(content)) !== null) {
    const href = m[1]!.split("#")[0]!.trim();
    if (!href || /^(?:https?:|mailto:|#)/.test(href)) continue;
    const resolved = resolve(dirname(full), href);
    if (!existsSync(resolved)) {
      broken = `broken link ${href}`;
      break;
    }
  }
  if (broken) {
    outLines.push(`docs-links ${quote(docFile)} fail note ${quote(broken)}`);
  } else {
    outLines.push(`docs-links ${quote(docFile)} pass`);
  }
}

appendFileSync(out, `${outLines.join("\n")}\n`);
