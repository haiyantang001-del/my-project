import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { useDict } from '@/hooks/useDict'
import type { Customer, PaginatedResponse } from '@/types'
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

export default function CustomersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getOptions, getLabel } = useDict()
  const queryClient = useQueryClient()
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    industry: '',
    companySize: '',
    source: '',
    status: 'potential',
    address: '',
    notes: ''
  })

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, statusFilter, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (sourceFilter) params.append('source', sourceFilter)
      const response = await apiClient.get(`/customers?${params}`)
      return response.data.data as PaginatedResponse<Customer>
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/customers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('客户创建成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiClient.put(`/customers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('客户更新成功')
      setShowDialog(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/customers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('客户已删除')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败')
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      industry: '',
      companySize: '',
      source: '',
      status: 'potential',
      address: '',
      notes: ''
    })
    setEditingCustomer(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      company: customer.company || '',
      industry: customer.industry || '',
      companySize: customer.companySize || '',
      source: customer.source || '',
      status: customer.status,
      address: customer.address || '',
      notes: customer.notes || ''
    })
    setShowDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('请输入客户名称')
      return
    }
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此客户吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const statusOptions = getOptions('customer_status')
  const sourceOptions = getOptions('customer_source')
  const industryOptions = getOptions('industry')
  const companySizeOptions = getOptions('company_size')

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">客户管理</h1>
            <p className="text-muted-foreground">管理您的客户信息和跟进记录</p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增客户
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
                    placeholder="搜索客户名称、公司、电话..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="客户状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="客户来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部来源</SelectItem>
                  {sourceOptions.map((opt) => (
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
                  <TableHead>客户名称</TableHead>
                  <TableHead>公司</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.company || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {getLabel('customer_status', customer.status)}
                        </span>
                      </TableCell>
                      <TableCell>{customer.source ? getLabel('customer_source', customer.source) : '-'}</TableCell>
                      <TableCell>{customer.owner?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/customers/${customer.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(customer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {page} / {data.totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? '编辑客户' : '新增客户'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">客户名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入客户名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入电话"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">公司</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="请输入公司名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">行业</Label>
                <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择行业" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">公司规模</Label>
                <Select value={formData.companySize} onValueChange={(v) => setFormData({ ...formData, companySize: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择规模" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">客户来源</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择来源" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">客户状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="请输入地址"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="请输入备注"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
