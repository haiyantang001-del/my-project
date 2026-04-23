import { Router, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { createUserSchema, updateUserSchema, updateUserStatusSchema, resetPasswordSchema, queryUserSchema } from '../types/user.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.use(authMiddleware)
router.use(adminMiddleware)

// 获取用户列表
router.get('/', validateRequest(queryUserSchema, 'query'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, search, role, isActive } = req.query as any

    const where: any = {}

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          position: true,
          role: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
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

// 获取用户详情
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      throw new AppError(404, '用户不存在')
    }

    res.json({ status: 'success', data: user })
  } catch (error) {
    next(error)
  }
})

// 新增用户
router.post('/', validateRequest(createUserSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    const user = await prisma.user.create({
      data: {
        ...req.body,
        password: hashedPassword
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        role: true,
        isActive: true
      }
    })

    res.status(201).json({ status: 'success', data: user })
  } catch (error) {
    next(error)
  }
})

// 更新用户
router.put('/:id', validateRequest(updateUserSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const existing = await prisma.user.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError(404, '用户不存在')
    }

    const user = await prisma.user.update({
      where: { id },
      data: req.body,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        role: true,
        isActive: true
      }
    })

    res.json({ status: 'success', data: user })
  } catch (error) {
    next(error)
  }
})

// 启用/禁用用户
router.put('/:id/status', validateRequest(updateUserStatusSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    // 不能禁用自己
    if (id === req.user!.id) {
      throw new AppError(400, '不能禁用自己的账号')
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        name: true,
        isActive: true
      }
    })

    res.json({ status: 'success', data: user })
  } catch (error) {
    next(error)
  }
})

// 重置密码
router.put('/:id/password', validateRequest(resetPasswordSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    const existing = await prisma.user.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError(404, '用户不存在')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    res.json({ status: 'success', message: '密码已重置' })
  } catch (error) {
    next(error)
  }
})

// 删除用户
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // 不能删除自己
    if (id === req.user!.id) {
      throw new AppError(400, '不能删除自己的账号')
    }

    const existing = await prisma.user.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new AppError(404, '用户不存在')
    }

    await prisma.user.delete({
      where: { id }
    })

    res.json({ status: 'success', message: '用户已删除' })
  } catch (error) {
    next(error)
  }
})

export { router as userRouter }
