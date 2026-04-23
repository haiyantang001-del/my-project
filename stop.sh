#!/bin/bash

# 停止所有服务

echo ">>> 停止 CRM 系统服务..."

docker-compose down

echo ">>> 服务已停止"
