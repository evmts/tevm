// smithers-source: authored
// smithers-display-name: Viem Tevm Test PR
/** @jsxImportSource smithers-orchestrator */
import {
	ClaudeCodeAgent as SmithersClaudeCodeAgent,
	CodexAgent as SmithersCodexAgent,
	OpenCodeAgent,
	createSmithers,
} from "smithers-orchestrator";
import { z } from "zod/v4";

const TEVM_REPO = "/Users/williamcory/tevm-monorepo";
const VIEM_REPO = "/Users/williamcory/evmts-viem";
const WT = {
	kimi: "/Users/williamcory/evmts-viem-wt-kimi",
	"codex-sol": "/Users/williamcory/evmts-viem-wt-codex-sol",
	opus: "/Users/williamcory/evmts-viem-wt-opus",
} as const;

const researchAgent = new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd: TEVM_REPO, skipGitRepoCheck: true });
const laneAgents = {
	kimi: new OpenCodeAgent({ model: "kimi-for-coding/k3", cwd: WT.kimi }),
	"codex-sol": new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd: WT["codex-sol"], skipGitRepoCheck: true }),
	opus: new SmithersClaudeCodeAgent({ model: "opus", cwd: WT.opus }),
} as const;
const judgeAgent = new SmithersCodexAgent({ model: "gpt-5.6-sol", cwd: VIEM_REPO, skipGitRepoCheck: true });
const finalizeAgent = new SmithersClaudeCodeAgent({ model: "opus", cwd: VIEM_REPO });

const researchSchema = z.looseObject({
	summary: z.string(),
	tevmTestFeatures: z.array(z.object({ name: z.string(), description: z.string() })).default([]),
	opportunities: z
		.array(z.object({ id: z.string(), title: z.string(), description: z.string(), targetFiles: z.array(z.string()).default([]) }))
		.default([]),
	brief: z.string(),
});

const laneSchema = z.looseObject({
	branch: z.string(),
	summary: z.string(),
	featuresShown: z.array(z.string()).default([]),
	testResults: z.string().default(""),
	notes: z.string().default(""),
});

const judgeSchema = z.looseObject({
	winner: z.enum(["kimi", "codex-sol", "opus"]),
	rationale: z.string(),
	graft: z.string().default(""),
});

const finalizeSchema = z.looseObject({
	prUrl: z.string(),
	branch: z.string(),
	summary: z.string(),
});

const inputSchema = z.object({
	goal: z
		.string()
		.default(
			"Make the evmts/viem fork show off the full tevm test library by replacing anvil-based test infrastructure with tevm, in a high quality PR.",
		),
});

const { Workflow, Task, Sequence, Parallel, smithers } = createSmithers({
	input: inputSchema,
	research: researchSchema,
	lane: laneSchema,
	judge: judgeSchema,
	finalize: finalizeSchema,
});

const LANES = ["kimi", "codex-sol", "opus"] as const;

export default smithers((ctx) => {
	const research = ctx.outputMaybe("research", { nodeId: "research" });

	const lanePrompt = (lane: (typeof LANES)[number]) =>
		[
			ctx.input.goal,
			`You are working in the git worktree ${WT[lane]} on branch tevm-test/${lane} of the evmts/viem fork (a fork of wevm/viem). Two other agents are attempting the same task on sibling branches; the best result wins, so aim for the highest-quality, most complete implementation.`,
			research
				? `RESEARCH BRIEF (produced by a prior agent that studied the tevm test library and viem's test infra):\n${research.brief}\n\nTEVM TEST FEATURES TO SHOW OFF:\n${research.tevmTestFeatures.map((f) => `- ${f.name}: ${f.description}`).join("\n")}\n\nOPPORTUNITIES:\n${research.opportunities.map((o) => `- [${o.id}] ${o.title}: ${o.description}${o.targetFiles.length ? ` (files: ${o.targetFiles.join(", ")})` : ""}`).join("\n")}`
				: "",
			`GROUND RULES:
- The tevm monorepo lives at ${TEVM_REPO} for reference (read-only). Use published tevm npm packages in viem, not file: links.
- Run "pnpm install" in your worktree first if node_modules is missing.
- Replace prool/anvil usage with tevm's in-memory node (MemoryClient / createTevmNode / tevm's anvil-compatible server) wherever it demonstrates tevm test features well. Showcase matchers from @tevm/test-matchers / tevm vitest matchers if applicable.
- Keep the test suite you touch green: run the relevant vitest suites and report real results. Do not claim passing tests without running them.
- Commit your work to branch tevm-test/${lane} with clear conventional-commit messages. Do NOT push and do NOT open a PR; a judge compares branches afterwards.
- Report honestly: branch name, what you changed, which tevm test features are demonstrated, actual test output summary, and known gaps.`,
		]
			.filter(Boolean)
			.join("\n\n---\n\n");

	const laneReports = LANES.map((lane) => {
		const out = ctx.outputMaybe("lane", { nodeId: `lane-${lane}` });
		return out
			? `LANE ${lane} (branch ${out.branch}):\n${out.summary}\nFeatures shown: ${out.featuresShown.join(", ")}\nTests: ${out.testResults}\nNotes: ${out.notes}`
			: `LANE ${lane}: no report`;
	}).join("\n\n");

	const judge = ctx.outputMaybe("judge", { nodeId: "judge" });

	return (
		<Workflow name="viem-tevm-pr">
			<Sequence>
				<Task id="research" output={researchSchema} agent={researchAgent}>
					{`${ctx.input.goal}

You are the RESEARCH agent. Do not modify any files. Produce a structured brief for three implementation agents.

1. Understand the tevm test library completely. Study, in ${TEVM_REPO}:
   - test/test-utils, test/test-matchers, test/vitest-matchers (source + READMEs)
   - the published surface of the "tevm" package relevant to testing: MemoryClient, createTevmNode, forking (fork transport / rpc caching), tevm/actions test-oriented actions (anvil_* methods, tevm_* methods, mining modes, snapshots/revert, setAccount/impersonation), the anvil-compatible HTTP server (@tevm/server), and the bundler story (importing .sol directly in tests) if it can shine here.
   - What exists on npm today (check package versions) so the brief only recommends usable APIs.
2. Understand viem's test infrastructure in the fork at ${VIEM_REPO} (read-only): how prool/anvil instances are launched (test/src/*, vitest setup/globalSetup files), which suites depend on anvil, and where an in-process tevm node could substitute cleanly.
3. Output:
   - tevmTestFeatures: every notable tevm testing feature worth showing off.
   - opportunities: concrete, prioritized changes in the viem fork (with target files) that best demonstrate those features. Favor a coherent, reviewable PR over an exhaustive rewrite: e.g. a tevm-backed test client/pool alongside anvil, migrating a representative set of suites, and a doc/README section.
   - brief: a complete implementation brief an agent can follow start-to-finish, including exact packages to add, files to create/modify, pitfalls (version mismatches, ws vs http transports, timing/mining semantics differences from anvil), and the definition of done (which vitest suites must pass).`}
				</Task>
				<Parallel>
					{LANES.map((lane) => (
						<Task id={`lane-${lane}`} output={laneSchema} agent={laneAgents[lane]}>
							{lanePrompt(lane)}
						</Task>
					))}
				</Parallel>
				<Task id="judge" output={judgeSchema} agent={judgeAgent}>
					{`You are the JUDGE. Three agents implemented the same goal on three branches of the evmts/viem fork at ${VIEM_REPO}: tevm-test/kimi, tevm-test/codex-sol, tevm-test/opus.

${ctx.input.goal}

LANE REPORTS:
${laneReports}

Inspect each branch yourself (git log main..tevm-test/<lane>, git diff main...tevm-test/<lane> --stat, read the key files; worktrees live at ${Object.values(WT).join(", ")}). Verify claims: spot-run a test file per branch if feasible. Score on: correctness (tests actually pass), breadth of tevm test features demonstrated, code quality matching viem conventions, and PR reviewability. Pick the winner and list concrete elements worth grafting from the losing branches into the final PR (field "graft").`}
				</Task>
				<Task id="finalize" output={finalizeSchema} agent={finalizeAgent}>
					{`You are the FINALIZER working in ${VIEM_REPO}.

${ctx.input.goal}

The judge picked winner lane: ${judge?.winner ?? "(pending)"}.
Rationale: ${judge?.rationale ?? ""}
Graft from other lanes: ${judge?.graft ?? "none"}

Steps:
1. Create branch tevm-test/final from tevm-test/${judge?.winner ?? "codex-sol"}.
2. Apply the graft items from the other lane branches where they genuinely improve the PR.
3. Polish to a high-quality PR: viem code conventions, changeset if the repo uses changesets, docs/README notes on the tevm-backed test setup, clean commit history (squash fixups).
4. Run the affected vitest suites; everything you touched must pass. Report real output.
5. Push: git push -u origin tevm-test/final
6. Open the PR with gh: gh pr create --repo evmts/viem --base main --head tevm-test/final --title "..." --body "..." — a thorough description: motivation, what tevm test features are shown off, before/after of the anvil replacement, test evidence, and credits noting it was produced by a multi-agent run. End the body with "🤖 Generated with Smithers multi-agent orchestration".
7. Return the PR URL.`}
				</Task>
			</Sequence>
		</Workflow>
	);
});
