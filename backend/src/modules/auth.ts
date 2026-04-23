import { Router, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { env } from '../config/env'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { loginSchema, updateProfileSchema, changePasswordSchema } from '../types/auth.types'
import { validateRequest } from '../middleware/validation'

const router = Router()

router.post('/login', validateRequest(loginSchema), async (req, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      throw new AppError(401, '用户名或密码错误')
    }

    if (!user.isActive) {
      throw new AppError(401, '账号已被禁用')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new AppError(401, '用户名或密码错误')
    }

    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      expiresIn: '7d'
    })

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          department: user.department,
          position: user.position,
          role: user.role
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        role: true,
        createdAt: true
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

router.put('/profile', authMiddleware, validateRequest(updateProfileSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        role: true
      }
    })

    res.json({ status: 'success', data: user })
  } catch (error) {
    next(error)
  }
})

router.put('/password', authMiddleware, validateRequest(changePasswordSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    })

    if (!user) {
      throw new AppError(404, '用户不存在')
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      throw new AppError(400, '当前密码错误')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    })

    res.json({ status: 'success', message: '密码修改成功' })
  } catch (error) {
    next(error)
  }
})

export { router as authRouter }
