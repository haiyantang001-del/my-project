#!/bin/bash

# 启动脚本

set -e

echo ">>> 启动 CRM 系统..."

cd /home/admin/crm-system

# 启动后端
cd backend
nohup pnpm dev > /var/log/crm-backend.log 2>&1 &
echo $! > /var/run/crm-backend.pid

# 启动前端（如果需要）
# cd ../frontend
# nohup pnpm preview --port 5173 > /var/log/crm-frontend.log 2>&1 &
# echo $! > /var/run/crm-frontend.pid

echo ">>> CRM 系统启动完成"
