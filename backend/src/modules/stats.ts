import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

// 获取仪表盘统计数据
router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'admin'
    const userId = req.user!.id

    // 客户统计
    const customerWhere = isAdmin ? { deletedAt: null } : { deletedAt: null, ownerId: userId }
    const totalCustomers = await prisma.customer.count({ where: customerWhere })

    // 商机统计
    const opportunityWhere = isAdmin ? { deletedAt: null } : { deletedAt: null, ownerId: userId }
    const totalOpportunities = await prisma.opportunity.count({ where: opportunityWhere })

    // 合同统计
    const contractWhere = isAdmin ? { deletedAt: null } : { deletedAt: null, ownerId: userId }
    const totalContracts = await prisma.contract.count({ where: contractWhere })

    // 合同金额统计
    const contractAmounts = await prisma.contract.aggregate({
      where: contractWhere,
      _sum: { amount: true }
    })

    // 回款金额统计
    const paymentWhere = isAdmin ? {} : { receivedById: userId }
    const paymentAmounts = await prisma.payment.aggregate({
      where: paymentWhere,
      _sum: { amount: true }
    })

    // 活跃用户数
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    })

    // 本月新增客户
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const newCustomersThisMonth = await prisma.customer.count({
      where: {
        ...customerWhere,
        createdAt: { gte: startOfMonth }
      }
    })

    // 本月新增合同
    const newContractsThisMonth = await prisma.contract.count({
      where: {
        ...contractWhere,
        createdAt: { gte: startOfMonth }
      }
    })

    // 本月回款金额
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        ...paymentWhere,
        paymentDate: { gte: startOfMonth }
      },
      _sum: { amount: true }
    })

    // 商机阶段分布
    const opportunityByStage = await prisma.opportunity.groupBy({
      by: ['stage'],
      where: opportunityWhere,
      _count: { id: true }
    })

    // 客户状态分布
    const customerByStatus = await prisma.customer.groupBy({
      by: ['status'],
      where: customerWhere,
      _count: { id: true }
    })

    // 最近活动
    const recentActivities = await prisma.activity.findMany({
      where: isAdmin ? {} : { createdById: userId },
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    res.json({
      status: 'success',
      data: {
        totalCustomers,
        totalOpportunities,
        totalContracts,
        totalContractAmount: contractAmounts._sum.amount || 0,
        totalPaymentAmount: paymentAmounts._sum.amount || 0,
        activeUsers,
        newCustomersThisMonth,
        newContractsThisMonth,
        paymentsThisMonth: paymentsThisMonth._sum.amount || 0,
        opportunityByStage,
        customerByStatus,
        recentActivities
      }
    })
  } catch (error) {
    next(error)
  }
})

export { router as statsRouter }
