import { z } from 'zod'

export const createUserSchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符').max(20),
  password: z.string()
    .min(8, '密码至少 8 位')
    .regex(/[A-Z]/, '密码需包含大写字母')
    .regex(/[a-z]/, '密码需包含小写字母')
    .regex(/[0-9]/, '密码需包含数字'),
  name: z.string().min(1, '请输入姓名'),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  role: z.enum(['admin', 'user']).default('user'),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true })

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
})

export const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, '密码至少 8 位')
    .regex(/[A-Z]/, '密码需包含大写字母')
    .regex(/[a-z]/, '密码需包含小写字母')
    .regex(/[0-9]/, '密码需包含数字'),
})

export const queryUserSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type QueryUserInput = z.infer<typeof queryUserSchema>
