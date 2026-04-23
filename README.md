# CRM 客户关系管理系统

企业级 CRM 系统，支持客户管理、商机管理、合同管理、付款跟踪等功能。

## 在线访问

**阿里云服务器地址**: http://101.133.152.89

- 前端: http://101.133.152.89
- 后端 API: http://101.133.152.89:3000/api
- 健康检查: http://101.133.152.89:3000/api/health

## 默认登录账号

- 用户名: `admin`
- 密码: `admin123`

## 技术栈

- **前端**: React 19 + TypeScript + TailwindCSS + Vite
- **后端**: Express + Prisma ORM + PostgreSQL
- **认证**: JWT Token

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动数据库
docker-compose up -d postgres

# 初始化数据库
cd backend && npx prisma migrate dev

# 启动后端
pnpm --filter spec-template-backend dev

# 启动前端 (新终端)
pnpm --filter frontend dev
```

## 阿里云 ECS Docker 部署

### 方式一：使用部署脚本

```bash
# 1. 克隆代码
git clone https://github.com/haiyantang001-del/my-project.git
cd my-project

# 2. 赋予执行权限
chmod +x docker-deploy.sh

# 3. 执行部署
./docker-deploy.sh
```

### 方式二：手动部署

```bash
# 构建前端
cd frontend && pnpm install && pnpm build && cd ..

# 启动 Docker 容器
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

## 停止服务

```bash
./stop.sh
# 或
docker-compose down
```

## 环境变量配置

复制 `.env.example` 为 `.env.production` 并修改：

```bash
cp .env.example .env.production
```

主要配置项：
- `DATABASE_URL`: 数据库连接地址
- `JWT_SECRET`: JWT 密钥
- `CORS_ORIGIN`: 允许的跨域域名

## 项目结构

```
├── backend/           # 后端代码
│   ├── prisma/        # 数据库模型
│   └── src/           # 源代码
├── frontend/          # 前端代码
│   └── src/
├── docker-compose.yml # Docker 编排
├── Dockerfile         # 后端镜像
├── nginx.conf         # Nginx 配置
└── docker-deploy.sh   # 一键部署脚本
```
