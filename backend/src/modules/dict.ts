import { Router, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createDictItemSchema, updateDictItemSchema } from '../types/dict.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.use(authMiddleware)

// 获取所有字典（按类别分组）
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.dictItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    })

    // 按类别分组
    const grouped = items.reduce((acc: Record<string, any[]>, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {})

    res.json({ status: 'success', data: grouped })
  } catch (error) {
    next(error)
  }
})

// 获取指定类别的字典
router.get('/:category', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params

    const items = await prisma.dictItem.findMany({
      where: { category, isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    res.json({ status: 'success', data: items })
  } catch (error) {
    next(error)
  }
})

// 新增字典项（管理员）
router.post('/', adminMiddleware, validateRequest(createDictItemSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.dictItem.create({
      data: req.body
    })

    res.status(201).json({ status: 'success', data: item })
  } catch (error) {
    next(error)
  }
})

// 更新字典项（管理员）
router.put('/:id', adminMiddleware, validateRequest(updateDictItemSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.dictItem.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError(404, '字典项不存在')
    }

    const item = await prisma.dictItem.update({
      where: { id },
      data: req.body
    })

    res.json({ status: 'success', data: item })
  } catch (error) {
    next(error)
  }
})

// 删除字典项（管理员）
router.delete('/:id', adminMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.dictItem.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError(404, '字典项不存在')
    }

    await prisma.dictItem.delete({
      where: { id }
    })

    res.json({ status: 'success', message: '字典项已删除' })
  } catch (error) {
    next(error)
  }
})

export { router as dictRouter }
