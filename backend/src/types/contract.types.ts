import { z } from 'zod'

export const createContractSchema = z.object({
  contractNo: z.string().min(1, '请输入合同编号'),
  name: z.string().min(1, '请输入合同名称'),
  customerId: z.string().uuid('请选择关联客户'),
  opportunityId: z.string().uuid().optional().nullable(),
  amount: z.number().min(0, '合同金额不能为负数'),
  startDate: z.string().min(1, '请选择开始日期'),
  endDate: z.string().optional().nullable(),
  status: z.string().default('draft'),
  description: z.string().optional().nullable(),
})

export const updateContractSchema = createContractSchema.partial().omit({ contractNo: true, customerId: true })

export const queryContractSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'amount', 'startDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateContractInput = z.infer<typeof createContractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>
export type QueryContractInput = z.infer<typeof queryContractSchema>
