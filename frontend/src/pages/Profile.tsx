import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FadeIn } from '@/components/MotionPrimitives'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    position: user?.position || ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiClient.put('/auth/profile', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('个人资料更新成功')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.put('/auth/password', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('密码修改成功')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '修改失败')
    }
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileData)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('请填写完整信息')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('密码至少 8 位')
      return
    }
    if (!/[A-Z]/.test(passwordData.newPassword) || !/[a-z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword)) {
      toast.error('密码需包含大小写字母和数字')
      return
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <FadeIn>
        <h1 className="text-2xl font-bold">个人资料</h1>
        <p className="text-muted-foreground">管理您的个人信息和账户安全</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input value={user?.username || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>电话</Label>
                  <Input value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>部门</Label>
                  <Input value={profileData.department} onChange={(e) => setProfileData({ ...profileData, department: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>职位</Label>
                  <Input value={profileData.position} onChange={(e) => setProfileData({ ...profileData, position: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">修改密码</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>当前密码</Label>
                <Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>新密码</Label>
                <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                <p className="text-xs text-muted-foreground">密码需包含大小写字母和数字，至少 8 位</p>
              </div>
              <div className="space-y-2">
                <Label>确认密码</Label>
                <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? '修改中...' : '修改密码'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
