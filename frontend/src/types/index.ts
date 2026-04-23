// 用户类型
export interface User {
  id: string
  username: string
  name: string
  email?: string
  phone?: string
  department?: string
  position?: string
  role: 'admin' | 'user'
  isActive?: boolean
  createdAt?: string
}

// 客户类型
export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  company?: string
  industry?: string
  companySize?: string
  source?: string
  status: string
  address?: string
  notes?: string
  ownerId: string
  owner?: { id: string; name: string }
  createdAt: string
  updatedAt: string
  activities?: Activity[]
  opportunities?: Opportunity[]
  contracts?: Contract[]
}

// 商机类型
export interface Opportunity {
  id: string
  name: string
  customerId: string
  customer?: { id: string; name: string; company?: string }
  stage: string
  probability: number
  amount: number
  priority: string
  description?: string
  expectedCloseDate?: string
  ownerId: string
  owner?: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

// 合同类型
export interface Contract {
  id: string
  contractNo: string
  name: string
  customerId: string
  customer?: { id: string; name: string; company?: string }
  opportunityId?: string
  opportunity?: { id: string; name: string }
  amount: number
  startDate: string
  endDate?: string
  status: string
  description?: string
  ownerId: string
  owner?: { id: string; name: string }
  createdAt: string
  updatedAt: string
  payments?: Payment[]
  totalPaid?: number
  remainingAmount?: number
}

// 回款类型
export interface Payment {
  id: string
  contractId: string
  contract?: { id: string; contractNo: string; name: string; customer?: { id: string; name: string } }
  amount: number
  paymentDate: string
  paymentMethod?: string
  referenceNo?: string
  notes?: string
  receivedById: string
  receivedBy?: { id: string; name: string }
  createdAt: string
}

// 活动类型
export interface Activity {
  id: string
  customerId: string
  customer?: { id: string; name: string; company?: string }
  type: string
  subject: string
  content?: string
  nextAction?: string
  nextFollowUpDate?: string
  createdById: string
  createdBy?: { id: string; name: string }
  createdAt: string
}

// 字典项类型
export interface DictItem {
  id: string
  category: string
  code: string
  label: string
  value?: string
  sortOrder: number
  isActive: boolean
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 统计数据类型
export interface DashboardStats {
  totalCustomers: number
  totalOpportunities: number
  totalContracts: number
  totalContractAmount: number
  totalPaymentAmount: number
  activeUsers: number
  newCustomersThisMonth: number
  newContractsThisMonth: number
  paymentsThisMonth: number
  opportunityByStage: { stage: string; _count: { id: number } }[]
  customerByStatus: { status: string; _count: { id: number } }[]
  recentActivities: Activity[]
}
