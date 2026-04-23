import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import { useDict } from '@/hooks/useDict'
import type { Contract, Customer, Opportunity, PaginatedResponse } from '@/types'
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
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-react'
import { FadeIn } from '@/components/MotionPrimitives'

export default function ContractsPage() {
  const navigate = useNavigate()
  const { getOptions, getLabel } = useDict()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [formData, setFormData] = useState({
    contractNo: '',
    name: '',
    customerId: '',
    opportunityId: '',
    amount: 0,
    startDate: '',
    endDate: '',
    status: 'draft',
    description: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      const response = await apiClient.get(`/contracts?${params}`)
      return response.data.data as PaginatedResponse<Contract>
    }
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-for-select'],
    queryFn: async () => {
      const response = await apiClient.get('/customers?pageSize=1000')
      return response.data.data.items as Customer[]
    }
  })

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities-for-select'],
    queryFn: async () => {
      const response = await apiClient.get('/opportunities?pageSize=1000')
      return response.data.data.items as Opportunity[]
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/contracts', {
        ...data,
        amount: Number(data.amount),
        opportunityId: data.opportunityId || null
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('合同创建成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiClient.put(`/contracts/${id}`, {
        ...data,
        amount: Number(data.amount),
        opportunityId: data.opportunityId || null
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('合同更新成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/contracts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('合同已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    }
  })

  const resetForm = () => {
    setFormData({
      contractNo: '',
      name: '',
      customerId: '',
      opportunityId: '',
      amount: 0,
      startDate: '',
      endDate: '',
      status: 'draft',
      description: ''
    })
    setEditingContract(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleOpenEdit = (contract: Contract) => {
    setEditingContract(contract)
    setFormData({
      contractNo: contract.contractNo,
      name: contract.name,
      customerId: contract.customerId,
      opportunityId: contract.opportunityId || '',
      amount: Number(contract.amount),
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
      status: contract.status,
      description: contract.description || ''
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.contractNo.trim()) {
      toast.error('请输入合同编号')
      return
    }
    if (!formData.name.trim()) {
      toast.error('请输入合同名称')
      return
    }
    if (!formData.customerId) {
      toast.error('请选择关联客户')
      return
    }
    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此合同吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const statusOptions = getOptions('contract_status')

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">合同管理</h1>
            <p className="text-muted-foreground">管理客户合同和回款进度</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增合同
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索合同编号、名称..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="合同状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  {statusOptions.map((opt) => (
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
                  <TableHead>合同编号</TableHead>
                  <TableHead>合同名称</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>已回款</TableHead>
                  <TableHead>状态</TableHead>
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
                  data?.items.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.contractNo}</TableCell>
                      <TableCell>{contract.name}</TableCell>
                      <TableCell>{contract.customer?.name || '-'}</TableCell>
                      <TableCell>¥{Number(contract.amount).toLocaleString()}</TableCell>
                      <TableCell>¥{Number(contract.totalPaid || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                          {getLabel('contract_status', contract.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/contracts/${contract.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(contract)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(contract.id)}>
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
            <DialogTitle>{editingContract ? '编辑合同' : '新增合同'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>合同编号 *</Label>
                <Input value={formData.contractNo} onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })} disabled={!!editingContract} />
              </div>
              <div className="space-y-2">
                <Label>合同名称 *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>关联客户 *</Label>
                <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })} disabled={!!editingContract}>
                  <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>关联商机</Label>
                <Select value={formData.opportunityId} onValueChange={(v) => setFormData({ ...formData, opportunityId: v })}>
                  <SelectTrigger><SelectValue placeholder="可选" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">不关联</SelectItem>
                    {opportunities?.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>合同金额 *</Label>
                <Input type="number" min={0} value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>合同状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期 *</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
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
