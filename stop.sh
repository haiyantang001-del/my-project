#!/bin/bash

# 停止脚本

echo ">>> 停止 CRM 系统..."

# 停止后端
if [ -f /var/run/crm-backend.pid ]; then
    kill $(cat /var/run/crm-backend.pid) 2>/dev/null || true
    rm -f /var/run/crm-backend.pid
fi

# 停止前端
if [ -f /var/run/crm-frontend.pid ]; then
    kill $(cat /var/run/crm-frontend.pid) 2>/dev/null || true
    rm -f /var/run/crm-frontend.pid
fi

echo ">>> CRM 系统已停止"
