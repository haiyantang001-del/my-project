import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useDict } from '@/hooks/useDict'
import type { Activity, Customer, PaginatedResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Phone, Mail, Users, MapPin, Presentation, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/MotionPrimitives'

const activityTypeIcons: Record<string, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  visit: <MapPin className="h-4 w-4" />,
  demo: <Presentation className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
}

export default function ActivitiesPage() {
  const { getOptions, getLabel } = useDict()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState({
    customerId: '',
    type: 'other',
    subject: '',
    content: '',
    nextAction: '',
    nextFollowUpDate: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['activities', page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      if (typeFilter) params.append('type', typeFilter)
      const response = await apiClient.get(`/activities?${params}`)
      return response.data.data as PaginatedResponse<Activity>
    }
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-for-select'],
    queryFn: async () => {
      const response = await apiClient.get('/customers?pageSize=1000')
      return response.data.data.items as Customer[]
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/activities', {
        ...data,
        nextFollowUpDate: data.nextFollowUpDate || null
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('活动创建成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiClient.put(`/activities/${id}`, {
        ...data,
        nextFollowUpDate: data.nextFollowUpDate || null
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('活动更新成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/activities/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      toast.success('活动已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    }
  })

  const resetForm = () => {
    setFormData({
      customerId: '',
      type: 'other',
      subject: '',
      content: '',
      nextAction: '',
      nextFollowUpDate: ''
    })
    setEditingActivity(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleOpenEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      customerId: activity.customerId,
      type: activity.type,
      subject: activity.subject,
      content: activity.content || '',
      nextAction: activity.nextAction || '',
      nextFollowUpDate: activity.nextFollowUpDate ? activity.nextFollowUpDate.split('T')[0] : ''
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customerId) {
      toast.error('请选择关联客户')
      return
    }
    if (!formData.subject.trim()) {
      toast.error('请输入活动主题')
      return
    }
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此活动吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const activityTypeOptions = getOptions('activity_type')

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">业务活动</h1>
            <p className="text-muted-foreground">管理客户跟进记录</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增活动
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="活动类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  {activityTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>主题</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>下次跟进</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">加载中...</TableCell>
                  </TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">暂无数据</TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {activityTypeIcons[activity.type] || <MoreHorizontal className="h-4 w-4" />}
                          </span>
                          <span className="text-sm">{getLabel('activity_type', activity.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{activity.subject}</TableCell>
                      <TableCell>{activity.customer?.name || '-'}</TableCell>
                      <TableCell>{activity.nextFollowUpDate ? new Date(activity.nextFollowUpDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{activity.createdBy?.name || '-'}</TableCell>
                      <TableCell>{new Date(activity.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(activity)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(activity.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {data && data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
                <span className="text-sm text-muted-foreground">第 {page} / {data.totalPages} 页</span>
                <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingActivity ? '编辑活动' : '新增活动'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>关联客户 *</Label>
                <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })} disabled={!!editingActivity}>
                  <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>活动类型</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activityTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>活动主题 *</Label>
              <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>活动内容</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>下一步动作</Label>
              <Input value={formData.nextAction} onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>下次跟进日期</Label>
              <Input type="date" value={formData.nextFollowUpDate} onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })} />
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
