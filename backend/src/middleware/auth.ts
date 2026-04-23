import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { prisma } from '../config/database'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    username: string
    role: string
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, '未授权访问，请先登录')
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      throw new AppError(401, '未授权访问，请先登录')
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, isActive: true }
    })

    if (!user) {
      throw new AppError(401, '用户不存在')
    }

    if (!user.isActive) {
      throw new AppError(401, '账号已被禁用')
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Token 无效或已过期'))
    } else {
      next(error)
    }
  }
}

export const adminMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError(403, '无权限访问'))
  }
  next()
}
