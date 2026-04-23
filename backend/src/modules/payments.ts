import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createPaymentSchema, updatePaymentSchema, queryPaymentSchema } from '../types/payment.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.use(authMiddleware)

// 获取回款列表
router.get('/', validateRequest(queryPaymentSchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, contractId, customerId, startDate, endDate, sortBy, sortOrder } = req.query as any

    const where: any = {}

    if (req.user!.role !== 'admin') {
      where.receivedById = req.user!.id
    }

    if (contractId) where.contractId = contractId

    if (customerId) {
      where.contract = { customerId }
    }

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) where.paymentDate.gte = new Date(startDate)
      if (endDate) where.paymentDate.lte = new Date(endDate)
    }

    const [total, items] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          contract: {
            select: { id: true, contractNo: true, name: true, customer: { select: { id: true, name: true, company: true } } }
          },
          receivedBy: { select: { id: true, name: true } }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    res.json({
      status: 'success',
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    })
  } catch (error) {
    next(error)
  }
})

// 获取回款详情
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        contract: {
          select: { id: true, contractNo: true, name: true, amount: true, customer: { select: { id: true, name: true } } }
        },
        receivedBy: { select: { id: true, name: true } }
      }
    })

    if (!payment) {
      throw new AppError(404, '回款记录不存在')
    }

    if (req.user!.role !== 'admin' && payment.receivedById !== req.user!.id) {
      throw new AppError(403, '无权访问此回款记录')
    }

    res.json({ status: 'success', data: payment })
  } catch (error) {
    next(error)
  }
})

// 新增回款
router.post('/', validateRequest(createPaymentSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 检查合同是否存在
    const contract = await prisma.contract.findFirst({
      where: { id: req.body.contractId, deletedAt: null }
    })

    if (!contract) {
      throw new AppError(404, '合同不存在')
    }

    if (req.user!.role !== 'admin' && contract.ownerId !== req.user!.id) {
      throw new AppError(403, '无权为此合同添加回款')
    }

    const payment = await prisma.payment.create({
      data: {
        ...req.body,
        paymentDate: new Date(req.body.paymentDate),
        receivedById: req.user!.id
      },
      include: {
        contract: { select: { id: true, contractNo: true, name: true } },
        receivedBy: { select: { id: true, name: true } }
      }
    })

    res.status(201).json({ status: 'success', data: payment })
  } catch (error) {
    next(error)
  }
})

// 更新回款
router.put('/:id', validateRequest(updatePaymentSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.payment.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError(404, '回款记录不存在')
    }

    if (req.user!.role !== 'admin' && existing.receivedById !== req.user!.id) {
      throw new AppError(403, '无权修改此回款记录')
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined
      },
      include: {
        contract: { select: { id: true, contractNo: true, name: true } },
        receivedBy: { select: { id: true, name: true } }
      }
    })

    res.json({ status: 'success', data: payment })
  } catch (error) {
    next(error)
  }
})

// 删除回款
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.payment.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError(404, '回款记录不存在')
    }

    if (req.user!.role !== 'admin' && existing.receivedById !== req.user!.id) {
      throw new AppError(403, '无权删除此回款记录')
    }

    await prisma.payment.delete({
      where: { id }
    })

    res.json({ status: 'success', message: '回款记录已删除' })
  } catch (error) {
    next(error)
  }
})

export { router as paymentRouter }
