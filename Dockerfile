# CRM 系统后端 Dockerfile
FROM node:20-alpine

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 package.json 文件
COPY backend/package.json ./
COPY backend/pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile || pnpm install

# 复制 Prisma 文件并生成客户端
COPY backend/prisma ./prisma/
RUN npx prisma generate

# 复制源代码
COPY backend/tsconfig.json ./
COPY backend/src ./src

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
