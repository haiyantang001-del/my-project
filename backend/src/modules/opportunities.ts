import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createOpportunitySchema, updateOpportunitySchema, queryOpportunitySchema } from '../types/opportunity.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.use(authMiddleware)

// 获取商机列表
router.get('/', validateRequest(queryOpportunitySchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, search, stage, priority, customerId, sortBy, sortOrder } = req.query as any

    const where: any = { deletedAt: null }

    if (req.user!.role !== 'admin') {
      where.ownerId = req.user!.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (stage) where.stage = stage
    if (priority) where.priority = priority
    if (customerId) where.customerId = customerId

    const [total, items] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, company: true } },
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

// 获取商机详情
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const opportunity = await prisma.opportunity.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, name: true, company: true } },
        owner: { select: { id: true, name: true } },
        contracts: { where: { deletedAt: null } }
      }
    })

    if (!opportunity) {
      throw new AppError(404, '商机不存在')
    }

    if (req.user!.role !== 'admin' && opportunity.ownerId !== req.user!.id) {
      throw new AppError(403, '无权访问此商机')
    }

    res.json({ status: 'success', data: opportunity })
  } catch (error) {
    next(error)
  }
})

// 新增商机
router.post('/', validateRequest(createOpportunitySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        ...req.body,
        expectedCloseDate: req.body.expectedCloseDate ? new Date(req.body.expectedCloseDate) : null,
        ownerId: req.user!.id
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } }
      }
    })

    res.status(201).json({ status: 'success', data: opportunity })
  } catch (error) {
    next(error)
  }
})

// 更新商机
router.put('/:id', validateRequest(updateOpportunitySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.opportunity.findFirst({
      where: { id, deletedAt: null }
    })

    if (!existing) {
      throw new AppError(404, '商机不存在')
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.id) {
      throw new AppError(403, '无权修改此商机')
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        ...req.body,
        expectedCloseDate: req.body.expectedCloseDate ? new Date(req.body.expectedCloseDate) : undefined
      },
      include: {
        customer: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } }
      }
    })

    res.json({ status: 'success', data: opportunity })
  } catch (error) {
    next(error)
  }
})

// 删除商机
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.opportunity.findFirst({
      where: { id, deletedAt: null }
    })

    if (!existing) {
      throw new AppError(404, '商机不存在')
    }

    if (req.user!.role !== 'admin' && existing.ownerId !== req.user!.id) {
      throw new AppError(403, '无权删除此商机')
    }

    await prisma.opportunity.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    res.json({ status: 'success', message: '商机已删除' })
  } catch (error) {
    next(error)
  }
})

export { router as opportunityRouter }
