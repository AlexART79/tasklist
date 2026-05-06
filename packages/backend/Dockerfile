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

# Create self-contained production bundle (resolves pnpm virtual-store symlinks)
RUN pnpm deploy --filter=backend --prod /app/deploy

FROM node:22-alpine AS runtime
WORKDIR /app
# pnpm deploy gives us node_modules without symlinks; dist is excluded by .gitignore so copy it explicitly
COPY --from=builder /app/deploy .
COPY --from=builder /app/packages/backend/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
