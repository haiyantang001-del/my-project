import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import type { User, DictItem, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Edit, Key, UserX, UserCheck, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/MotionPrimitives'

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'user' as 'admin' | 'user'
  })

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const response = await apiClient.get(`/users?page=${page}`)
      return response.data.data as PaginatedResponse<User>
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/users', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户创建成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiClient.put(`/users/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户更新成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiClient.put(`/users/${id}/status`, { isActive })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('状态更新成功')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '操作失败')
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      const response = await apiClient.put(`/users/${id}/password`, { newPassword: password })
      return response.data
    },
    onSuccess: () => {
      toast.success('密码重置成功')
      setShowPasswordDialog(false)
      setNewPassword('')
      setResetPasswordUserId('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '重置失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    }
  })

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      role: 'user'
    })
    setEditingUser(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      position: user.position || '',
      role: user.role
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('请输入姓名')
      return
    }
    if (!editingUser && !formData.password) {
      toast.error('请输入密码')
      return
    }
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('密码至少 8 位')
      return
    }
    resetPasswordMutation.mutate({ id: resetPasswordUserId, password: newPassword })
  }

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      toast.error('不能删除自己的账号')
      return
    }
    if (confirm('确定要删除此用户吗？')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">用户管理</h1>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增用户
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">加载中...</TableCell>
                  </TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">暂无数据</TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {user.isActive ? '正常' : '已禁用'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => {
                            setResetPasswordUserId(user.id)
                            setShowPasswordDialog(true)
                          }}>
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => toggleStatusMutation.mutate({ id: user.id, isActive: !user.isActive })}>
                            {user.isActive ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-success" />}
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用户名 *</Label>
                <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} disabled={!!editingUser} />
              </div>
              <div className="space-y-2">
                <Label>姓名 *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>密码 *</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <p className="text-xs text-muted-foreground">密码需包含大小写字母和数字，至少 8 位</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>电话</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>部门</Label>
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>职位</Label>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as 'admin' | 'user' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">普通用户</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">密码需包含大小写字母和数字，至少 8 位</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>取消</Button>
              <Button onClick={handleResetPassword} disabled={resetPasswordMutation.isPending}>确认</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function DictManagement() {
  const queryClient = useQueryClient()
  
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<DictItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('customer_source')
  const [formData, setFormData] = useState({
    category: 'customer_source',
    code: '',
    label: '',
    value: '',
    sortOrder: 0,
    isActive: true
  })

  const { data: dictData, isLoading } = useQuery({
    queryKey: ['dict'],
    queryFn: async () => {
      const response = await apiClient.get('/dict')
      return response.data.data as Record<string, DictItem[]>
    }
  })

  const categories = Object.keys(dictData || {})
  const currentItems = dictData?.[selectedCategory] || []

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/dict', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dict'] })
      toast.success('字典项创建成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiClient.put(`/dict/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dict'] })
      toast.success('字典项更新成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/dict/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dict'] })
      toast.success('字典项已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    }
  })

  const resetForm = () => {
    setFormData({
      category: selectedCategory,
      code: '',
      label: '',
      value: '',
      sortOrder: 0,
      isActive: true
    })
    setEditingItem(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleOpenEdit = (item: DictItem) => {
    setEditingItem(item)
    setFormData({
      category: item.category,
      code: item.code,
      label: item.label,
      value: item.value || '',
      sortOrder: item.sortOrder,
      isActive: item.isActive
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || !formData.label.trim()) {
      toast.error('请填写完整信息')
      return
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const categoryLabels: Record<string, string> = {
    customer_source: '客户来源',
    industry: '客户行业',
    company_size: '公司规模',
    customer_status: '客户状态',
    opportunity_stage: '商机阶段',
    opportunity_priority: '商机优先级',
    contract_status: '合同状态',
    payment_method: '付款方式',
    activity_type: '活动类型'
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">数据字典</h1>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增字典项
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {categoryLabels[cat] || cat}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>编码</TableHead>
                  <TableHead>显示名称</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">加载中...</TableCell>
                  </TableRow>
                ) : currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">暂无数据</TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.label}</TableCell>
                      <TableCell>{item.sortOrder}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {item.isActive ? '启用' : '禁用'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => {
                            if (confirm('确定要删除此字典项吗？')) {
                              deleteMutation.mutate(item.id)
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑字典项' : '新增字典项'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>字典类型</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })} disabled={!!editingItem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat] || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>编码 *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} disabled={!!editingItem} />
            </div>
            <div className="space-y-2">
              <Label>显示名称 *</Label>
              <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>排序</Label>
                <Input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={formData.isActive ? 'true' : 'false'} onValueChange={(v) => setFormData({ ...formData, isActive: v === 'true' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">启用</SelectItem>
                    <SelectItem value="false">禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
