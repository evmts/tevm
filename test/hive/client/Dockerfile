FROM node:24.22.3-bookworm AS build

# The workspace pin determines the native checkout and the Zig compiler.
RUN apt-get update && apt-get install -y --no-install-recommends clang libclang-dev unzip xz-utils \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://mise.run | sh \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
ENV PATH="/root/.local/bin:/root/.cargo/bin:/root/.local/share/mise/shims:${PATH}"
WORKDIR /app
COPY . .
RUN mise trust && mise install zig && corepack enable \
    && node scripts/factory/checkout-native.mjs \
    && pnpm install --frozen-lockfile --ignore-scripts \
    && node scripts/factory/build-native.mjs \
    && pnpm exec nx run @tevm/cli:build:app

FROM node:24.22.3-bookworm-slim
WORKDIR /app
COPY --from=build /app /app
COPY --from=build /zevm/npm /zevm/npm
EXPOSE 8545
ENTRYPOINT ["/app/test/hive/client/entrypoint.sh"]
