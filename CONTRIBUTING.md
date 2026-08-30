## Contributing to Tevm

## Quick start

1. Install the Node and pnpm versions pinned by the repository

```bash
corepack enable
corepack prepare pnpm@10.33.4 --activate
pnpm --version
```

Use Node `24.12.0` from `.nvmrc` (for example with `nvm use`).

2. Install mise, which installs the pinned Bun and Foundry releases from `mise.toml`

```bash
brew install mise   # or: curl https://mise.run | sh
mise install
```

or run bun upgrade if already installed

```bash
bun upgrade
```

3. Install Rust if working with Rust code

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

4. Bootstrap the local coding-factory dependencies

The factory uses the unpublished Flows source vendored as the `vendor/flows` submodule, plus the Zevm workspace vendored as `vendor/zevm`, both pinned by gitlink. It must not resolve Smithers packages from npm.

```bash
node scripts/factory/bootstrap.mjs --install
pnpm factory:preflight
```

The bootstrapper never rewrites an existing checkout. If a submodule worktree is at a different revision, reconcile it manually (`git submodule update -- vendor/flows`).

5. Update submodules

```bash
git submodule update --init --recursive
```

6. Set environment variables

In your path must be the following environment variables for the tests

```bash
export TEVM_TEST_ALCHEMY_KEY=
export TEVM_RPC_URLS_MAINNET=
export TEVM_RPC_URLS_OPTIMISM=
```

The RPC values are comma-separated lists of at least one provider URL. Tests
rate-limit and load-balance across the list. Full factory preflight requires all
three variables but reports only whether each is set, never its value.

7. Run everything

`pnpm allz` will run everything

`pnpm all` will run a smaller subset of everything

```bash
pnpm allz
```

This includes

- linting package.json
- linting npm build
- linting unused deps
- linting source code
- generated docs
- building all .d.ts types for all packages
- building all cjs for all packages
- building Rust libraries
- running all tests
- running all dev fixtures

8. Read [AGENTS.md](./AGENTS.md), the [monorepo section](#monorepo), and the [packages section](#packages).

## Coding factory

The factory turns common repository work into typed, bounded targets. Start with read-only discovery and an inert plan:

```bash
pnpm factory:check
pnpm factory:query
pnpm exec smthrs target //packages/address:typecheck --plan
```

Issue intake is deterministic and copies no issue body into its result:

```bash
node scripts/factory/issue-intake.mjs --issue 123 --format markdown
```

Maintainers may use `factory:ready` to authorize a candidate after intake. That label does not authorize a commit, push, pull request, merge, release, deployment, fork, or use of secrets. Those remain separately gated. See [factory/README.md](./factory/README.md) for the full lifecycle and operator setup.

The Smithers contributor portal links each supported issue form, the explicit
GitHub fork flow, bootstrap instructions, safe no-input desktop targets, and
copyable parameterized agent lanes:

```bash
pnpm factory:ui-check
pnpm factory:ui
```

Its checked-in facts are generated from policy, issue forms, and
`.smithers/UI.json`; run `pnpm factory:contributor-data-write` after changing
one of those sources.

Before pushing, run the two deterministic trust boundaries independently:

```bash
pnpm exec smthrs target //:mechanicalPrePush --no-cache
pnpm exec smthrs target //:externalIntegrationTests --no-cache
```

The first runs daemonless, cloud-disabled Nx checks with loopback-only network
access and no RPC secrets. The second is the explicit maintainer integration
lane for compiler downloads and live RPC tests. `//:prePush` adds the
PR-history-derived agent lints to both.

## Secrets

Many tests use Alchemy or another configured RPC provider. Keep
`TEVM_TEST_ALCHEMY_KEY` and the RPC failover lists in your shell; Flows passes
them only to targets that declare them.

## Nx can get slow

Sometimes you may notice nx slowing down single tasks taking a very long time consistentally. When this happens try running `pnpm nx reset` and it should reset it to being fast again.

## Monorepo

Tevm is a monorepo using

- [nx](https://nx.dev/concepts/mental-model) for caching and task management
- [bun](https://bun.sh/docs) for script runner and workspace node_module management
- [changesets](./.changeset/) for package versioning
- the local [Flows coding factory](./factory/README.md) for governed target execution and issue processing

For a list of all packages, see the `workspaces` key in the root level [package.json](./package.json)

## Packages

Tevm is heavily broken up into small packages. To see the entire package graph use nx

```bash
bun run nx graph
```

For more information the [reference docs](https://tevm.sh) are a useful resource. They are generated from the source code and link back to it

#### Build packages

- [@tevm/ts-plugin](./ts-plugin) is the LSP (language service protocol) plugin. It is what allows code editors such as VSCode to correctly infer types of solidity imports.
- [bundlers/\*](./bundlers) Are where all the supported bundlers live. Most are created using [@tevm/unplugin](./bundlers/unplugin) which implements a rollup plugin once to be reused in many packages including [@tevm/webpack](./bundlers/webpack) and [@tevm/vite](./bundlers/vite) and more.
- [@tevm/config](./config) is the package that loads the Tevm config

#### Runtime packages

- [@tevm/contract](./core) is the main entry point for all runtime functionality.

#### Rust packages

- [packages/my_rust_node_lib](./packages/my_rust_node_lib) is a sample Rust library using napi-rs for Node.js bindings.
- [lib/helios](./lib/helios) is a Rust-based Ethereum client embedded as a submodule.
- [lib/revm](./lib/revm) is a Rust implementation of the Ethereum Virtual Machine.

To build Rust packages, use:

```bash
bun build:rust:lib    # Development build
bun build:rust:app    # Production build
```

#### Docs

- [@tevm/docs](./docs) is the [vitepress docs site](https://tevm.sh). Its reference docs are generated via `bun generate:docs`

#### Example apps

Example apps are in [/examples/\*](./examples). [@tevm/example-esbuild](./examples/esbuild) has a vitest test and is the simplist app.

## Code best practices

#### JavaScript with jsdoc

`@tevm` is written in javascript with jsdoc so its `esm` build does not need to be built. This means any user using modern `esm` will be using the same src code in their node_modules as what is here.

This means all tevm packages run without being built by default and the same src code is shipped to most users

- [src/index.js](./src/index.js) - the entrypoint to the package

**Note** there is still 100% typesafety. TypeScript is able to typecheck via setting `checkJs: true` in the tsconfig and using jsdoc.

#### Types

The types are built to cache their result for end users.

```
bun build:types
```

- [tsconfig](./tsconfig.json) - @tevm/config tsconfig
- [@tevm/tsconfig](../tsconfig/base.json) - base tsconfig inherited from

## Running tests

```
bun run test
```

`@tevm/config` has >99% test coverage. Run the tests with `bun run test`

Note `bun test` will run bun instead of [vitest](https://vitest.dev) resulting in errors

## Fixtures

**Note**: Fixtures are located in individual packages such as `bundler-packages/config/src/fixtures/`, `bundler-packages/resolutions/src/fixtures/`, `bundler-packages/compiler/src/fixtures/`, and `lsp/ts-plugin/src/fixtures/`. The instructions below apply when working within those packages.

Fixtures in [src/fixtures](./src/fixtures/) exist both for the vitest tests and also can be loaded in watch mode.

The best way to debug a bug or implement a new feature is to first add a new fixture to use in test or dev server

Some fixtures are expected to error and the dev server will succeed if they do error. Which fixtures should error is configured in [scripts/runFixture.ts](./scripts/runFixture.ts)

Fixtures run with debug logging turned on. Debug logging is added to every function along with strong error handling so most debugging tasks won't need to involve adding console.logs if you are using a fixture.

#### Running all fixtures

```bash
bun dev
```

#### Running a specific fixtures

```bash
bun fixture basic
```

Valid names include any of the folder names in [src/fixtures](./fixtures). The default is basic

#### Adding a fixture

1. `cp -r src/fixtures/basic src/fixtures/myNewFixture`
2. update your fixture
3. Load your fixture `bun fixture myNewFixture`

Now you can implement your feature or use your fixture to write a test.

## Running linter

By default the linter runs in --fix mode

```basy
bun lint && bun format
```

The linter used is biome not prettier or eslint

#### Generating docs

Docs are generated in the `docs` folder of every package as well as the [main docs site](./docs)

```
bun generate:docs
```

Docs are generated based on the jsdoc and type errors

#### Barrel files

Whenever a new API is added, you will need to update a lot of barrel files. Though tedious this helps keep the packages stable from accidental breaking changes or exporting something that should be private. You will need to update the following places:

- All the `index.js` in your package
- Possibly the top level `src/index.ts` to update the types too if
- Update the [tevm](./tevm) package (unless it's a build tool change)
- Update the [@tevm/bundler](./bundler/) package if it's a build tool api

If you add a lot of files, there is a tool to automatically generate a barrel file in your folder in [`scripts`](./scripts/createBarrelFiles.ts)

## Clean build

If you ever have a `wtf` moment, consider doing a clean build. It will remove node_modules and then rebuild repo from scratch

```
pnpm all:clean
```

## Claude Commands

This repository includes several helpful Claude commands in the `.claude/commands/` directory that can automate common tasks. Here's how to use them:

### Commit (`/commit`)

Creates well-formatted commits with conventional commit messages and emoji:
- Runs pre-commit checks (lint, build, generate docs)
- Helps analyze and format changes with appropriate commit types and emojis
- Suggests splitting large changes into atomic commits
- Options: `--no-verify` to skip pre-commit checks

### Add Gitmoji Hook (`/.claude/commands/add-gitmoji.md`)

Installs the gitmoji commit hook to select emoji for commits using an interactive prompt:
- Creates the hooks directory if needed
- Sets up the prepare-commit-msg hook
- Makes the hook executable

### Git Worktrees (`/.claude/commands/create-worktrees.md`)

Helps manage git worktrees for better workflow:
- Create worktrees for all open PRs
- Create a new branch and worktree
- Clean up stale worktrees

### Husky Pre-commit Checks (`/.claude/commands/husky.md`)

Verifies the repo is in a working state by running:
- Dependency installation (`pnpm i`)
- Linting (`pnpm lint`)
- Type checking and builds (`pnpm nx run-many --targets=build:types,build:dist...`)
- Tests (`pnpm nx run-many --target=test:coverage`)
- Package.json sorting
- Package linting

### Update Solidity Versions (`/.claude/commands/update-solidity.md`)

Helps update Solidity compiler version support in the @tevm/solc package:
- Checks for new Solidity releases
- Uses the version script to get version hashes
- Updates appropriate files with new versions
