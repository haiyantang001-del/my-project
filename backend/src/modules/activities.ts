import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createActivitySchema, updateActivitySchema, queryActivitySchema } from '../types/activity.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.use(authMiddleware)

router.get('/', validateRequest(queryActivitySchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, customerId, type, createdById, sortBy, sortOrder } = req.query as any

    const where: any = {}

    if (req.user!.role !== 'admin') {
      where.createdById = req.user!.id
    }

    if (customerId) where.customerId = String(customerId)
    if (type) where.type = String(type)
    if (createdById) where.createdById = String(createdById)

    const [total, items] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, company: true } },
          createdBy: { select: { id: true, name: true } }
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

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })

    if (!activity) {
      throw new AppError(404, '活动不存在')
    }

    if (req.user!.role !== 'admin' && activity.createdById !== req.user!.id) {
      throw new AppError(403, '无权访问此活动')
    }

    res.json({ status: 'success', data: activity })
  } catch (error) {
    next(error)
  }
})

router.post('/', validateRequest(createActivitySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.body.customerId, deletedAt: null }
    })

    if (!customer) {
      throw new AppError(404, '客户不存在')
    }

    if (req.user!.role !== 'admin' && customer.ownerId !== req.user!.id) {
      throw new AppError(403, '无权为此客户添加活动')
    }

    const activity = await prisma.activity.create({
      data: {
        ...req.body,
        nextFollowUpDate: req.body.nextFollowUpDate ? new Date(req.body.nextFollowUpDate) : null,
        createdById: req.user!.id
      },
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })

    res.status(201).json({ status: 'success', data: activity })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', validateRequest(updateActivitySchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.activity.findUnique({ where: { id } })

    if (!existing) {
      throw new AppError(404, '活动不存在')
    }

    if (req.user!.role !== 'admin' && existing.createdById !== req.user!.id) {
      throw new AppError(403, '无权修改此活动')
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...req.body,
        nextFollowUpDate: req.body.nextFollowUpDate ? new Date(req.body.nextFollowUpDate) : undefined
      },
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })

    res.json({ status: 'success', data: activity })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.activity.findUnique({ where: { id } })

    if (!existing) {
      throw new AppError(404, '活动不存在')
    }

    if (req.user!.role !== 'admin' && existing.createdById !== req.user!.id) {
      throw new AppError(403, '无权删除此活动')
    }

    await prisma.activity.delete({ where: { id } })

    res.json({ status: 'success', message: '活动已删除' })
  } catch (error) {
    next(error)
  }
})

export { router as activityRouter }
