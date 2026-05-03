FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

# Install deps using workspace-aware approach
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile --filter=backend

# Build
COPY packages/backend/ ./packages/backend/
RUN pnpm --filter=backend build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/node_modules ./node_modules
COPY --from=builder /app/packages/backend/package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
