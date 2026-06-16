# ---------- 1) 构建前端 PWA ----------
FROM node:22-slim AS webbuilder
WORKDIR /web
COPY web/package.json web/package-lock.json* ./
RUN npm install
COPY web/ ./
RUN npm run build

# ---------- 2) 构建后端 ----------
FROM node:22-slim AS serverbuilder
WORKDIR /server
# better-sqlite3 原生模块的编译依赖（无预编译时用）
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json* ./
RUN npm install
COPY server/ ./
RUN npm run build && npm prune --omit=dev

# ---------- 3) 运行镜像 ----------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=serverbuilder /server/node_modules ./node_modules
COPY --from=serverbuilder /server/dist ./dist
COPY --from=serverbuilder /server/package.json ./package.json
# 前端构建产物作为静态站点由后端托管
COPY --from=webbuilder /web/dist ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]
