#!/bin/bash

# ===========================================
# 阿里云 ECS Docker 部署脚本
# ===========================================

set -e

echo "=========================================="
echo "CRM 系统部署开始"
echo "时间: $(date)"
echo "=========================================="

# 安装 Docker（如果没有）
if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 安装 Docker Compose（如果没有）
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 进入代码目录
cd code_deploy_application 2>/dev/null || cd .

echo "当前目录: $(pwd)"

# 停止并删除旧容器
echo ""
echo ">>> 停止并清理旧容器..."
docker stop myapp crm-backend crm-frontend crm-postgres 2>/dev/null || true
docker rm myapp crm-backend crm-frontend crm-postgres 2>/dev/null || true
docker-compose down --remove-orphans 2>/dev/null || true

# 安装 pnpm（如果没有）
if ! command -v pnpm &> /dev/null; then
    echo "安装 pnpm..."
    npm install -g pnpm
fi

# 构建前端
echo ""
echo ">>> 构建前端..."
cd frontend
pnpm install
pnpm build
cd ..

# 构建 Docker 镜像
echo ""
echo ">>> 构建 Docker 镜像..."
docker-compose build --no-cache

# 启动 Docker 容器
echo ""
echo ">>> 启动 Docker 容器..."
docker-compose up -d

# 等待服务启动
echo ""
echo ">>> 等待服务启动..."
sleep 15

# 检查服务状态
echo ""
echo ">>> 检查服务状态..."
docker-compose ps

# 健康检查
echo ""
echo ">>> 健康检查..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ 后端服务健康检查通过"
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
echo "  - 前端: http://101.133.152.89"
echo "  - 后端 API: http://101.133.152.89:3000/api"
echo "  - 健康检查: http://101.133.152.89:3000/api/health"
echo ""
echo "默认登录账号:"
echo "  - 用户名: admin"
echo "  - 密码: admin123"
echo ""
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "=========================================="
