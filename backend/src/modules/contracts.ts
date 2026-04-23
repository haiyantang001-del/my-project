import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createContractSchema, updateContractSchema, queryContractSchema } from '../types/contract.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.use(authMiddleware)

router.get('/', validateRequest(queryContractSchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, search, status, customerId, sortBy, sortOrder } = req.query as any

    const where: any = { deletedAt: null }

    if (req.user!.role !== 'admin') {
      where.ownerId = req.user!.id
    }

    if (search) {
      where.OR = [
        { contractNo: { contains: String(search), mode: 'insensitive' } },
        { name: { contains: String(search), mode: 'insensitive' } },
        { customer: { name: { contains: String(search), mode: 'insensitive' } } }
      ]
    }

    if (status) where.status = String(status)
    if (customerId) where.customerId = String(customerId)

    const [total, items] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, company: true } },
          opportunity: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
          payments: { select: { amount: true } }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    const contractsWithStats = items.map(c => ({
      ...c,
      totalPaid: c.payments.reduce((sum: number, p) => sum + Number(p.amount), 0),
      remainingAmount: Number(c.amount) - c.payments.reduce((sum: number, p) => sum + Number(p.amount), 0)
    }))

    res.json({
      status: 'success',
      data: { items: contractsWithStats, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const contract = await prisma.contract.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, company: true, phone: true, email: true } },
        opportunity: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        payments: {
          include: { receivedBy: { select: { id: true, name: true } } },
          orderBy: { paymentDate: 'desc' }
        }
      }
    })

    if (!contract) {
      throw new AppError(404, '合同不存在')
    }

    if (req.user!.role !== 'admin' && contract.ownerId !== req.user!.id) {
      throw new AppError(403, '无权访问此合同')
    }

    const totalPaid = contract.payments.reduce((sum: number, p) => sum + Number(p.amount), 0)

    res.json({
      status: 'success',
      data: { ...contract, totalPaid, remainingAmount: Number(contract.amount) - totalPaid }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', validateRequest(createContractSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const contract = await prisma.contract.create({
      data: {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        opportunityId: req.body.opportunityId || null,
        ownerId: req.user!.id
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } }
      }
    })

    res.status(201).json({ status: 'success', data: contract })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', validateRequest(updateContractSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.contract.findFirst({ where: { id, deletedAt: null } })

    if (!existing) {
      throw new AppError(404, '合同不存在')
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.id) {
      throw new AppError(403, '无权修改此合同')
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        opportunityId: req.body.opportunityId || null
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } }
      }
    })

    res.json({ status: 'success', data: contract })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.contract.findFirst({ where: { id, deletedAt: null } })

    if (!existing) {
      throw new AppError(404, '合同不存在')
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.id) {
      throw new AppError(403, '无权删除此合同')
    }

    await prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    res.json({ status: 'success', message: '合同已删除' })
  } catch (error) {
    next(error)
  }
})

export { router as contractRouter }
