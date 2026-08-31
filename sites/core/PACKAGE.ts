/// <reference path="../../smithers.d.ts" />
import { Smithers as S } from "@smthrs/targets"

const packageJson = S.file("package.json")
const vocsConfig = S.file("vocs.config.ts")

const srcs = S.Filegroup({
  srcs: S.glob(["pages/**", "scripts/**", "styles.css"]),
})

const build = S.Shell.Build({
  bin: S.NodeModule.Bin("vocs"),
  args: ["build"],
  data: [srcs, vocsConfig, packageJson],
  outDirs: ["dist"],
})

const dev = S.Shell.Serve({
  bin: S.NodeModule.Bin("vocs"),
  args: ["dev"],
  data: [srcs, vocsConfig],
  readiness: { port: 5173 },
})

// Docs snippets are verified against the real API before the site builds,
// the docs-site cousin of whatsabi's checkReadme. verify-samples.mjs
// extracts the fenced samples from pages/ and compiles them.
const verifySamples = S.Shell.Test({
  bin: S.Runtime.bin,
  args: ["scripts/verify-samples.mjs"],
  data: [srcs],
})

// The site ships through Vercel, not GitHub Pages, so deployment is its
// own rule with the platform's token. Deploys are outward actions.
const deploy = S.Vercel.Deploy({
  site: build,
  gates: [verifySamples],
  secrets: [S.Secret("VERCEL_TOKEN")],
  sandbox: { network: true },
  approval: "required",
})

export const Package = S.Package({
  targets: { build, deploy, dev, srcs, verifySamples },
})
