import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

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

// Replace block and line comments with spaces while preserving line numbers.
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let inStr: string | null = null;
  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];
    if (inStr) {
      out += ch;
      if (ch === "\\" && next !== undefined) {
        out += next;
        i += 2;
        continue;
      }
      if (ch === inStr) inStr = null;
      i++;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") {
        out += " ";
        i++;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      out += "  ";
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        out += source[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < source.length) {
        out += "  ";
        i += 2;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inStr = ch;
    out += ch;
    i++;
  }
  return out;
}

function findFirstLine(content: string, regex: RegExp): { line: number; match: string } | null {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]!.match(regex);
    if (m) return { line: i + 1, match: m[0] };
  }
  return null;
}

function checkLongFunctions(codeNoComments: string): { name: string; line: number; length: number } | null {
  // Custom brace-depth measurement for JS/TS functions (TigerStyle 70-line limit).
  const fnRe = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/g;
  let worst: { name: string; line: number; length: number } | null = null;
  let m: RegExpExecArray | null;
  while ((m = fnRe.exec(codeNoComments)) !== null) {
    const startIdx = m.index;
    const startLine = codeNoComments.slice(0, startIdx).split("\n").length;
    const braceIdx = codeNoComments.indexOf("{", startIdx);
    if (braceIdx === -1) continue;
    let depth = 0;
    let i = braceIdx;
    let inStr: string | null = null;
    for (; i < codeNoComments.length; i++) {
      const ch = codeNoComments[i]!;
      const prev = i > 0 ? codeNoComments[i - 1] : "";
      if (inStr) {
        if (ch === inStr && prev !== "\\") inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inStr = ch;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const len = codeNoComments.slice(startIdx, i + 1).split("\n").length;
    if (len > 70 && (!worst || len > worst.length)) {
      worst = { name: m[1]!, line: startLine, length: len };
    }
  }
  return worst;
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
  const srcFiles = walk(join(root, pkgDir, "src")).filter(
    (f) => /\.(ts|tsx|js|mjs)$/.test(f) && !/\.(spec|test)\./.test(f) && !f.endsWith(".d.ts"),
  );

  for (const file of srcFiles) {
    const rel = relative(root, file);
    const raw = readFileSync(file, "utf8");
    const code = stripComments(raw);

    // 1. Explicit `any` in executable/type code
    const anyHit = findFirstLine(code, /\bas\s+any\b|:\s*any\b/);
    if (anyHit) {
      outLines.push(`explicit-any ${quote(rel)} fail note ${quote(`line ${anyHit.line}: ${anyHit.match}`)}`);
    } else {
      outLines.push(`explicit-any ${quote(rel)} pass`);
    }

    // 2. TypeScript suppression directives
    const suppressHit = findFirstLine(raw, /@ts-(?:ignore|expect-error|nocheck)\b/);
    if (suppressHit) {
      outLines.push(
        `ts-suppressions ${quote(rel)} fail note ${quote(`line ${suppressHit.line}: ${suppressHit.match}`)}`,
      );
    } else {
      outLines.push(`ts-suppressions ${quote(rel)} pass`);
    }

    // 3. Stray console.log/debug in library packages under packages/
    if (rel.startsWith("packages/")) {
      const consoleHit = findFirstLine(code, /\bconsole\.(?:log|debug)\s*\(/);
      if (consoleHit) {
        outLines.push(
          `console-calls ${quote(rel)} fail note ${quote(`line ${consoleHit.line}: ${consoleHit.match}`)}`,
        );
      } else {
        outLines.push(`console-calls ${quote(rel)} pass`);
      }
    }

    // 4. Unresolved TODO/FIXME/HACK/XXX
    const todoHit = findFirstLine(raw, /\b(?:TODO|FIXME|HACK|XXX)\b/);
    if (todoHit) {
      outLines.push(`todo-fixme ${quote(rel)} fail note ${quote(`line ${todoHit.line}: ${todoHit.match}`)}`);
    } else {
      outLines.push(`todo-fixme ${quote(rel)} pass`);
    }

    // 5. TigerStyle function length <= 70 lines
    const longFn = checkLongFunctions(code);
    if (longFn) {
      outLines.push(
        `function-length ${quote(rel)} fail note ${quote(`line ${longFn.line}: function ${longFn.name} is ${longFn.length} lines (> 70)`)}`,
      );
    } else {
      outLines.push(`function-length ${quote(rel)} pass`);
    }

    // 6. JSDoc coverage on runtime exported modules in packages/*/src/
    if (rel.startsWith("packages/") && !basename(rel).startsWith("index.") && /\.(js|mjs)$/.test(rel)) {
      const hasExport = /\bexport\s+(?:const|function|class|async\s+function)\b/.test(code);
      if (hasExport) {
        if (/\/\*\*[\s\S]*?\*\//.test(raw)) {
          outLines.push(`jsdoc-exports ${quote(rel)} pass`);
        } else {
          outLines.push(`jsdoc-exports ${quote(rel)} fail note "exported runtime module missing JSDoc block"`);
        }
      }
    }
  }
}

appendFileSync(out, `${outLines.join("\n")}\n`);
