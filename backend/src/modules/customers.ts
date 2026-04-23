import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createCustomerSchema, updateCustomerSchema, updateCustomerStatusSchema, queryCustomerSchema } from '../types/customer.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.use(authMiddleware)

router.get('/', validateRequest(queryCustomerSchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, search, status, source, industry, sortBy, sortOrder } = req.query as any

    const where: any = { deletedAt: null }

    if (req.user!.role !== 'admin') {
      where.ownerId = req.user!.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) where.status = String(status)
    if (source) where.source = String(source)
    if (industry) where.industry = String(industry)

    const [total, items] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } }
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

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } }
      }
    })

    if (!customer) {
      throw new AppError(404, '客户不存在')
    }

    if (req.user!.role !== 'admin' && customer.ownerId !== req.user!.id) {
      throw new AppError(403, '无权访问此客户')
    }

    const activities = await prisma.activity.findMany({
      where: { customerId: id },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const opportunities = await prisma.opportunity.findMany({
      where: { customerId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    })

    const contracts = await prisma.contract.findMany({
      where: { customerId: id, deletedAt: null },
      include: { payments: true },
      orderBy: { createdAt: 'desc' }
    })

    const contractStats = contracts.map(c => ({
      ...c,
      totalPaid: c.payments.reduce((sum: number, p) => sum + Number(p.amount), 0),
      remainingAmount: Number(c.amount) - c.payments.reduce((sum: number, p) => sum + Number(p.amount), 0)
    }))

    res.json({
      status: 'success',
      data: { ...customer, activities, opportunities, contracts: contractStats }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', validateRequest(createCustomerSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.create({
      data: { ...req.body, ownerId: req.user!.id },
      include: { owner: { select: { id: true, name: true } } }
    })

    await prisma.activity.create({
      data: {
        customerId: customer.id,
        type: 'other',
        subject: '客户创建',
        content: '客户信息已创建',
        createdById: req.user!.id
      }
    })

    res.status(201).json({ status: 'success', data: customer })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', validateRequest(updateCustomerSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.customer.findFirst({ where: { id, deletedAt: null } })

    if (!existing) {
      throw new AppError(404, '客户不存在')
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.id) {
      throw new AppError(403, '无权修改此客户')
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: req.body,
      include: { owner: { select: { id: true, name: true } } }
    })

    await prisma.activity.create({
      data: {
        customerId: customer.id,
        type: 'other',
        subject: '客户信息更新',
        content: '客户信息已更新',
        createdById: req.user!.id
      }
    })

    res.json({ status: 'success', data: customer })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/status', validateRequest(updateCustomerStatusSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const existing = await prisma.customer.findFirst({ where: { id, deletedAt: null } })

    if (!existing) {
      throw new AppError(404, '客户不存在')
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.id) {
      throw new AppError(403, '无权修改此客户')
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { status },
      include: { owner: { select: { id: true, name: true } } }
    })

    await prisma.activity.create({
      data: {
        customerId: customer.id,
        type: 'other',
        subject: '客户状态变更',
        content: `客户状态已更新为: ${status}`,
        createdById: req.user!.id
      }
    })

    res.json({ status: 'success', data: customer })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.customer.findFirst({ where: { id, deletedAt: null } })

    if (!existing) {
      throw new AppError(404, '客户不存在')
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.id) {
      throw new AppError(403, '无权删除此客户')
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    res.json({ status: 'success', message: '客户已删除' })
  } catch (error) {
    next(error)
  }
})

export { router as customerRouter }
