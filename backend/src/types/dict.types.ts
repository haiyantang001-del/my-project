import { z } from 'zod'

export const createDictItemSchema = z.object({
  category: z.string().min(1, '请选择字典类型'),
  code: z.string().min(1, '请输入编码'),
  label: z.string().min(1, '请输入显示名称'),
  value: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const updateDictItemSchema = createDictItemSchema.partial().omit({ category: true, code: true })

export const queryDictSchema = z.object({
  category: z.string().optional(),
})

export type CreateDictItemInput = z.infer<typeof createDictItemSchema>
export type UpdateDictItemInput = z.infer<typeof updateDictItemSchema>
export type QueryDictInput = z.infer<typeof queryDictSchema>
