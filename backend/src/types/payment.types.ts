import { z } from 'zod'

export const createPaymentSchema = z.object({
  contractId: z.string().uuid('请选择关联合同'),
  amount: z.number().min(0.01, '回款金额必须大于 0'),
  paymentDate: z.string().min(1, '请选择回款日期'),
  paymentMethod: z.string().optional().nullable(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updatePaymentSchema = createPaymentSchema.partial().omit({ contractId: true })

export const queryPaymentSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  contractId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'paymentDate', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>
export type QueryPaymentInput = z.infer<typeof queryPaymentSchema>
