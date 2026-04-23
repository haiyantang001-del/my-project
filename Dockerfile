# CRM 系统后端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 lock 文件
COPY backend/package.json backend/pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制 Prisma 文件并生成客户端
COPY backend/prisma ./prisma/
RUN npx prisma generate

# 复制源代码
COPY backend/src ./src

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
