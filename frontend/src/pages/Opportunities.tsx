import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useDict } from '@/hooks/useDict'
import type { Opportunity, Customer, PaginatedResponse } from '@/types'
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
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/MotionPrimitives'

export default function OpportunitiesPage() {
  const { getOptions, getLabel } = useDict()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    customerId: '',
    stage: 'initial',
    probability: 10,
    amount: 0,
    priority: 'medium',
    description: '',
    expectedCloseDate: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', page, search, stageFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      if (search) params.append('search', search)
      if (stageFilter) params.append('stage', stageFilter)
      const response = await apiClient.get(`/opportunities?${params}`)
      return response.data.data as PaginatedResponse<Opportunity>
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
      const response = await apiClient.post('/opportunities', {
        ...data,
        amount: Number(data.amount),
        probability: Number(data.probability)
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.success('商机创建成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiClient.put(`/opportunities/${id}`, {
        ...data,
        amount: Number(data.amount),
        probability: Number(data.probability)
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.success('商机更新成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/opportunities/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.success('商机已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      customerId: '',
      stage: 'initial',
      probability: 10,
      amount: 0,
      priority: 'medium',
      description: '',
      expectedCloseDate: ''
    })
    setEditingOpportunity(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleOpenEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setFormData({
      name: opportunity.name,
      customerId: opportunity.customerId,
      stage: opportunity.stage,
      probability: opportunity.probability,
      amount: Number(opportunity.amount),
      priority: opportunity.priority,
      description: opportunity.description || '',
      expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.split('T')[0] : ''
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('请输入商机名称')
      return
    }
    if (!formData.customerId) {
      toast.error('请选择关联客户')
      return
    }
    if (editingOpportunity) {
      updateMutation.mutate({ id: editingOpportunity.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此商机吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const stageOptions = getOptions('opportunity_stage')
  const priorityOptions = getOptions('opportunity_priority')

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">商机管理</h1>
            <p className="text-muted-foreground">管理销售机会和跟进进度</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增商机
          </Button>
        </div>
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索商机名称..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="商机阶段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部阶段</SelectItem>
                  {stageOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商机名称</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>阶段</TableHead>
                  <TableHead>成功率</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>优先级</TableHead>
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
                  data?.items.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell className="font-medium">{opportunity.name}</TableCell>
                      <TableCell>{opportunity.customer?.name || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-info/10 px-2 py-1 text-xs font-medium text-info">
                          {getLabel('opportunity_stage', opportunity.stage)}
                        </span>
                      </TableCell>
                      <TableCell>{opportunity.probability}%</TableCell>
                      <TableCell>¥{Number(opportunity.amount).toLocaleString()}</TableCell>
                      <TableCell>{getLabel('opportunity_priority', opportunity.priority)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(opportunity)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(opportunity.id)}>
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

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOpportunity ? '编辑商机' : '新增商机'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>商机名称 *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>关联客户 *</Label>
              <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>阶段</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>成功率 (%)</Label>
                <Input type="number" min={0} max={100} value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>预计金额</Label>
                <Input type="number" min={0} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>优先级</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>预计成交日期</Label>
              <Input type="date" value={formData.expectedCloseDate} onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
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
