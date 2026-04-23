# CRM 客户关系管理系统 - 产品需求文档

## 产品概述

企业级客户关系管理系统，支持客户、商机、合同、回款、业务活动全流程数字化管理，具备用户权限、基础数据配置、个人资料管理等功能。

## 核心功能

### 1. 用户认证系统
- 用户登录/登出
- 个人资料管理（修改密码、个人信息）
- 角色权限控制（管理员/普通用户）
- JWT Token 认证

### 2. 仪表盘（首页）
- 总客户数统计
- 总商机数统计
- 总合同数统计
- 活跃用户数统计
- 业务数据概览图表

### 3. 客户管理（核心模块）
- 客户列表查询（支持搜索、筛选、排序、分页）
- 新增客户（自动归属当前用户）
- 客户详情查看
- 编辑客户信息
- 修改客户状态
- 添加客户跟进活动
- 删除客户（软删除）

### 4. 商机管理
- 商机列表查询
- 新增商机（关联客户）
- 编辑商机
- 删除商机（软删除）
- 商机阶段管理

### 5. 合同管理
- 合同列表查询
- 新增合同（关联客户、商机）
- 合同详情查看（含回款记录）
- 编辑合同
- 删除合同（软删除）

### 6. 回款管理
- 回款记录列表
- 新增回款（关联合同）
- 编辑回款
- 删除回款
- 回款统计

### 7. 业务活动管理
- 活动列表查询
- 活动类型：电话、会议、邮件、拜访、演示、其他
- 添加活动（关联客户）
- 删除活动

### 8. 系统设置
- 基础数据配置（客户来源、行业、客户状态、商机阶段、合同状态、付款方式等）
- 用户管理（仅管理员）
- 个人资料管理

## 用户故事

### 用户认证
- 作为用户，我希望能够安全登录系统，访问我的工作空间
- 作为用户，我希望能够修改自己的密码和个人信息
- 作为管理员，我希望能够管理所有用户的账号和权限

### 客户管理
- 作为销售人员，我希望能够新增和管理我的客户信息
- 作为销售人员，我希望能够记录客户的跟进活动
- 作为销售人员，我希望能够查看客户的完整信息和历史记录
- 作为管理员，我希望能够查看和管理所有客户数据

### 商机管理
- 作为销售人员，我希望能够创建和管理销售机会
- 作为销售人员，我希望能够更新商机的阶段和成功率
- 作为销售人员，我希望能够将商机关联到具体的客户

### 合同管理
- 作为销售人员，我希望能够创建和管理合同
- 作为销售人员，我希望能够查看合同的回款情况
- 作为销售人员，我希望能够将合同关联到客户和商机

### 回款管理
- 作为销售人员，我希望能够记录合同的回款情况
- 作为销售人员，我希望能够查看回款统计和剩余金额

### 业务活动
- 作为销售人员，我希望能够记录所有客户跟进行为
- 作为销售人员，我希望能够查看活动的完整历史

### 系统设置
- 作为管理员，我希望能够配置系统的基础数据字典
- 作为管理员，我希望能够管理所有用户账号

## 页面结构

### 公开页面
- `/login` - 登录页面

### 认证后页面（需要登录）
- `/dashboard` - 仪表盘/首页
- `/customers` - 客户管理
- `/customers/:id` - 客户详情
- `/opportunities` - 商机管理
- `/opportunities/:id` - 商机详情
- `/contracts` - 合同管理
- `/contracts/:id` - 合同详情
- `/payments` - 回款管理
- `/activities` - 业务活动管理
- `/settings` - 系统设置
- `/settings/users` - 用户管理（管理员）
- `/settings/dict` - 基础数据配置（管理员）
- `/profile` - 个人资料

## 数据模型

### User（用户）
- id: UUID
- username: String（唯一）
- password: String（加密）
- name: String
- email: String
- phone: String
- department: String
- position: String
- role: Enum（admin, user）
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime

### Customer（客户）
- id: UUID
- name: String
- phone: String
- email: String
- company: String
- industry: String
- companySize: String
- source: String
- status: String
- address: String
- notes: String
- ownerId: UUID（关联用户）
- createdAt: DateTime
- updatedAt: DateTime
- deletedAt: DateTime（软删除）

### Opportunity（商机）
- id: UUID
- name: String
- customerId: UUID（关联客户）
- stage: String
- probability: Int（0-100）
- amount: Decimal
- priority: String
- description: String
- expectedCloseDate: DateTime
- ownerId: UUID（关联用户）
- createdAt: DateTime
- updatedAt: DateTime
- deletedAt: DateTime（软删除）

### Contract（合同）
- id: UUID
- contractNo: String（合同编号）
- name: String
- customerId: UUID（关联客户）
- opportunityId: UUID（关联商机，可选）
- amount: Decimal
- startDate: DateTime
- endDate: DateTime
- status: String
- description: String
- ownerId: UUID（关联用户）
- createdAt: DateTime
- updatedAt: DateTime
- deletedAt: DateTime（软删除）

### Payment（回款）
- id: UUID
- contractId: UUID（关联合同）
- amount: Decimal
- paymentDate: DateTime
- paymentMethod: String
- referenceNo: String
- notes: String
- receivedById: UUID（收款人）
- createdAt: DateTime
- updatedAt: DateTime

### Activity（业务活动）
- id: UUID
- customerId: UUID（关联客户）
- type: String（电话、会议、邮件、拜访、演示、其他）
- subject: String
- content: String
- nextAction: String
- nextFollowUpDate: DateTime
- createdById: UUID（创建人）
- createdAt: DateTime
- updatedAt: DateTime

### DictItem（字典项）
- id: UUID
- category: String（字典类型）
- code: String（编码）
- label: String（显示名称）
- value: String（值）
- sortOrder: Int
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime

## API 端点

### 认证 API
- POST `/api/auth/login` - 登录
- POST `/api/auth/logout` - 登出
- GET `/api/auth/me` - 获取当前用户信息
- PUT `/api/auth/profile` - 更新个人资料
- PUT `/api/auth/password` - 修改密码

### 客户 API
- GET `/api/customers` - 获取客户列表
- GET `/api/customers/:id` - 获取客户详情
- POST `/api/customers` - 新增客户
- PUT `/api/customers/:id` - 更新客户
- PUT `/api/customers/:id/status` - 更新客户状态
- DELETE `/api/customers/:id` - 删除客户

### 商机 API
- GET `/api/opportunities` - 获取商机列表
- GET `/api/opportunities/:id` - 获取商机详情
- POST `/api/opportunities` - 新增商机
- PUT `/api/opportunities/:id` - 更新商机
- DELETE `/api/opportunities/:id` - 删除商机

### 合同 API
- GET `/api/contracts` - 获取合同列表
- GET `/api/contracts/:id` - 获取合同详情
- POST `/api/contracts` - 新增合同
- PUT `/api/contracts/:id` - 更新合同
- DELETE `/api/contracts/:id` - 删除合同

### 回款 API
- GET `/api/payments` - 获取回款列表
- GET `/api/payments/:id` - 获取回款详情
- POST `/api/payments` - 新增回款
- PUT `/api/payments/:id` - 更新回款
- DELETE `/api/payments/:id` - 删除回款

### 活动 API
- GET `/api/activities` - 获取活动列表
- GET `/api/activities/:id` - 获取活动详情
- POST `/api/activities` - 新增活动
- PUT `/api/activities/:id` - 更新活动
- DELETE `/api/activities/:id` - 删除活动

### 字典 API
- GET `/api/dict` - 获取所有字典项
- GET `/api/dict/:category` - 获取指定类别的字典项
- POST `/api/dict` - 新增字典项（管理员）
- PUT `/api/dict/:id` - 更新字典项（管理员）
- DELETE `/api/dict/:id` - 删除字典项（管理员）

### 用户管理 API（管理员）
- GET `/api/users` - 获取用户列表
- GET `/api/users/:id` - 获取用户详情
- POST `/api/users` - 新增用户
- PUT `/api/users/:id` - 更新用户
- PUT `/api/users/:id/status` - 启用/禁用用户
- DELETE `/api/users/:id` - 删除用户

### 统计 API
- GET `/api/stats/dashboard` - 获取仪表盘统计数据
