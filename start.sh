#!/bin/bash

# 启动脚本

set -e

echo ">>> 启动 CRM 系统..."

# 使用 Docker Compose 启动
docker-compose up -d

echo ">>> CRM 系统启动完成"
echo ""
echo "访问地址:"
echo "  - 前端: http://localhost"
echo "  - 后端 API: http://localhost:3000/api"
