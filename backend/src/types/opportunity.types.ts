import { z } from 'zod'

export const createOpportunitySchema = z.object({
  name: z.string().min(1, '请输入商机名称'),
  customerId: z.string().uuid('请选择关联客户'),
  stage: z.string().default('initial'),
  probability: z.number().int().min(0).max(100).default(10),
  amount: z.number().min(0).default(0),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  description: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
})

export const updateOpportunitySchema = createOpportunitySchema.partial().omit({ customerId: true })

export const queryOpportunitySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  stage: z.string().optional(),
  priority: z.string().optional(),
  customerId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'amount', 'probability']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>
export type QueryOpportunityInput = z.infer<typeof queryOpportunitySchema>
