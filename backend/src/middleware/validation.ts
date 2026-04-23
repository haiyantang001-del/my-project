import { Request, Response, NextFunction } from 'express'
import { AnyZodObject } from 'zod'

export const validateRequest = (schema: AnyZodObject, source: 'body' | 'query' = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === 'query' ? req.query : req.body
      const parsed = await schema.parseAsync(data)
      
      if (source === 'query') {
        req.query = parsed
      } else {
        req.body = parsed
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }
}
