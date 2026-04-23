import { z } from 'zod'

export const createActivitySchema = z.object({
  customerId: z.string().uuid('请选择关联客户'),
  type: z.enum(['phone', 'meeting', 'email', 'visit', 'demo', 'other']),
  subject: z.string().min(1, '请输入活动主题'),
  content: z.string().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
})

export const updateActivitySchema = createActivitySchema.partial().omit({ customerId: true })

export const queryActivitySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  customerId: z.string().optional(),
  type: z.string().optional(),
  createdById: z.string().optional(),
  sortBy: z.enum(['createdAt', 'nextFollowUpDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type QueryActivityInput = z.infer<typeof queryActivitySchema>
