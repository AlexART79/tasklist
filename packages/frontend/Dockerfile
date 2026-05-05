FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile --filter=frontend

COPY packages/frontend/ ./packages/frontend/
RUN pnpm --filter=frontend build

FROM nginx:alpine AS runtime
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
