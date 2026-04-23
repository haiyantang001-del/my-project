#!/bin/bash

# ===========================================
# 阿里云 ECS Docker 部署脚本
# ===========================================

set -e

echo "=========================================="
echo "CRM 系统 Docker 部署"
echo "时间: $(date)"
echo "=========================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装"
    echo "请先安装 Docker: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose"
    exit 1
fi

# 进入代码目录
cd "$(dirname "$0")"

echo "当前目录: $(pwd)"

# 停止并清理旧容器
echo ""
echo ">>> 停止旧容器..."
docker-compose down --remove-orphans 2>/dev/null || true

# 构建前端
echo ""
echo ">>> 构建前端..."
cd frontend
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
pnpm install
pnpm build
cd ..

# 构建并启动 Docker 容器
echo ""
echo ">>> 构建 Docker 镜像..."
docker-compose build --no-cache

echo ""
echo ">>> 启动容器..."
docker-compose up -d

# 等待服务启动
echo ""
echo ">>> 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo ">>> 检查服务状态..."
docker-compose ps

# 健康检查
echo ""
echo ">>> 健康检查..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "后端服务健康检查通过"
        break
    fi
    echo "等待后端服务启动... ($i/30)"
    sleep 2
done

echo ""
echo "=========================================="
echo "部署完成！"
echo ""
echo "访问地址:"
echo "  - 前端: http://localhost"
echo "  - 后端 API: http://localhost:3000/api"
echo "  - 健康检查: http://localhost:3000/api/health"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "=========================================="
