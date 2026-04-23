# 后端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json
COPY backend/package.json ./
COPY backend/pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制 Prisma 文件
COPY backend/prisma ./prisma/

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制源代码
COPY backend/src ./src
COPY backend/tsconfig.json ./

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动
CMD ["pnpm", "start"]
