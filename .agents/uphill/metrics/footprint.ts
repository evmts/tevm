import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const out = process.env.UPHILL_METRICS;
if (!out) {
  console.error("UPHILL_METRICS is not set");
  process.exit(1);
}

const root = process.cwd();
const lines: string[] = [];

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
  const pkgJson = JSON.parse(readFileSync(join(root, pkgDir, "package.json"), "utf8")) as {
    name?: string;
    dependencies?: Record<string, string>;
  };
  const pkgName = pkgJson.name ?? pkgDir;
  const srcFiles = walk(join(root, pkgDir, "src")).filter(
    (f) => /\.(ts|tsx|js|mjs)$/.test(f) && !/\.(spec|test)\./.test(f) && !f.endsWith(".d.ts"),
  );

  if (srcFiles.length > 0) {
    const combined = Buffer.concat(srcFiles.map((f) => readFileSync(f)));
    const gz = gzipSync(combined, { level: 9 }).length;
    lines.push(`package-source-bytes ${quote(pkgName)} ${gz}B`);
  }

  for (const file of srcFiles) {
    const rel = relative(root, file);
    const lineCount = readFileSync(file, "utf8").split("\n").length;
    lines.push(`module-lines ${quote(rel)} ${lineCount}`);
  }

  const depCount = Object.keys(pkgJson.dependencies ?? {}).length;
  lines.push(`runtime-deps ${quote(pkgName)} ${depCount}`);
}

appendFileSync(out, `${lines.join("\n")}\n`);
