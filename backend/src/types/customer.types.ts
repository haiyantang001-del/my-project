import { z } from 'zod'

export const createCustomerSchema = z.object({
  name: z.string().min(1, '请输入客户名称'),
  phone: z.string().optional().nullable(),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  company: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  companySize: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.string().default('potential'),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export const updateCustomerStatusSchema = z.object({
  status: z.string().min(1, '请选择客户状态'),
})

export const queryCustomerSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  industry: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusSchema>
export type QueryCustomerInput = z.infer<typeof queryCustomerSchema>
