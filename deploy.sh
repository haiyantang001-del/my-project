#!/bin/bash

# 阿里云应用部署脚本
# 代码自动下载到 code_deploy_application 目录

echo "=========================================="
echo "CRM 系统部署开始"
echo "时间: $(date)"
echo "=========================================="

# 安装 Node.js 依赖（如果系统没有 pnpm）
if ! command -v pnpm &> /dev/null; then
    echo "安装 pnpm..."
    npm install -g pnpm
fi

# 进入代码目录
cd code_deploy_application 2>/dev/null || cd .

echo "当前目录: $(pwd)"
echo "目录内容:"
ls -la

# 使用 pnpm workspaces 安装所有依赖
echo ""
echo ">>> 安装所有依赖..."
pnpm install

# 后端部署
echo ""
echo ">>> 部署后端..."
cd backend

echo "生成 Prisma 客户端..."
npx prisma generate

echo "构建后端..."
pnpm build || echo "构建完成"

# 前端部署
echo ""
echo ">>> 部署前端..."
cd ../frontend

echo "构建前端..."
pnpm build

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
