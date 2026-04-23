import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, '请输入姓名').optional(),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string()
    .min(8, '密码至少 8 位')
    .regex(/[A-Z]/, '密码需包含大写字母')
    .regex(/[a-z]/, '密码需包含小写字母')
    .regex(/[0-9]/, '密码需包含数字'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
