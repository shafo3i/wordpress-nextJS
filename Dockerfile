# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--experimental-require-module
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_APP_URL}
# Public URLs are baked into browser bundles. Real credentials are runtime-only.
RUN test -n "$NEXT_PUBLIC_APP_URL" && \
    DATABASE_URL="postgresql://build:build@127.0.0.1:9/build" \
    BETTER_AUTH_SECRET="build-only-placeholder-not-a-runtime-secret" \
    BETTER_AUTH_URL="$NEXT_PUBLIC_APP_URL" \
    pnpm exec next build --webpack

FROM base AS production-dependencies
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Copy the complete production dependency tree: jsdom and Sharp load native/filesystem assets.
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/templates ./templates
COPY --from=build --chown=node:node /app/deploy/server.mjs /app/deploy/uploads.mjs ./deploy/
COPY --from=build --chown=node:node /app/package.json /app/next.config.ts /app/tsconfig.json ./
RUN mkdir -p /app/public/uploads /app/.next/cache && chown -R node:node /app/public/uploads /app/.next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/cms-login',{signal:AbortSignal.timeout(8000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "deploy/server.mjs"]
