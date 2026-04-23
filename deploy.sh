#!/bin/bash

# 阿里云部署脚本
# 代码已自动下载到 code_deploy_application 文件夹

set -e

echo "=========================================="
echo "开始部署 CRM 系统"
echo "时间: $(date)"
echo "=========================================="

# 定义目录
DEPLOY_DIR="/home/admin/crm-system"
LOG_DIR="/var/log/crm-system"

# 创建日志目录
mkdir -p $LOG_DIR

# 进入代码目录
cd code_deploy_application

echo ">>> 当前目录内容:"
ls -la

# ========================================
# 后端部署
# ========================================
echo ""
echo ">>> [1/4] 部署后端..."
cd backend

echo "    - 安装后端依赖..."
pnpm install --frozen-lockfile 2>&1 | tee -a $LOG_DIR/install.log

echo "    - 生成 Prisma 客户端..."
npx prisma generate 2>&1 | tee -a $LOG_DIR/prisma.log

echo "    - 运行数据库迁移..."
npx prisma migrate deploy 2>&1 | tee -a $LOG_DIR/migrate.log

echo "    - 初始化数据库数据..."
npx tsx src/scripts/init-db.ts 2>&1 | tee -a $LOG_DIR/init.log || echo "    数据库已初始化"

echo "    - 构建后端..."
pnpm build 2>&1 | tee -a $LOG_DIR/build.log

# ========================================
# 前端部署
# ========================================
echo ""
echo ">>> [2/4] 部署前端..."
cd ../frontend

echo "    - 安装前端依赖..."
pnpm install --frozen-lockfile 2>&1 | tee -a $LOG_DIR/install.log

echo "    - 构建前端..."
pnpm build 2>&1 | tee -a $LOG_DIR/build.log

# ========================================
# 复制文件到部署目录
# ========================================
echo ""
echo ">>> [3/4] 复制文件到部署目录..."
mkdir -p $DEPLOY_DIR

# 复制后端
cp -r ../backend $DEPLOY_DIR/
# 复制前端构建产物
cp -r dist $DEPLOY_DIR/frontend-dist

# ========================================
# 创建启动脚本
# ========================================
echo ""
echo ">>> [4/4] 创建启动脚本..."

cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
cd /home/admin/crm-system/backend
export NODE_ENV=production
export DATABASE_URL="postgresql://postgres:Tencent2025@localhost:5432/genie?schema=public"
export JWT_SECRET="crm-system-jwt-secret-key-2024"
export CORS_ORIGIN="*"
nohup pnpm start > /var/log/crm-system/backend.log 2>&1 &
echo $! > /var/run/crm-backend.pid
echo "后端已启动，PID: $(cat /var/run/crm-backend.pid)"
EOF

chmod +x $DEPLOY_DIR/start.sh

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "请执行以下命令启动服务："
echo "  cd $DEPLOY_DIR && ./start.sh"
echo ""
