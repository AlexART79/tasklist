FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile --filter=backend

COPY packages/backend/ ./packages/backend/
RUN pnpm --filter=backend build
RUN cp -R packages/backend/src/db/migrations packages/backend/dist/db/migrations
RUN pnpm --filter=backend deploy --prod /prod/backend

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /prod/backend ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
