FROM node:24.22.3-bookworm AS build

# The workspace pin determines the native checkout and the Zig compiler.
RUN apt-get update && apt-get install -y --no-install-recommends clang libclang-dev unzip xz-utils \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://mise.run | sh \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
ENV PATH="/root/.local/bin:/root/.cargo/bin:/root/.local/share/mise/shims:${PATH}"
WORKDIR /workspace/tevm
COPY . .
RUN mise trust && mise install zig && corepack enable
RUN node scripts/factory/checkout-native.mjs --build-only
RUN pnpm install --frozen-lockfile --ignore-scripts && test -x node_modules/.bin/nx
RUN node scripts/factory/build-native.mjs && pnpm exec nx run @tevm/cli:build:app

FROM node:24.22.3-bookworm-slim
WORKDIR /app
COPY --from=build /workspace/tevm /app
COPY --from=build /workspace/zevm/npm /zevm/npm
EXPOSE 8545
ENTRYPOINT ["/app/test/hive/client/entrypoint.sh"]
